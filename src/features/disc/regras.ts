/*
  Regras da página pública do DISC que dá para testar sem banco nem tela.
*/

const FORMATO_DE_TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** O token do link é um uuid. Qualquer outra coisa nem vai ao banco: é link quebrado. */
export function pareceToken(token: string): boolean {
  return FORMATO_DE_TOKEN.test(token.trim())
}

/** O banco avisa com esta frase quando o link já foi respondido ou não existe. */
export function ehLinkUsado(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : typeof erro === 'string' ? erro : ''
  return /já foi usado|não existe/i.test(mensagem)
}

/** Porcentagem da barra de progresso: quantas perguntas já foram respondidas. */
export function progresso(respondidas: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((Math.min(Math.max(respondidas, 0), total) / total) * 100)
}
