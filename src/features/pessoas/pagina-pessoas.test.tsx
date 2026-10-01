import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { useEmpresaAtiva } from '@/app/sessao'
import type { Papel } from '@/lib/tipos'
import { useCriarColaborador, usePessoas, type PessoaDaLista } from './api'
import { consulta, consultaComErro, consultaCarregando, mutacao, vinculo } from './dubles-de-teste'
import { PaginaPessoas } from './pagina-pessoas'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn(), useSessao: vi.fn() }))
vi.mock('./api', () => ({ usePessoas: vi.fn(), useCriarColaborador: vi.fn() }))

function pessoa(nome: string, extra: Partial<PessoaDaLista> = {}): PessoaDaLista {
  return {
    id: nome,
    empresa_id: 'empresa-1',
    nome,
    funcao: 'Vendedora',
    setor: 'Loja',
    data_entrada: '2026-02-10',
    telefone: null,
    email: null,
    situacao: 'ativo',
    data_saida: null,
    etapasConcluidas: 0,
    letraDisc: null,
    ...extra,
  }
}

const PESSOAS = [
  pessoa('Cláudia Reis', { etapasConcluidas: 4, letraDisc: 'D' }),
  pessoa('Marcos Tavares', { setor: 'Estoque', funcao: 'Estoquista', etapasConcluidas: 2 }),
  pessoa('Pedro Lins', { situacao: 'desligado', data_saida: '2026-08-01' }),
]

function abrir(papel: Papel) {
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo(papel))
  vi.mocked(useCriarColaborador).mockReturnValue(mutacao() as never)
  return render(
    <MemoryRouter>
      <PaginaPessoas />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(usePessoas).mockReturnValue(consulta({ totalDeEtapas: 4, pessoas: PESSOAS }))
})

test('RH vê o botão de novo colaborador', () => {
  abrir('rh')
  expect(screen.getByRole('button', { name: /novo colaborador/i })).toBeInTheDocument()
})

test('Consultora não vê o botão de novo colaborador', () => {
  abrir('consultora')
  expect(screen.queryByRole('button', { name: /novo colaborador/i })).not.toBeInTheDocument()
})

test('lista os ativos com a integração e o DISC', () => {
  abrir('dono')
  const tabela = screen.getByRole('table')
  expect(within(tabela).getByText('Cláudia Reis')).toBeInTheDocument()
  expect(within(tabela).queryByText('Pedro Lins')).not.toBeInTheDocument()
  expect(within(tabela).getByText('Concluída')).toBeInTheDocument()
  expect(within(tabela).getByText('Em andamento')).toBeInTheDocument()
  expect(within(tabela).getByLabelText('DISC D')).toBeInTheDocument()
  expect(within(tabela).getByLabelText('Sem DISC')).toBeInTheDocument()
})

test('números do topo: ativos, em integração, DISC feito e sem DISC', () => {
  abrir('dono')
  const bloco = (rotulo: string) => screen.getByText(rotulo, { selector: 'span' }).closest('[data-kpi]')
  expect(bloco('Colaboradores')).toHaveTextContent('2')
  expect(bloco('Em integração')).toHaveTextContent('1')
  expect(bloco('DISC feito')).toHaveTextContent('50%')
  expect(bloco('Sem DISC')).toHaveTextContent('1')
})

test('busca pelo nome sem acento', async () => {
  abrir('dono')
  await userEvent.type(screen.getByLabelText('Buscar'), 'claudia')
  const tabela = screen.getByRole('table')
  expect(within(tabela).getByText('Cláudia Reis')).toBeInTheDocument()
  expect(within(tabela).queryByText('Marcos Tavares')).not.toBeInTheDocument()
})

test('filtro de situação mostra os desligados', async () => {
  abrir('dono')
  await userEvent.selectOptions(screen.getByLabelText('Situação'), 'desligado')
  expect(within(screen.getByRole('table')).getByText('Pedro Lins')).toBeInTheDocument()
})

test('cadastro manda os dados do formulário', async () => {
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo('rh'))
  const criar = mutacao()
  vi.mocked(useCriarColaborador).mockReturnValue(criar as never)
  render(
    <MemoryRouter>
      <PaginaPessoas />
    </MemoryRouter>,
  )
  await userEvent.click(screen.getByRole('button', { name: /novo colaborador/i }))
  await userEvent.type(screen.getByLabelText('Nome'), 'Ana Souza')
  await userEvent.type(screen.getByLabelText('Telefone'), '11 98765-4321')
  await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))
  expect(criar.mutate).toHaveBeenCalledWith(
    expect.objectContaining({ nome: 'Ana Souza', telefone: '11 98765-4321', email: null }),
    expect.anything(),
  )
})

test('carregando, erro e vazio', () => {
  vi.mocked(usePessoas).mockReturnValue(consultaCarregando())
  const { unmount } = abrir('dono')
  expect(screen.getByRole('status')).toHaveTextContent(/carregando/i)
  unmount()

  vi.mocked(usePessoas).mockReturnValue(consultaComErro())
  const segundo = abrir('dono')
  expect(screen.getByRole('alert')).toBeInTheDocument()
  segundo.unmount()

  vi.mocked(usePessoas).mockReturnValue(consulta({ totalDeEtapas: 0, pessoas: [] }))
  abrir('dono')
  expect(screen.getByText('Nenhum colaborador ainda')).toBeInTheDocument()
})
