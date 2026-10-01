import type { Categoria, GrupoCategoria } from '@/lib/tipos'

/*
  Cálculo do fluxo de caixa do ano, feito no app e testado sem banco.
  Convenção de sinal: valor positivo entra, negativo sai. Na tela, pagamento aparece sem o sinal.
*/

export const GRUPOS: { grupo: GrupoCategoria; rotulo: string }[] = [
  { grupo: 'recebimentos', rotulo: 'Recebimentos operacionais' },
  { grupo: 'pagamentos_operacionais', rotulo: 'Pagamentos operacionais' },
  { grupo: 'investimentos', rotulo: 'Fluxo de investimentos' },
  { grupo: 'acionistas', rotulo: 'Fluxo dos acionistas' },
  { grupo: 'financiamento', rotulo: 'Fluxo de financiamento' },
  { grupo: 'nao_operacional', rotulo: 'Fluxo não operacional' },
]

export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export type LancamentoDoCalculo = { data: string; valor: number; categoria_id: string | null }

export type LinhaDoFluxo = {
  categoriaId: string
  nome: string
  grupo: GrupoCategoria
  meses: number[]
  total: number
}

export type GrupoDoFluxo = { grupo: GrupoCategoria; rotulo: string; linhas: LinhaDoFluxo[]; meses: number[]; total: number }

export type FluxoDoAno = {
  ano: number
  saldoInicial: number
  grupos: GrupoDoFluxo[]
  semCategoria: number[]
  recebimentos: number[]
  pagamentosOperacionais: number[]
  resultadoDaOperacao: number[]
  fluxoLiquido: number[]
  saldoFinal: number[]
  /** Resultado da operação sobre os recebimentos, em %. Null no mês sem recebimento. */
  margem: (number | null)[]
  /** Último mês com algum lançamento (0 a 11), ou -1 se o ano está vazio. */
  ultimoMesComDado: number
}

const zeros = () => Array.from({ length: 12 }, () => 0)
const somar = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] ?? 0))
const centavos = (n: number) => Math.round(n * 100) / 100

/** Mês (0 a 11) de uma data ISO "2026-03-15", só se for do ano pedido. */
export function mesDoAno(data: string, ano: number): number | null {
  const [a, m] = data.split('-').map(Number)
  if (a !== ano || !m || m < 1 || m > 12) return null
  return m - 1
}

export function montarFluxo(
  ano: number,
  saldoInicial: number,
  categorias: Categoria[],
  lancamentos: LancamentoDoCalculo[],
): FluxoDoAno {
  const porCategoria = new Map<string, number[]>()
  const semCategoria = zeros()
  const existe = new Set(categorias.map((c) => c.id))
  let ultimoMesComDado = -1

  for (const l of lancamentos) {
    const mes = mesDoAno(l.data, ano)
    if (mes === null) continue
    ultimoMesComDado = Math.max(ultimoMesComDado, mes)
    if (!l.categoria_id || !existe.has(l.categoria_id)) {
      semCategoria[mes] = centavos((semCategoria[mes] ?? 0) + l.valor)
      continue
    }
    const meses = porCategoria.get(l.categoria_id) ?? zeros()
    meses[mes] = centavos((meses[mes] ?? 0) + l.valor)
    porCategoria.set(l.categoria_id, meses)
  }

  const grupos: GrupoDoFluxo[] = GRUPOS.map(({ grupo, rotulo }) => {
    const linhas = categorias
      .filter((c) => c.grupo === grupo && (c.ativa || porCategoria.has(c.id)))
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
      .map((c) => {
        const meses = porCategoria.get(c.id) ?? zeros()
        return { categoriaId: c.id, nome: c.nome, grupo, meses, total: centavos(meses.reduce((s, v) => s + v, 0)) }
      })
    const meses = linhas.reduce((acc, l) => somar(acc, l.meses), zeros()).map(centavos)
    return { grupo, rotulo, linhas, meses, total: centavos(meses.reduce((s, v) => s + v, 0)) }
  })

  const doGrupo = (g: GrupoCategoria) => grupos.find((x) => x.grupo === g)?.meses ?? zeros()
  const recebimentos = doGrupo('recebimentos')
  const pagamentosOperacionais = doGrupo('pagamentos_operacionais')
  const resultadoDaOperacao = somar(recebimentos, pagamentosOperacionais).map(centavos)
  const fluxoLiquido = grupos.reduce((acc, g) => somar(acc, g.meses), semCategoria.slice()).map(centavos)

  const saldoFinal: number[] = []
  let saldo = saldoInicial
  for (const v of fluxoLiquido) {
    saldo = centavos(saldo + v)
    saldoFinal.push(saldo)
  }

  const margem = resultadoDaOperacao.map((r, i) => {
    const receb = recebimentos[i] ?? 0
    return receb > 0 ? Math.round((r / receb) * 1000) / 10 : null
  })

  return {
    ano,
    saldoInicial,
    grupos,
    semCategoria,
    recebimentos,
    pagamentosOperacionais,
    resultadoDaOperacao,
    fluxoLiquido,
    saldoFinal,
    margem,
    ultimoMesComDado,
  }
}

/** Variação em % de um mês para o outro, comparando o tamanho (sem sinal). Null quando não há base. */
export function variacao(atual: number, anterior: number): number | null {
  const base = Math.abs(anterior)
  if (base === 0) return null
  return Math.round(((Math.abs(atual) - base) / base) * 1000) / 10
}

export type Semaforo = 'ruim' | 'bom' | 'neutro'
export const LIMITE_DO_SEMAFORO = 12

/** Pagamento que sobe mais de 12% acende vermelho; recebimento que cai mais de 12% também. */
export function semaforo(grupo: GrupoCategoria, pct: number | null): Semaforo {
  if (pct === null || Math.abs(pct) <= LIMITE_DO_SEMAFORO) return 'neutro'
  const entra = grupo === 'recebimentos'
  if (entra) return pct > 0 ? 'bom' : 'ruim'
  return pct > 0 ? 'ruim' : 'bom'
}

/** Quanto um valor representa dos recebimentos operacionais do mesmo período, em %. */
export function sobreRecebimentos(valor: number, recebimentos: number): number | null {
  if (recebimentos <= 0) return null
  return Math.round((Math.abs(valor) / recebimentos) * 1000) / 10
}

export type ItemDaCurva = { categoriaId: string; nome: string; valor: number; pct: number; acumulado: number; nos80: boolean }

/**
 * Curva 80/20 dos pagamentos operacionais: do maior para o menor, com a porcentagem acumulada.
 * `nos80` marca as categorias que, somadas, chegam a 80% (a que cruza a linha entra).
 */
export function curva8020(linhas: LinhaDoFluxo[], mes?: number): ItemDaCurva[] {
  const itens = linhas
    .map((l) => ({ categoriaId: l.categoriaId, nome: l.nome, valor: Math.abs(mes === undefined ? l.total : (l.meses[mes] ?? 0)) }))
    .filter((i) => i.valor > 0)
    .sort((a, b) => b.valor - a.valor)
  const total = itens.reduce((s, i) => s + i.valor, 0)
  let acumulado = 0
  let jaPassou = false
  return itens.map((i) => {
    const antes = acumulado
    acumulado += i.valor
    const nos80 = !jaPassou
    if (antes / total < 0.8 && acumulado / total >= 0.8) jaPassou = true
    return {
      ...i,
      pct: Math.round((i.valor / total) * 1000) / 10,
      acumulado: Math.round((acumulado / total) * 1000) / 10,
      nos80,
    }
  })
}

export type Destaque = { categoriaId: string; nome: string; grupo: GrupoCategoria; atual: number; anterior: number; pct: number }

/** As categorias que mais fugiram do mês anterior no mês pedido, para o painel do dono. */
export function maioresVariacoes(fluxo: FluxoDoAno, mes: number, quantas = 3): Destaque[] {
  if (mes < 1) return []
  const todas: Destaque[] = []
  for (const g of fluxo.grupos) {
    if (g.grupo !== 'pagamentos_operacionais') continue
    for (const l of g.linhas) {
      const atual = l.meses[mes] ?? 0
      const anterior = l.meses[mes - 1] ?? 0
      const pct = variacao(atual, anterior)
      if (pct === null || pct <= LIMITE_DO_SEMAFORO) continue
      todas.push({ categoriaId: l.categoriaId, nome: l.nome, grupo: g.grupo, atual, anterior, pct })
    }
  }
  return todas.sort((a, b) => Math.abs(b.atual - b.anterior) - Math.abs(a.atual - a.anterior)).slice(0, quantas)
}
