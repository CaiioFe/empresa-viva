import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { useEmpresaAtiva } from '@/app/sessao'
import { useCriarConviteDisc, useDiscDoColaborador } from '@/features/disc/api'
import type { Colaborador, Papel } from '@/lib/tipos'
import {
  useColaborador,
  useDesligarColaborador,
  useEditarColaborador,
  useIntegracaoDoColaborador,
  useJornada,
  useMarcarEtapa,
  usePessoas,
  useRegistrarEvento,
} from './api'
import { consulta, mutacao, vinculo } from './dubles-de-teste'
import { PaginaFicha } from './pagina-ficha'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn(), useSessao: vi.fn() }))
vi.mock('./api', () => ({
  useColaborador: vi.fn(),
  useJornada: vi.fn(),
  useIntegracaoDoColaborador: vi.fn(),
  usePessoas: vi.fn(),
  useEditarColaborador: vi.fn(),
  useDesligarColaborador: vi.fn(),
  useRegistrarEvento: vi.fn(),
  useMarcarEtapa: vi.fn(),
}))
vi.mock('@/features/disc/api', () => ({ useDiscDoColaborador: vi.fn(), useCriarConviteDisc: vi.fn() }))

const ANA: Colaborador = {
  id: 'ana',
  empresa_id: 'empresa-1',
  nome: 'Ana Souza',
  funcao: 'Vendedora',
  setor: 'Loja',
  data_entrada: '2026-02-10',
  telefone: '(11) 98765-4321',
  email: 'ana@exemplo.com',
  situacao: 'ativo',
  data_saida: null,
}

const ETAPAS = [
  { id: 'e1', empresa_id: 'empresa-1', nome: 'Boas-vindas', ordem: 1, ativa: true },
  { id: 'e2', empresa_id: 'empresa-1', nome: 'Segurança', ordem: 2, ativa: true },
]

let marcar: ReturnType<typeof mutacao>
let criarConvite: ReturnType<typeof mutacao>

function abrir(papel: Papel) {
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo(papel))
  return render(
    <MemoryRouter initialEntries={['/pessoas/ana']}>
      <Routes>
        <Route path="/pessoas/:id" element={<PaginaFicha />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  marcar = mutacao()
  criarConvite = mutacao()
  vi.mocked(useColaborador).mockReturnValue(consulta(ANA))
  vi.mocked(useJornada).mockReturnValue(
    consulta([
      { id: 'v1', empresa_id: 'empresa-1', colaborador_id: 'ana', data: '2026-02-10', tipo: 'contratacao', texto: 'Contratada' },
      { id: 'v2', empresa_id: 'empresa-1', colaborador_id: 'ana', data: '2026-05-10', tipo: 'avaliacao', texto: 'Avaliação de 90 dias' },
    ]),
  )
  vi.mocked(useIntegracaoDoColaborador).mockReturnValue(
    consulta({ etapas: ETAPAS, concluidas: [{ colaborador_id: 'ana', etapa_id: 'e1', concluida_em: '2026-02-11T12:00:00Z' }] }),
  )
  vi.mocked(usePessoas).mockReturnValue(consulta({ totalDeEtapas: 2, pessoas: [] }))
  vi.mocked(useEditarColaborador).mockReturnValue(mutacao() as never)
  vi.mocked(useDesligarColaborador).mockReturnValue(mutacao() as never)
  vi.mocked(useRegistrarEvento).mockReturnValue(mutacao() as never)
  vi.mocked(useMarcarEtapa).mockReturnValue(marcar as never)
  vi.mocked(useCriarConviteDisc).mockReturnValue(criarConvite as never)
  vi.mocked(useDiscDoColaborador).mockReturnValue(consulta({ resultado: null, convitePendente: null }))
})

test('mostra o cabeçalho e a jornada do mais novo para o mais antigo', () => {
  abrir('rh')
  expect(screen.getByRole('heading', { name: 'Ana Souza' })).toBeInTheDocument()
  expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument()
  const itens = within(screen.getByRole('list', { name: 'Jornada' })).getAllByRole('listitem')
  expect(itens[0]).toHaveTextContent('Avaliação de 90 dias')
})

test('Consultora vê "Registrar na jornada" mas não edita nem manda o DISC', () => {
  abrir('consultora')
  expect(screen.getByRole('button', { name: /registrar na jornada/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /editar dados/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /enviar teste disc/i })).not.toBeInTheDocument()
  for (const caixa of screen.getAllByRole('checkbox')) expect(caixa).toBeDisabled()
})

test('ficha sem DISC mostra "Enviar teste DISC" e cria o convite', async () => {
  abrir('rh')
  await userEvent.click(screen.getByRole('button', { name: 'Enviar teste DISC' }))
  expect(criarConvite.mutate).toHaveBeenCalledWith({ colaboradorId: 'ana' })
})

test('convite pendente mostra o link, copiar e WhatsApp', () => {
  vi.mocked(useDiscDoColaborador).mockReturnValue(
    consulta({
      resultado: null,
      convitePendente: { id: 'c1', colaborador_id: 'ana', token: 'tok-123', criado_em: '2026-09-20T12:00:00Z', respondido_em: null },
    }),
  )
  abrir('rh')
  expect(screen.getByText('Aguardando resposta')).toBeInTheDocument()
  expect(screen.getByLabelText('Link do teste DISC')).toHaveValue(`${window.location.origin}/disc/tok-123`)
  expect(screen.getByRole('button', { name: /copiar link/i })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /enviar no whatsapp/i })).toHaveAttribute(
    'href',
    expect.stringMatching(/^https:\/\/wa\.me\/5511987654321\?text=/),
  )
})

test('ficha com DISC mostra a letra e as quatro barras', () => {
  vi.mocked(useDiscDoColaborador).mockReturnValue(
    consulta({
      resultado: { id: 'r1', colaborador_id: 'ana', d: 20, i: 50, s: 21, c: 9, predominante: 'I', respondido_em: '2026-09-21T12:00:00Z' },
      convitePendente: null,
    }),
  )
  abrir('rh')
  expect(screen.getByText('Influência')).toBeInTheDocument()
  const barras = screen.getAllByRole('meter')
  expect(barras).toHaveLength(4)
  expect(screen.getByRole('meter', { name: 'Influência' })).toHaveAttribute('aria-valuenow', '50')
  expect(screen.getByText('50%')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /enviar teste disc/i })).not.toBeInTheDocument()
})

test('marcar a última etapa avisa que fecha a integração', async () => {
  abrir('rh')
  await userEvent.click(screen.getByRole('checkbox', { name: /segurança/i }))
  expect(marcar.mutate).toHaveBeenCalledWith(
    expect.objectContaining({ etapaId: 'e2', concluida: true, fechaIntegracao: true }),
  )
})

test('colaborador que não existe', () => {
  vi.mocked(useColaborador).mockReturnValue(consulta(null))
  abrir('rh')
  expect(screen.getByText('Colaborador não encontrado')).toBeInTheDocument()
})
