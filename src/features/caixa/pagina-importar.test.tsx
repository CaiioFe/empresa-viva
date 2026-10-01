import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEmpresaAtiva } from '@/app/sessao'
import type { Lancamento, Papel } from '@/lib/tipos'
import * as api from './api'
import { CATEGORIAS, consulta, mutacao, renderizarEm, vinculo } from './dubles-de-teste'
import { PaginaImportar } from './pagina-importar'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn() }))
vi.mock('./api')

const CSV = [
  'Data;Descrição;Valor',
  '02/03/2026;Venda balcão;1.234,56',
  '05/03/2026;Aluguel da loja;-2.000,00',
  '09/03/2026;Tarifa bancária;-12,90',
  'sem data;Linha quebrada;10,00',
  '11/03/2026;Valor esquisito;dez reais',
].join('\n')

const gravado = (data: string, descricao: string, valor: number): Lancamento => ({
  id: descricao,
  empresa_id: 'empresa-teste',
  data,
  descricao,
  valor,
  categoria_id: null,
  origem: 'planilha',
  carga_id: 'c0',
})

function preparar(papel: Papel, existentes: Lancamento[] = []) {
  localStorage.clear()
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo(papel))
  vi.mocked(api.useRegras).mockReturnValue(
    consulta([{ id: 'r1', empresa_id: 'empresa-teste', contem: 'aluguel', categoria_id: 'aluguel' }]),
  )
  vi.mocked(api.useCategorias).mockReturnValue(consulta(CATEGORIAS))
  vi.mocked(api.useLancamentosEntre).mockReturnValue(consulta(existentes))
  const importar = mutacao({ cargaId: 'nova', gravados: 3 })
  vi.mocked(api.useImportarCarga).mockReturnValue(importar as never)
  return importar
}

const escolherArquivo = async () => {
  const arquivo = new File([CSV], 'extrato-marco.csv', { type: 'text/csv' })
  await userEvent.upload(screen.getByLabelText('Arquivo da planilha'), arquivo)
  await screen.findByRole('table', { name: 'Prévia da importação' })
}

test('lê o CSV, sugere as colunas e mostra a prévia com categoria e recusas', async () => {
  preparar('financeiro')
  renderizarEm('/caixa/importar', <PaginaImportar />)
  await escolherArquivo()

  expect(screen.getByLabelText('Data')).toHaveValue('0')
  expect(screen.getByLabelText('Descrição')).toHaveValue('1')
  expect(screen.getByLabelText('Valor')).toHaveValue('2')

  const previa = within(screen.getByRole('table', { name: 'Prévia da importação' }))
  expect(previa.getAllByRole('row')).toHaveLength(4)
  expect(previa.getByText('+ R$ 1.234,56')).toBeInTheDocument()
  // a regra "aluguel" classificou; as outras ficaram sem categoria
  expect(within(previa.getByText('Aluguel da loja').closest('tr')!).getByText('Aluguel')).toBeInTheDocument()
  expect(previa.getAllByText('Sem categoria')).toHaveLength(2)

  expect(screen.getByText(/Data que não deu para ler: linha 5/)).toBeInTheDocument()
  expect(screen.getByText(/Valor que não deu para ler: linha 6/)).toBeInTheDocument()
  expect(screen.queryByText(/já foi importada/)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Importar 3 lançamentos' })).toBeEnabled()
})

test('avisa quando mais de 30% das linhas já estão gravadas', async () => {
  preparar('dono', [gravado('2026-03-02', 'Venda balcão', 1234.56), gravado('2026-03-05', 'aluguel da loja', -2000)])
  renderizarEm('/caixa/importar', <PaginaImportar />)
  await escolherArquivo()
  expect(screen.getByText(/Parece que esta planilha já foi importada: 2 de 3 linhas/)).toBeInTheDocument()
})

test('confirmar grava a carga com as linhas lidas e lembra o mapeamento', async () => {
  const importar = preparar('dono')
  renderizarEm('/caixa/importar', <PaginaImportar />)
  await escolherArquivo()
  await userEvent.click(screen.getByRole('button', { name: 'Importar 3 lançamentos' }))

  expect(importar.mutateAsync).toHaveBeenCalledWith({
    arquivo: 'extrato-marco.csv',
    mapeamento: { cabecalho: 0, data: 0, descricao: 1, valor: 2, entrada: null, saida: null },
    lancamentos: [
      { data: '2026-03-02', descricao: 'Venda balcão', valor: 1234.56, categoria_id: null },
      { data: '2026-03-05', descricao: 'Aluguel da loja', valor: -2000, categoria_id: 'aluguel' },
      { data: '2026-03-09', descricao: 'Tarifa bancária', valor: -12.9, categoria_id: null },
    ],
  })
  expect(await screen.findByText(/3 lançamentos gravados/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Ver o fluxo do ano' })).toHaveAttribute('href', '/caixa?ano=2026')
  expect(localStorage.getItem('empresa-viva:mapeamento:empresa-teste')).toContain('"Descrição"')
})

test('quem não pode editar vê o aviso e não o formulário', () => {
  preparar('consultora')
  renderizarEm('/caixa/importar', <PaginaImportar />)
  expect(screen.getByText(/Só o dono e o financeiro da empresa importam planilhas/)).toBeInTheDocument()
  expect(screen.queryByLabelText('Arquivo da planilha')).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Baixar planilha modelo' })).toHaveAttribute('href', '/planilha-modelo.csv')
})
