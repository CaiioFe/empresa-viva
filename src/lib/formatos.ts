/*
  Formatos em português do Brasil pra toda a tela: número, dinheiro, percentual, variação e data.
  O Intl coloca espaço inquebrável em "R$ 1,00"; aqui sai espaço comum, igual ao que se digita.
  Valor inválido (NaN, infinito, data errada) vira "-".
*/

const LOCALE = 'pt-BR'
export const FUSO_HORARIO = 'America/Sao_Paulo'
const SEM_VALOR = '-'

const formatadores = new Map<string, Intl.NumberFormat>()

function formato(opcoes: Intl.NumberFormatOptions): Intl.NumberFormat {
  const chave = JSON.stringify(opcoes)
  let formatador = formatadores.get(chave)
  if (!formatador) {
    formatador = new Intl.NumberFormat(LOCALE, { signDisplay: 'negative', ...opcoes })
    formatadores.set(chave, formatador)
  }
  return formatador
}

function espacoComum(texto: string): string {
  return texto.replace(/[  ]/g, ' ')
}

/** 1284 vira "1.284". Com `casas`, fixa as casas decimais (3.5 com 1 casa vira "3,5"). */
export function formatarNumero(n: number, casas?: number): string {
  if (!Number.isFinite(n)) return SEM_VALOR
  const opcoes = casas === undefined ? {} : { minimumFractionDigits: casas, maximumFractionDigits: casas }
  return espacoComum(formato(opcoes).format(n))
}

/** 512340 vira "R$ 512.340,00". Valor completo, pra tabela e drill-down. */
export function formatarDinheiro(n: number): string {
  if (!Number.isFinite(n)) return SEM_VALOR
  return espacoComum(formato({ style: 'currency', currency: 'BRL' }).format(n))
}

const ESCALAS = [
  { divisor: 1e3, sufixo: 'mil' },
  { divisor: 1e6, sufixo: 'mi' },
  { divisor: 1e9, sufixo: 'bi' },
] as const

/**
 * Dinheiro curto pra cartão: "R$ 950", "R$ 512 mil", "R$ 5,7 mi", "R$ 1,2 bi".
 * Uma casa decimal abaixo de 100 na escala ("R$ 45,3 mil"), nenhuma a partir de 100.
 */
export function formatarDinheiroCurto(n: number): string {
  if (!Number.isFinite(n)) return SEM_VALOR
  const absoluto = Math.abs(n)
  let texto = formatarNumero(Math.round(absoluto))

  if (Math.round(absoluto) >= 1000) {
    for (const [indice, { divisor, sufixo }] of ESCALAS.entries()) {
      const valor = absoluto / divisor
      const casas = valor < 100 ? 1 : 0
      const arredondado = Math.round(valor * 10 ** casas) / 10 ** casas
      const ultimaEscala = indice === ESCALAS.length - 1
      // 999.960 arredonda pra "1.000 mil": sobe pra "1 mi"
      if (arredondado >= 1000 && !ultimaEscala) continue
      texto = `${espacoComum(formato({ maximumFractionDigits: casas }).format(arredondado))} ${sufixo}`
      break
    }
  }

  const sinal = n < 0 && texto !== '0' ? '-' : ''
  return `${sinal}R$ ${texto}`
}

/** Recebe fração: 0.44 vira "44%"; com 1 casa, 0.4456 vira "44,6%". */
export function formatarPercentual(n: number, casas = 0): string {
  if (!Number.isFinite(n)) return SEM_VALOR
  return espacoComum(
    formato({ style: 'percent', minimumFractionDigits: casas, maximumFractionDigits: casas }).format(n),
  )
}

export type DirecaoVariacao = 'sobe' | 'desce' | 'igual'

export interface Variacao {
  /** "+12%", "-4%", "igual" ou "novo" (quando o período anterior era zero) */
  texto: string
  direcao: DirecaoVariacao
}

/**
 * Variação do período atual contra o anterior, arredondada pra inteiro.
 * Só diz a direção: quem decide se é bom ou ruim é o indicador (estoque caindo é bom).
 */
export function variacaoPercentual(atual: number, anterior: number): Variacao {
  if (!Number.isFinite(atual) || !Number.isFinite(anterior)) return { texto: SEM_VALOR, direcao: 'igual' }
  if (anterior === 0) {
    if (atual === 0) return { texto: 'igual', direcao: 'igual' }
    return { texto: 'novo', direcao: atual > 0 ? 'sobe' : 'desce' }
  }
  const pontos = Math.round(((atual - anterior) / Math.abs(anterior)) * 100)
  if (pontos === 0) return { texto: 'igual', direcao: 'igual' }
  return pontos > 0
    ? { texto: `+${formatarNumero(pontos)}%`, direcao: 'sobe' }
    : { texto: `-${formatarNumero(-pontos)}%`, direcao: 'desce' }
}

export type EntradaData = Date | string

const SO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/

const partesNoFuso = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: FUSO_HORARIO,
})

interface PartesData {
  dia: string
  mes: string
  ano: string
}

function lerData(entrada: EntradaData): PartesData | null {
  if (typeof entrada === 'string') {
    // "2026-09-15" é data de calendário: não passa por fuso (senão vira 14/09 às 21h)
    const soData = SO_DATA.exec(entrada.trim())
    if (soData) {
      const [, ano = '', mes = '', dia = ''] = soData
      const conferida = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)))
      const existe = conferida.getUTCMonth() === Number(mes) - 1 && conferida.getUTCDate() === Number(dia)
      return existe ? { dia, mes, ano } : null
    }
  }
  const data = typeof entrada === 'string' ? new Date(entrada) : entrada
  if (Number.isNaN(data.getTime())) return null
  const partes = partesNoFuso.formatToParts(data)
  const parte = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? ''
  return { dia: parte('day'), mes: parte('month'), ano: parte('year') }
}

/** "15/09", no fuso de São Paulo. Aceita Date ou texto ISO. */
export function formatarData(entrada: EntradaData): string {
  const partes = lerData(entrada)
  return partes ? `${partes.dia}/${partes.mes}` : SEM_VALOR
}

/** "15/09/2026", no fuso de São Paulo. Aceita Date ou texto ISO. */
export function formatarDataCompleta(entrada: EntradaData): string {
  const partes = lerData(entrada)
  return partes ? `${partes.dia}/${partes.mes}/${partes.ano}` : SEM_VALOR
}
