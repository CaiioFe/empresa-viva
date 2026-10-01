import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { useEmpresaAtiva, useSessao } from '@/app/sessao'
import { consulta, mutacao, vinculo } from '@/features/pessoas/dubles-de-teste'
import { useCriarEtapa, useEditarEtapa, useEditarMembro, useEtapas, useMembros, useReordenarEtapas } from './api'
import { PaginaConfiguracoes } from './pagina-configuracoes'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn(), useSessao: vi.fn() }))
vi.mock('./api', () => ({
  useEtapas: vi.fn(),
  useCriarEtapa: vi.fn(),
  useEditarEtapa: vi.fn(),
  useReordenarEtapas: vi.fn(),
  useMembros: vi.fn(),
  useEditarMembro: vi.fn(),
}))

let criar: ReturnType<typeof mutacao>
let editarEtapa: ReturnType<typeof mutacao>
let reordenar: ReturnType<typeof mutacao>
let editarMembro: ReturnType<typeof mutacao>

beforeEach(() => {
  criar = mutacao()
  editarEtapa = mutacao()
  reordenar = mutacao()
  editarMembro = mutacao()
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo('dono'))
  vi.mocked(useSessao).mockReturnValue({ usuario: { id: 'eu' } } as never)
  vi.mocked(useEtapas).mockReturnValue(
    consulta([
      { id: 'e1', empresa_id: 'empresa-1', nome: 'Boas-vindas', ordem: 1, ativa: true },
      { id: 'e2', empresa_id: 'empresa-1', nome: 'Segurança', ordem: 2, ativa: true },
    ]),
  )
  vi.mocked(useCriarEtapa).mockReturnValue(criar as never)
  vi.mocked(useEditarEtapa).mockReturnValue(editarEtapa as never)
  vi.mocked(useReordenarEtapas).mockReturnValue(reordenar as never)
  vi.mocked(useMembros).mockReturnValue(
    consulta([
      { id: 'm1', empresa_id: 'empresa-1', usuario_id: 'eu', papel: 'dono', nome: 'Dona Maria', ativo: true },
      { id: 'm2', empresa_id: 'empresa-1', usuario_id: 'outro', papel: 'rh', nome: 'Rafa do RH', ativo: true },
    ]),
  )
  vi.mocked(useEditarMembro).mockReturnValue(editarMembro as never)
})

test('explica que usuário novo é com a Maestria', () => {
  render(<PaginaConfiguracoes />)
  expect(screen.getByText(/para incluir alguém, fale com a maestria/i)).toBeInTheDocument()
})

test('a própria linha não tem controles; a dos outros tem', async () => {
  render(<PaginaConfiguracoes />)
  const minha = screen.getByText('Dona Maria').closest('li')!
  expect(within(minha).queryByRole('combobox')).not.toBeInTheDocument()
  expect(within(minha).queryByRole('button')).not.toBeInTheDocument()

  const outra = screen.getByText('Rafa do RH').closest('li')!
  await userEvent.selectOptions(within(outra).getByRole('combobox'), 'financeiro')
  expect(editarMembro.mutate).toHaveBeenCalledWith({ id: 'm2', papel: 'financeiro' })
  await userEvent.click(within(outra).getByRole('button', { name: 'Desativar' }))
  expect(editarMembro.mutate).toHaveBeenCalledWith({ id: 'm2', ativo: false })
})

test('cria etapa no fim da lista', async () => {
  render(<PaginaConfiguracoes />)
  await userEvent.type(screen.getByLabelText('Nova etapa'), 'Treinamento do sistema')
  await userEvent.click(screen.getByRole('button', { name: /adicionar/i }))
  expect(criar.mutate).toHaveBeenCalledWith({ nome: 'Treinamento do sistema', ordem: 3 }, expect.anything())
})

test('desce uma etapa e desativa outra', async () => {
  render(<PaginaConfiguracoes />)
  await userEvent.click(screen.getByRole('button', { name: 'Descer Boas-vindas' }))
  expect(reordenar.mutate).toHaveBeenCalledWith([
    { id: 'e2', ordem: 1 },
    { id: 'e1', ordem: 2 },
  ])
  const segunda = screen.getByLabelText('Etapa 2').closest('li')!
  await userEvent.click(within(segunda).getByRole('button', { name: 'Desativar' }))
  expect(editarEtapa.mutate).toHaveBeenCalledWith({ id: 'e2', ativa: false })
})
