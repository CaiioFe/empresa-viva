import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEmpresaAtiva } from '@/app/sessao'
import type { Lancamento, Papel } from '@/lib/tipos'
import * as api from './api'
import { CATEGORIAS, consulta, mutacao, renderizarEm, vinculo } from './dubles-de-teste'
import { PaginaLancamentos } from './pagina-lancamentos'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn() }))
vi.mock('./api')

const lanc = (id: string, data: string, descricao: string, valor: number, categoria_id: string | null, origem: Lancamento['origem'] = 'planilha'): Lancamento => ({
  id,
  empresa_id: 'empresa-teste',
  data,
  descricao,
  valor,
  categoria_id,
  origem,
  carga_id: origem === 'planilha' ? 'carga-1' : null,
})

const LANCAMENTOS = [
  lanc('a', '2026-03-02', 'Venda balcão', 1500, 'vendas'),
  lanc('b', '2026-03-05', 'PIX ENERGIA SUL 03/26', -380, null),
  lanc('c', '2026-03-09', 'Conserto da porta', -250, 'aluguel', 'manual'),
  lanc('d', '2026-02-10', 'Aluguel fevereiro', -2000, 'aluguel'),
]

function preparar(papel: Papel) {
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo(papel))
  vi.mocked(api.useExtremosDasDatas).mockReturnValue(consulta({ primeira: '2026-02-10', ultima: '2026-03-09' }))
  vi.mocked(api.useCategorias).mockReturnValue(consulta(CATEGORIAS))
  vi.mocked(api.useLancamentosDoAno).mockReturnValue(consulta(LANCAMENTOS))
  vi.mocked(api.useCargas).mockReturnValue(
    consulta([{ id: 'carga-1', empresa_id: 'empresa-teste', arquivo: 'extrato-marco.csv', linhas: 3, criado_em: '2026-03-10T12:00:00Z' }]),
  )
  const m = {
    classificar: mutacao(),
    criarRegra: mutacao({ classificados: 1 }),
    criar: mutacao(),
    excluir: mutacao(),
    desfazer: mutacao(),
  }
  vi.mocked(api.useClassificarLancamento).mockReturnValue(m.classificar as never)
  vi.mocked(api.useCriarRegra).mockReturnValue(m.criarRegra as never)
  vi.mocked(api.useCriarLancamento).mockReturnValue(m.criar as never)
  vi.mocked(api.useExcluirLancamento).mockReturnValue(m.excluir as never)
  vi.mocked(api.useDesfazerCarga).mockReturnValue(m.desfazer as never)
  return m
}

test('abre no último mês com dado e mostra entrada em verde', () => {
  preparar('dono')
  renderizarEm('/caixa/lancamentos', <PaginaLancamentos />)
  expect(screen.getByText('Lançamentos em março de 2026')).toBeInTheDocument()
  const tabela = within(screen.getByRole('table', { name: 'Lançamentos' }))
  expect(tabela.getByText('Venda balcão')).toBeInTheDocument()
  expect(tabela.queryByText('Aluguel fevereiro')).not.toBeInTheDocument()
  expect(tabela.getByText('+ R$ 1.500,00')).toHaveClass('text-bom')
  expect(screen.getByText(/1 lançamento está sem categoria/)).toBeInTheDocument()
})

test('dono vê o botão de novo lançamento; consultora não vê nem os botões de ação', () => {
  preparar('dono')
  const { unmount } = renderizarEm('/caixa/lancamentos', <PaginaLancamentos />)
  expect(screen.getByRole('button', { name: 'Novo lançamento' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Excluir' })).toBeInTheDocument()
  unmount()

  preparar('consultora')
  renderizarEm('/caixa/lancamentos', <PaginaLancamentos />)
  expect(screen.queryByRole('button', { name: 'Novo lançamento' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Desfazer esta importação' })).not.toBeInTheDocument()
})

test('só lançamento manual tem o botão de excluir', () => {
  preparar('dono')
  renderizarEm('/caixa/lancamentos', <PaginaLancamentos />)
  expect(screen.getAllByRole('button', { name: 'Excluir' })).toHaveLength(1)
})

test('na fila, classificar numa linha chama a mutação com a categoria', async () => {
  const m = preparar('dono')
  renderizarEm('/caixa/lancamentos?ano=2026&mes=todos&categoria=sem', <PaginaLancamentos />)
  expect(screen.getByText('Fila sem categoria em 2026')).toBeInTheDocument()
  await userEvent.selectOptions(screen.getByLabelText('Categoria de PIX ENERGIA SUL 03/26'), 'aluguel')
  expect(m.classificar.mutateAsync).toHaveBeenCalledWith({ id: 'b', categoria_id: 'aluguel' })
})

test('virar regra abre a descrição para editar e cria a regra', async () => {
  const m = preparar('dono')
  renderizarEm('/caixa/lancamentos?ano=2026&mes=2&categoria=sem', <PaginaLancamentos />)
  await userEvent.click(screen.getByRole('button', { name: 'Virar regra' }))
  const trecho = screen.getByLabelText('Se a descrição contém')
  expect(trecho).toHaveValue('PIX ENERGIA SUL 03/26')
  await userEvent.clear(trecho)
  await userEvent.type(trecho, 'energia sul')
  await userEvent.selectOptions(screen.getByLabelText('Vai para'), 'aluguel')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar regra' }))
  expect(m.criarRegra.mutateAsync).toHaveBeenCalledWith({ contem: 'energia sul', categoria_id: 'aluguel' })
  expect(await screen.findByText(/1 lançamento foi classificado na hora/)).toBeInTheDocument()
})

test('novo lançamento de saída grava o valor negativo', async () => {
  const m = preparar('financeiro')
  renderizarEm('/caixa/lancamentos', <PaginaLancamentos />)
  await userEvent.click(screen.getByRole('button', { name: 'Novo lançamento' }))
  const data = screen.getByLabelText('Data')
  await userEvent.clear(data)
  await userEvent.type(data, '2026-03-15')
  await userEvent.type(screen.getByLabelText('Descrição'), 'Troca de lâmpadas')
  await userEvent.type(screen.getByLabelText('Valor (R$)'), '1.250,50')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar lançamento' }))
  expect(m.criar.mutateAsync).toHaveBeenCalledWith({ data: '2026-03-15', descricao: 'Troca de lâmpadas', valor: -1250.5, categoria_id: null })
})

test('desfazer importação pede confirmação e chama a mutação', async () => {
  const m = preparar('dono')
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
  renderizarEm('/caixa/lancamentos', <PaginaLancamentos />)
  await userEvent.click(screen.getByRole('button', { name: 'Desfazer esta importação' }))
  expect(confirmar).toHaveBeenCalled()
  expect(m.desfazer.mutateAsync).toHaveBeenCalledWith('carga-1')
  confirmar.mockRestore()
})
