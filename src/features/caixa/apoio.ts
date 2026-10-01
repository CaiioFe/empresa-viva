import type { Categoria, GrupoCategoria, Lancamento } from '@/lib/tipos'
import { classificar, type Celula, type LinhaLida, type Mapeamento } from './planilha'

/*
  Funções puras de apoio às telas do caixa: escolha do ano, filtros, ordem das categorias,
  recusas da importação e o mapeamento lembrado. Testadas sem banco em apoio.test.ts.
*/

/** Filtro de categoria da lista: uma categoria, todas ou só as que estão sem categoria. */
export const SEM_CATEGORIA = 'sem'
export const TODAS = 'todas'

/** Quebra uma lista em blocos de `tamanho` (para gravar e ler o banco aos poucos). */
export function emBlocos<T>(itens: T[], tamanho: number): T[][] {
  if (tamanho < 1) throw new Error('tamanho do bloco precisa ser maior que zero')
  const blocos: T[][] = []
  for (let i = 0; i < itens.length; i += tamanho) blocos.push(itens.slice(i, i + tamanho))
  return blocos
}

const anoDe = (data: string | null) => (data ? Number(data.slice(0, 4)) : null)

/** Ano que a tela abre: o atual, ou o último com dado quando o ano atual ainda não tem nada. */
export function anoPadrao(primeiraData: string | null, ultimaData: string | null, anoAtual: number): number {
  const primeiro = anoDe(primeiraData)
  const ultimo = anoDe(ultimaData)
  if (primeiro === null || ultimo === null) return anoAtual
  if (ultimo < anoAtual) return ultimo
  if (primeiro > anoAtual) return primeiro
  return anoAtual
}

/** Anos do seletor, do mais novo para o mais velho: do primeiro com dado (ou do início da empresa) até hoje. */
export function anosDoSeletor(
  primeiraData: string | null,
  ultimaData: string | null,
  anoInicio: number | null,
  anoAtual: number,
): number[] {
  const candidatos = [anoAtual, anoDe(primeiraData), anoDe(ultimaData), anoInicio].filter(
    (a): a is number => a !== null && Number.isFinite(a) && a > 1900,
  )
  const de = Math.min(...candidatos)
  const ate = Math.max(...candidatos)
  const anos: number[] = []
  for (let a = ate; a >= de; a--) anos.push(a)
  return anos
}

/** Mês (0 a 11) da última data, se ela for do ano pedido. Senão, o último mês do ano (ou o atual, no ano corrente). */
export function mesPadrao(ultimaData: string | null, ano: number, hoje: Date): number {
  if (ultimaData && Number(ultimaData.slice(0, 4)) === ano) return Number(ultimaData.slice(5, 7)) - 1
  if (ano === hoje.getFullYear()) return hoje.getMonth()
  return 11
}

export type FiltroDaLista = { mes: number | null; categoria: string; busca: string }

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

/** Filtra os lançamentos do ano pelo mês (null = ano todo), pela categoria e pela busca na descrição. */
export function filtrarLancamentos<L extends Pick<Lancamento, 'data' | 'descricao' | 'categoria_id'>>(
  lancamentos: L[],
  filtro: FiltroDaLista,
): L[] {
  const busca = semAcento(filtro.busca)
  return lancamentos
    .filter((l) => filtro.mes === null || Number(l.data.slice(5, 7)) - 1 === filtro.mes)
    .filter((l) => {
      if (filtro.categoria === TODAS) return true
      if (filtro.categoria === SEM_CATEGORIA) return !l.categoria_id
      return l.categoria_id === filtro.categoria
    })
    .filter((l) => busca === '' || semAcento(l.descricao).includes(busca))
    .sort((a, b) => (a.data === b.data ? a.descricao.localeCompare(b.descricao, 'pt-BR') : b.data.localeCompare(a.data)))
}

/** Ids dos lançamentos sem categoria que uma regra nova pegaria. */
export function pendentesQueBatem(lancamentos: Pick<Lancamento, 'id' | 'descricao' | 'categoria_id'>[], contem: string): string[] {
  if (contem.trim() === '') return []
  const regra = [{ contem, categoria_id: 'x' }]
  return lancamentos.filter((l) => !l.categoria_id && classificar(l.descricao, regra) !== null).map((l) => l.id)
}

/** Categorias de um grupo na ordem da tela. */
export function categoriasDoGrupo(categorias: Categoria[], grupo: GrupoCategoria): Categoria[] {
  return categorias
    .filter((c) => c.grupo === grupo)
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/** Ordem para uma categoria nova: depois da última do grupo. */
export function proximaOrdem(categorias: Categoria[], grupo: GrupoCategoria): number {
  const ordens = categorias.filter((c) => c.grupo === grupo).map((c) => c.ordem)
  return ordens.length === 0 ? 1 : Math.max(...ordens) + 1
}

/**
 * Sobe ou desce uma categoria dentro do grupo. Devolve só as que mudaram de ordem,
 * já renumeradas de 1 em diante (assim ordem repetida no banco se resolve sozinha).
 */
export function mover(
  categorias: Categoria[],
  id: string,
  direcao: 'subir' | 'descer',
): { id: string; ordem: number }[] {
  const alvo = categorias.find((c) => c.id === id)
  if (!alvo) return []
  const lista = categoriasDoGrupo(categorias, alvo.grupo)
  const i = lista.findIndex((c) => c.id === id)
  const j = direcao === 'subir' ? i - 1 : i + 1
  if (j < 0 || j >= lista.length) return []
  const nova = lista.slice()
  ;[nova[i], nova[j]] = [nova[j]!, nova[i]!]
  return nova
    .map((c, idx) => ({ id: c.id, ordem: idx + 1, antes: c.ordem }))
    .filter((c) => c.ordem !== c.antes)
    .map(({ id: idDaCategoria, ordem }) => ({ id: idDaCategoria, ordem }))
}

export type GrupoDeRecusa = { motivo: string; linhas: number[] }

/** Junta as linhas recusadas pelo motivo, na ordem em que o motivo aparece primeiro. */
export function agruparRecusas(lidas: LinhaLida[]): GrupoDeRecusa[] {
  const grupos = new Map<string, number[]>()
  for (const l of lidas) {
    if (l.ok) continue
    const linhas = grupos.get(l.motivo) ?? []
    linhas.push(l.linha)
    grupos.set(l.motivo, linhas)
  }
  return [...grupos].map(([motivo, linhas]) => ({ motivo, linhas }))
}

/** Primeira e última data de uma lista (datas ISO), ou null se vazia. */
export function intervaloDeDatas(itens: { data: string }[]): { inicio: string; fim: string } | null {
  if (itens.length === 0) return null
  let inicio = itens[0]!.data
  let fim = inicio
  for (const { data } of itens) {
    if (data < inicio) inicio = data
    if (data > fim) fim = data
  }
  return { inicio, fim }
}

/** Passa de 30% das linhas iguais ao que já está gravado: parece importação repetida. */
export const LIMITE_DE_REPETIDAS = 0.3

export function pareceRepetida(repetidas: number, total: number): boolean {
  return total > 0 && repetidas / total > LIMITE_DE_REPETIDAS
}

/** Nomes das colunas do cabeçalho, do jeito que aparecem na planilha. */
export function nomesDoCabecalho(linhas: Celula[][], cabecalho: number): string[] {
  return (linhas[cabecalho] ?? []).map((c) => String(c ?? '').trim())
}

/** Duas planilhas com o mesmo cabeçalho (sem ligar para acento, maiúscula e espaço nas pontas). */
export function mesmoCabecalho(a: string[], b: string[]): boolean {
  if (a.length === 0 || a.length !== b.length) return false
  return a.every((n, i) => semAcento(n) === semAcento(b[i] ?? ''))
}

export type MapeamentoSalvo = { cabecalho: string[]; mapa: Mapeamento }

const chaveDoMapeamento = (empresaId: string) => `empresa-viva:mapeamento:${empresaId}`

/** Último mapeamento usado na empresa, se o navegador guardou. */
export function lerMapeamentoSalvo(empresaId: string): MapeamentoSalvo | null {
  try {
    const texto = localStorage.getItem(chaveDoMapeamento(empresaId))
    if (!texto) return null
    const salvo = JSON.parse(texto) as MapeamentoSalvo
    if (!Array.isArray(salvo.cabecalho) || typeof salvo.mapa !== 'object' || salvo.mapa === null) return null
    return salvo
  } catch {
    return null
  }
}

export function salvarMapeamento(empresaId: string, salvo: MapeamentoSalvo): void {
  try {
    localStorage.setItem(chaveDoMapeamento(empresaId), JSON.stringify(salvo))
  } catch {
    // navegador sem armazenamento: na próxima vez a pessoa confere as colunas de novo
  }
}

/** Valor digitado no lançamento manual, com o sinal pelo tipo: entrada fica positivo, saída negativo. */
export function valorComSinal(valor: number, tipo: 'entrada' | 'saida'): number {
  const absoluto = Math.round(Math.abs(valor) * 100) / 100
  return tipo === 'entrada' ? absoluto : -absoluto
}

/** Variação em % no formato da tela: "+15,2%", "-3%" ou "sem base". */
export function textoDaVariacao(pct: number | null): string {
  if (pct === null) return 'sem base'
  const texto = Math.abs(pct).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
  if (pct === 0) return '0%'
  return `${pct > 0 ? '+' : '-'}${texto}%`
}

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]
