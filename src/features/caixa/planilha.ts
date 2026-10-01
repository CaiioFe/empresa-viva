/*
  Leitura de planilha exportada de qualquer sistema: acha as colunas, entende data brasileira e
  número com vírgula, classifica pelas regras e aponta o que não deu para ler.
  Tudo aqui é função pura (a leitura do arquivo fica em lerArquivo, no fim).
*/

export type Celula = string | number | Date | boolean | null | undefined

export type Mapeamento = {
  /** índice da linha do cabeçalho */
  cabecalho: number
  data: number | null
  descricao: number | null
  /** coluna única de valor (positivo entra, negativo sai) */
  valor: number | null
  /** ou duas colunas: entrada e saída, as duas em número positivo */
  entrada: number | null
  saida: number | null
}

export type LinhaLida =
  | { ok: true; linha: number; data: string; descricao: string; valor: number }
  | { ok: false; linha: number; motivo: string }

const semAcento = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const vazia = (c: Celula) => c === null || c === undefined || (typeof c === 'string' && c.trim() === '')

/** O cabeçalho é a primeira linha com pelo menos duas células de texto. */
export function acharCabecalho(linhas: Celula[][]): number {
  const i = linhas.findIndex((l) => l.filter((c) => typeof c === 'string' && c.trim() !== '').length >= 2)
  return i === -1 ? 0 : i
}

const PISTAS: Record<'data' | 'descricao' | 'valor' | 'entrada' | 'saida', RegExp> = {
  data: /^(data|dt\b|dia\b|data do (pagamento|lancamento|movimento)|vencimento|competencia|pagamento)/,
  descricao: /(descricao|historico|lancamento|detalhe|observacao|favorecido|nome|memo)/,
  valor: /^(valor|vlr|montante|total|quantia)/,
  entrada: /(entrada|credito|receita|recebido)/,
  saida: /(saida|debito|despesa|pago)/,
}

/** Sugere quais colunas são data, descrição e valor pelo nome do cabeçalho. A pessoa confere na tela. */
export function sugerirMapeamento(linhas: Celula[][]): Mapeamento {
  const cabecalho = acharCabecalho(linhas)
  const nomes = (linhas[cabecalho] ?? []).map((c) => semAcento(String(c ?? '')))
  const achar = (pista: RegExp, usados: number[]) => {
    const i = nomes.findIndex((n, idx) => !usados.includes(idx) && pista.test(n))
    return i === -1 ? null : i
  }
  const data = achar(PISTAS.data, [])
  const usados = data === null ? [] : [data]
  const entrada = achar(PISTAS.entrada, usados)
  const saida = achar(PISTAS.saida, entrada === null ? usados : [...usados, entrada])
  const duasColunas = entrada !== null && saida !== null
  const valor = duasColunas ? null : achar(PISTAS.valor, usados)
  const ocupados = [data, valor, entrada, saida].filter((x): x is number => x !== null)
  const descricao = achar(PISTAS.descricao, ocupados)
  return {
    cabecalho,
    data,
    descricao,
    valor,
    entrada: duasColunas ? entrada : null,
    saida: duasColunas ? saida : null,
  }
}

const iso = (a: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(a, m - 1, d))
  if (dt.getUTCFullYear() !== a || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null
  return `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Data em "15/03/2026", "15/03/26", "2026-03-15", número de série do Excel ou objeto Date. */
export function lerData(c: Celula): string | null {
  if (c instanceof Date) {
    if (Number.isNaN(c.getTime())) return null
    return iso(c.getFullYear(), c.getMonth() + 1, c.getDate())
  }
  if (typeof c === 'number') {
    if (c < 20000 || c > 80000) return null
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.round(c) * 86400000)
    return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
  }
  if (typeof c !== 'string') return null
  const t = c.trim()
  let m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})(\s.*)?$/)
  if (m) {
    const ano = m[3]!.length === 2 ? 2000 + Number(m[3]) : Number(m[3])
    return iso(ano, Number(m[2]), Number(m[1]))
  }
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return iso(Number(m[1]), Number(m[2]), Number(m[3]))
  return null
}

/** Valor em "1.234,56", "-1.234,56", "(1.234,56)", "R$ 1.234,56", "1234.56", "1.234,56 D" ou número. */
export function lerValor(c: Celula): number | null {
  if (typeof c === 'number') return Number.isFinite(c) ? Math.round(c * 100) / 100 : null
  if (typeof c !== 'string') return null
  let t = c.trim().toUpperCase()
  if (t === '') return null
  let negativo = false
  if (/^\(.*\)$/.test(t)) {
    negativo = true
    t = t.slice(1, -1)
  }
  if (/\s?D$/.test(t)) {
    negativo = true
    t = t.replace(/\s?D$/, '')
  }
  t = t.replace(/\s?C$/, '').replace(/R\$/g, '').replace(/\s/g, '')
  if (t.startsWith('-')) {
    negativo = !negativo
    t = t.slice(1)
  } else if (t.endsWith('-')) {
    negativo = !negativo
    t = t.slice(0, -1)
  }
  if (!/^[\d.,]+$/.test(t)) return null
  const virgula = t.lastIndexOf(',')
  const ponto = t.lastIndexOf('.')
  let normal: string
  if (virgula > ponto) normal = t.replace(/\./g, '').replace(',', '.')
  else if (ponto > virgula && virgula !== -1) normal = t.replace(/,/g, '')
  else if (ponto !== -1 && /\.\d{3}$/.test(t) && !/\.\d{1,2}$/.test(t)) normal = t.replace(/\./g, '')
  else normal = t
  const n = Number(normal)
  if (!Number.isFinite(n)) return null
  return Math.round((negativo ? -n : n) * 100) / 100
}

/** Transforma as linhas da planilha em lançamentos, dizendo o motivo de cada linha recusada. */
export function lerLinhas(linhas: Celula[][], mapa: Mapeamento): LinhaLida[] {
  const resultado: LinhaLida[] = []
  for (let i = mapa.cabecalho + 1; i < linhas.length; i++) {
    const l = linhas[i] ?? []
    if (l.every(vazia)) continue
    const numero = i + 1
    if (mapa.data === null) {
      resultado.push({ ok: false, linha: numero, motivo: 'Falta escolher a coluna da data' })
      continue
    }
    const data = lerData(l[mapa.data])
    if (!data) {
      resultado.push({ ok: false, linha: numero, motivo: 'Data que não deu para ler' })
      continue
    }
    let valor: number | null = null
    if (mapa.entrada !== null && mapa.saida !== null) {
      const e = vazia(l[mapa.entrada]) ? 0 : lerValor(l[mapa.entrada])
      const s = vazia(l[mapa.saida]) ? 0 : lerValor(l[mapa.saida])
      if (e === null || s === null) valor = null
      else valor = Math.round((Math.abs(e) - Math.abs(s)) * 100) / 100
    } else if (mapa.valor !== null) {
      valor = lerValor(l[mapa.valor])
    } else {
      resultado.push({ ok: false, linha: numero, motivo: 'Falta escolher a coluna do valor' })
      continue
    }
    if (valor === null) {
      resultado.push({ ok: false, linha: numero, motivo: 'Valor que não deu para ler' })
      continue
    }
    if (valor === 0) {
      resultado.push({ ok: false, linha: numero, motivo: 'Valor zerado' })
      continue
    }
    const descricao = mapa.descricao === null ? '' : String(l[mapa.descricao] ?? '').trim()
    resultado.push({ ok: true, linha: numero, data, descricao, valor })
  }
  return resultado
}

export type Regra = { contem: string; categoria_id: string }

/** Categoria da regra cujo trecho aparece na descrição. Se mais de uma bate, vale o trecho mais longo. */
export function classificar(descricao: string, regras: Regra[]): string | null {
  const d = semAcento(descricao)
  let melhor: Regra | null = null
  for (const r of regras) {
    const trecho = semAcento(r.contem)
    if (trecho && d.includes(trecho) && (!melhor || trecho.length > semAcento(melhor.contem).length)) melhor = r
  }
  return melhor?.categoria_id ?? null
}

const chave = (l: { data: string; valor: number; descricao: string }) => `${l.data}|${l.valor.toFixed(2)}|${semAcento(l.descricao)}`

/** Quantas linhas novas já existem iguais (mesma data, valor e descrição) no que está gravado. */
export function contarRepetidas(
  novas: { data: string; valor: number; descricao: string }[],
  existentes: { data: string; valor: number; descricao: string }[],
): number {
  const ja = new Set(existentes.map(chave))
  return novas.filter((n) => ja.has(chave(n))).length
}

/**
 * Texto do CSV em UTF-8 ou, se não for UTF-8 válido, na codificação do Excel no Windows (windows-1252).
 * Sem isso, "Descrição" salvo pelo Excel chega como "DescriÃ§Ã£o".
 */
export function decodificarTexto(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^﻿/, '')
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

/** Lê .xlsx, .xls ou .csv. CSV vai pelo PapaParse, que descobre sozinho se o separador é ";" ou ",". */
export async function lerArquivo(arquivo: File): Promise<Celula[][]> {
  if (/\.csv$/i.test(arquivo.name) || arquivo.type === 'text/csv') {
    const { default: Papa } = await import('papaparse')
    const texto = decodificarTexto(await arquivo.arrayBuffer())
    const r = Papa.parse<string[]>(texto, { skipEmptyLines: true })
    return r.data
  }
  const XLSX = await import('xlsx')
  const livro = XLSX.read(await arquivo.arrayBuffer(), { type: 'array', cellDates: true })
  const aba = livro.Sheets[livro.SheetNames[0] ?? '']
  if (!aba) return []
  return XLSX.utils.sheet_to_json<Celula[]>(aba, { header: 1, raw: true, defval: null })
}
