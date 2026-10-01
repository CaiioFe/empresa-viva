import { screen, within } from '@testing-library/react'
import { useEmpresaAtiva } from '@/app/sessao'
import * as api from './api'
import { CATEGORIAS, comErro, consulta, mutacao, renderizarEm, vinculo } from './dubles-de-teste'
import { PaginaCaixa } from './pagina-caixa'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn() }))
vi.mock('./api')

/*
  Mesma conferência à mão do calculo.test.ts:
  jan: vendas 10.000, pessoal -4.000, aluguel -1.000, pró-labore -2.000, sem categoria -500
  fev: vendas 12.000, pessoal -5.000, aluguel -1.000, marketing -600
  saldo inicial 1.000: saldo final jan 3.500, fev 8.900
*/
const LANCAMENTOS = [
  { data: '2026-01-05', valor: 10000, categoria_id: 'vendas' },
  { data: '2026-01-10', valor: -4000, categoria_id: 'pessoal' },
  { data: '2026-01-10', valor: -1000, categoria_id: 'aluguel' },
  { data: '2026-01-28', valor: -2000, categoria_id: 'prolabore' },
  { data: '2026-01-30', valor: -500, categoria_id: null },
  { data: '2026-02-03', valor: 7000, categoria_id: 'vendas' },
  { data: '2026-02-20', valor: 5000, categoria_id: 'vendas' },
  { data: '2026-02-10', valor: -5000, categoria_id: 'pessoal' },
  { data: '2026-02-10', valor: -1000, categoria_id: 'aluguel' },
  { data: '2026-02-15', valor: -600, categoria_id: 'marketing' },
].map((l, i) => ({ ...l, id: `l${i}`, empresa_id: 'empresa-teste', descricao: `item ${i}`, origem: 'planilha' as const, carga_id: null }))

function preparar(papel: 'dono' | 'consultora' = 'dono', lancamentos = LANCAMENTOS) {
  vi.mocked(useEmpresaAtiva).mockReturnValue(vinculo(papel))
  vi.mocked(api.useExtremosDasDatas).mockReturnValue(consulta({ primeira: '2026-01-05', ultima: '2026-02-20' }))
  vi.mocked(api.useCategorias).mockReturnValue(consulta(CATEGORIAS))
  vi.mocked(api.useLancamentosDoAno).mockReturnValue(consulta(lancamentos))
  vi.mocked(api.useSaldoInicial).mockReturnValue(consulta(1000))
  vi.mocked(api.useSalvarSaldoInicial).mockReturnValue(mutacao() as never)
}

const linha = (chave: string) => {
  const tr = document.querySelector(`tr[data-linha="${chave}"]`)
  if (!tr) throw new Error(`linha ${chave} não achada`)
  return within(tr as HTMLElement)
}

test('a tabela do fluxo mostra os totais da conferência à mão, com pagamento sem sinal', () => {
  preparar()
  renderizarEm('/caixa?ano=2026', <PaginaCaixa />)

  expect(screen.getByRole('table', { name: 'Fluxo de caixa de 2026' })).toBeInTheDocument()
  // vendas: 10.000 + 12.000
  expect(linha('c-vendas').getAllByRole('cell').at(-1)).toHaveTextContent('22.000,00')
  // pessoal aparece sem o sinal de menos
  expect(linha('c-pessoal').getAllByRole('cell').at(-1)).toHaveTextContent(/^9\.000,00$/)
  // resultado da operação: 5.000 + 5.400
  expect(linha('resultado').getAllByRole('cell').at(-1)).toHaveTextContent('10.400,00')
  // saldo final de fevereiro e do ano
  expect(linha('saldo-final').getAllByRole('cell')[2]).toHaveTextContent('8.900,00')
  expect(linha('saldo-final').getAllByRole('cell').at(-1)).toHaveTextContent('8.900,00')
  // saldo inicial de fevereiro é o saldo final de janeiro
  expect(linha('saldo-inicial').getAllByRole('cell')[2]).toHaveTextContent('3.500,00')
  // sem categoria com link para a fila
  expect(screen.getByRole('link', { name: /sem categoria/i })).toHaveAttribute(
    'href',
    '/caixa/lancamentos?ano=2026&mes=todos&categoria=sem',
  )
})

test('os indicadores são do último mês com dado e a comparação acende o semáforo', () => {
  preparar()
  renderizarEm('/caixa?ano=2026', <PaginaCaixa />)

  expect(screen.getByText('Saldo final de fevereiro')).toBeInTheDocument()
  expect(screen.getByText('R$ 8.900,00')).toBeInTheDocument()
  expect(screen.getByText('45,0%')).toBeInTheDocument()

  const comparacao = within(screen.getByRole('table', { name: 'Comparação do mês' }))
  // pessoal subiu 25%: vermelho; vendas subiram 20%: verde
  expect(comparacao.getByText('+25%')).toHaveClass('text-ruim')
  expect(comparacao.getByText('+20%')).toHaveClass('text-bom')
})

test('a curva 80/20 destaca as categorias que somam 80%', () => {
  preparar()
  renderizarEm('/caixa?ano=2026', <PaginaCaixa />)
  // fevereiro: pessoal 5.000 de 6.600 (75,8%) e aluguel cruza os 80%
  expect(screen.getByText(/2 de 3 categorias/)).toBeInTheDocument()
  expect(screen.getAllByText('nos 80%')).toHaveLength(2)
})

test('ano sem lançamento mostra o próximo passo', () => {
  preparar('dono', [])
  renderizarEm('/caixa?ano=2026', <PaginaCaixa />)
  expect(screen.getByText('Nenhum lançamento em 2026')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Importar planilha' })).toHaveAttribute('href', '/caixa/importar')
})

test('consultora não vê o botão de alterar o saldo inicial', () => {
  preparar('consultora')
  renderizarEm('/caixa?ano=2026', <PaginaCaixa />)
  expect(screen.queryByRole('button', { name: 'Alterar saldo inicial' })).not.toBeInTheDocument()
})

test('erro de leitura aparece como aviso', () => {
  preparar()
  vi.mocked(api.useLancamentosDoAno).mockReturnValue(comErro('sem rede'))
  renderizarEm('/caixa?ano=2026', <PaginaCaixa />)
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar')
})
