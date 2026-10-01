import type { Categoria } from '@/lib/tipos'
import { curva8020, maioresVariacoes, montarFluxo, semaforo, sobreRecebimentos, variacao } from './calculo'

const cat = (id: string, grupo: Categoria['grupo'], ordem = 0): Categoria => ({
  id,
  empresa_id: 'e1',
  nome: id,
  grupo,
  ordem,
  ativa: true,
})

const CATEGORIAS = [
  cat('vendas', 'recebimentos'),
  cat('pessoal', 'pagamentos_operacionais', 1),
  cat('aluguel', 'pagamentos_operacionais', 2),
  cat('marketing', 'pagamentos_operacionais', 3),
  cat('prolabore', 'acionistas'),
]

/*
  Conferência feita à mão:
  jan: vendas 10.000, pessoal -4.000, aluguel -1.000, prolabore -2.000, sem categoria -500
       resultado da operação = 10.000 - 5.000 = 5.000; margem 50%; fluxo líquido = 2.500
  fev: vendas 12.000, pessoal -5.000, aluguel -1.000, marketing -600
       resultado = 5.400; margem 45%; fluxo líquido = 5.400
  saldo inicial 1.000: saldo final jan 3.500, fev 8.900, e fica em 8.900 até dezembro
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
  { data: '2025-12-31', valor: 99999, categoria_id: 'vendas' },
]

const fluxo = montarFluxo(2026, 1000, CATEGORIAS, LANCAMENTOS)

test('soma por categoria e por mês, ignorando outro ano', () => {
  const vendas = fluxo.grupos[0]!.linhas[0]!
  expect(vendas.meses.slice(0, 3)).toEqual([10000, 12000, 0])
  expect(vendas.total).toBe(22000)
})

test('resultado da operação, margem e fluxo líquido batem com a conta à mão', () => {
  expect(fluxo.resultadoDaOperacao.slice(0, 2)).toEqual([5000, 5400])
  expect(fluxo.margem.slice(0, 3)).toEqual([50, 45, null])
  expect(fluxo.semCategoria[0]).toBe(-500)
  expect(fluxo.fluxoLiquido.slice(0, 2)).toEqual([2500, 5400])
})

test('saldo final acumula a partir do saldo inicial', () => {
  expect(fluxo.saldoFinal.slice(0, 3)).toEqual([3500, 8900, 8900])
  expect(fluxo.saldoFinal[11]).toBe(8900)
  expect(fluxo.ultimoMesComDado).toBe(1)
})

test('variação compara o tamanho e devolve null sem base', () => {
  expect(variacao(-5000, -4000)).toBe(25)
  expect(variacao(12000, 10000)).toBe(20)
  expect(variacao(-600, 0)).toBeNull()
})

test('semáforo: pagamento que sobe e recebimento que cai acendem vermelho', () => {
  expect(semaforo('pagamentos_operacionais', 25)).toBe('ruim')
  expect(semaforo('pagamentos_operacionais', -30)).toBe('bom')
  expect(semaforo('recebimentos', -20)).toBe('ruim')
  expect(semaforo('recebimentos', 20)).toBe('bom')
  expect(semaforo('pagamentos_operacionais', 12)).toBe('neutro')
})

test('porcentagem sobre recebimentos', () => {
  expect(sobreRecebimentos(-5000, 12000)).toBe(41.7)
  expect(sobreRecebimentos(-5000, 0)).toBeNull()
})

test('curva 80/20 ordena do maior e marca quem chega a 80%', () => {
  const pagamentos = fluxo.grupos[1]!.linhas
  const curva = curva8020(pagamentos)
  expect(curva.map((c) => c.categoriaId)).toEqual(['pessoal', 'aluguel', 'marketing'])
  // pessoal 9.000 de 11.600 = 77,6%; aluguel cruza os 80% e entra; marketing fica de fora
  expect(curva.map((c) => c.nos80)).toEqual([true, true, false])
  expect(curva[2]!.acumulado).toBe(100)
})

test('maiores variações do mês só pegam pagamento acima do limite', () => {
  const destaques = maioresVariacoes(fluxo, 1)
  expect(destaques.map((d) => d.categoriaId)).toEqual(['pessoal'])
  expect(destaques[0]!.pct).toBe(25)
})
