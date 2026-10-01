import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEmpresaAtiva } from '@/app/sessao'
import type { Lancamento, Papel } from '@/lib/tipos'
import * as api from './api'
import { categoria, CATEGORIAS, consulta, mutacao, renderizarEm, vinculo } from './dubles-de-teste'
import { PaginaCategorias } from './pagina-categorias'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn() }))
vi.mock('./api')

const pendente = (id: string, descricao: string): Lancamento => ({
  id,
  empresa_id: 'empresa-teste',
  data: '2026-03-01',
  descricao,
  valor: -100,
  categoria_id: null,
  origem: 'planilha',
  carga_id: 'c1',
})

function preparar(papel: Papel) {
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo(papel))
  vi.mocked(api.useCategorias).mockReturnValue(consulta([...CATEGORIAS, categoria('antiga', 'Antiga', 'pagamentos_operacionais', 4, false)]))
  vi.mocked(api.useRegras).mockReturnValue(
    consulta([{ id: 'r1', empresa_id: 'empresa-teste', contem: 'aluguel', categoria_id: 'aluguel' }]),
  )
  vi.mocked(api.useLancamentosSemCategoria).mockReturnValue(
    consulta([pendente('p1', 'CONTA ENERGIA 03'), pendente('p2', 'Energia loja 2'), pendente('p3', 'Tarifa')]),
  )
  const m = {
    criarRegra: mutacao({ classificados: 2 }),
    excluirRegra: mutacao(),
    criarCategoria: mutacao(),
    editar: mutacao(),
    reordenar: mutacao(),
  }
  vi.mocked(api.useCriarRegra).mockReturnValue(m.criarRegra as never)
  vi.mocked(api.useExcluirRegra).mockReturnValue(m.excluirRegra as never)
  vi.mocked(api.useCriarCategoria).mockReturnValue(m.criarCategoria as never)
  vi.mocked(api.useEditarCategoria).mockReturnValue(m.editar as never)
  vi.mocked(api.useReordenarCategorias).mockReturnValue(m.reordenar as never)
  return m
}

test('mostra os grupos com as categorias em ordem e a regra existente', () => {
  preparar('dono')
  renderizarEm('/caixa/categorias', <PaginaCategorias />)
  const pagamentos = within(screen.getByRole('region', { name: 'Pagamentos operacionais' }))
  const nomes = pagamentos.getAllByRole('listitem').map((li) => li.textContent)
  expect(nomes[0]).toContain('Pessoal')
  expect(nomes[1]).toContain('Aluguel')
  expect(pagamentos.getByText('Desativada')).toBeInTheDocument()
  expect(within(screen.getByRole('list', { name: 'Regras' })).getByText('“aluguel”')).toBeInTheDocument()
})

test('criar regra mostra quantos pendentes batem, chama a mutação e diz quantos classificou', async () => {
  const m = preparar('financeiro')
  renderizarEm('/caixa/categorias', <PaginaCategorias />)
  await userEvent.type(screen.getByLabelText('Se a descrição contém'), 'energia')
  expect(screen.getByText('Esta regra classificaria agora 2 lançamentos sem categoria.')).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByLabelText('Vai para'), 'aluguel')
  await userEvent.click(screen.getByRole('button', { name: 'Criar regra' }))
  expect(m.criarRegra.mutateAsync).toHaveBeenCalledWith({ contem: 'energia', categoria_id: 'aluguel' })
  expect(await screen.findByText(/2 lançamentos sem categoria foram classificados na hora/)).toBeInTheDocument()
})

test('subir uma categoria grava a ordem nova das duas', async () => {
  const m = preparar('dono')
  renderizarEm('/caixa/categorias', <PaginaCategorias />)
  await userEvent.click(screen.getByRole('button', { name: 'Subir Aluguel' }))
  expect(m.reordenar.mutateAsync).toHaveBeenCalledWith([
    { id: 'aluguel', ordem: 1 },
    { id: 'pessoal', ordem: 2 },
  ])
})

test('criar categoria entra no fim do grupo e desativar chama a edição', async () => {
  const m = preparar('dono')
  renderizarEm('/caixa/categorias', <PaginaCategorias />)
  const pagamentos = within(screen.getByRole('region', { name: 'Pagamentos operacionais' }))
  await userEvent.type(pagamentos.getByLabelText('Nova categoria em pagamentos operacionais'), 'Frete')
  await userEvent.click(pagamentos.getByRole('button', { name: 'Criar' }))
  expect(m.criarCategoria.mutateAsync).toHaveBeenCalledWith({ nome: 'Frete', grupo: 'pagamentos_operacionais', ordem: 5 })

  const aluguel = pagamentos.getByText('Aluguel').closest('li')!
  await userEvent.click(within(aluguel).getByRole('button', { name: 'Desativar' }))
  expect(m.editar.mutateAsync).toHaveBeenCalledWith({ id: 'aluguel', ativa: false })
})

test('consultora vê tudo sem os botões', () => {
  preparar('consultora')
  renderizarEm('/caixa/categorias', <PaginaCategorias />)
  expect(screen.getByText('Pessoal')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Criar regra' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Renomear' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Se a descrição contém')).not.toBeInTheDocument()
})
