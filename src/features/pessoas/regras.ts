import type { TomPill } from '@/components/ui'
import { FUSO_HORARIO } from '@/lib/formatos'
import type { Colaborador, LetraDisc, TipoEvento } from '@/lib/tipos'

/*
  Regras do módulo Pessoas que dá para testar sem banco nem tela:
  status da integração, números do topo, filtros, jornada e os links do DISC e do WhatsApp.
*/

// ---------------------------------------------------------------------------
// Integração

export type StatusIntegracao = 'concluida' | 'andamento' | 'nao_iniciada' | 'sem_etapas'

/** Status pela quantidade de etapas ativas e quantas delas a pessoa já concluiu. */
export function statusDaIntegracao(totalDeEtapas: number, concluidas: number): StatusIntegracao {
  if (totalDeEtapas <= 0) return 'sem_etapas'
  if (concluidas >= totalDeEtapas) return 'concluida'
  if (concluidas > 0) return 'andamento'
  return 'nao_iniciada'
}

export const ROTULO_DA_INTEGRACAO: Record<StatusIntegracao, string> = {
  concluida: 'Concluída',
  andamento: 'Em andamento',
  nao_iniciada: 'Não iniciada',
  sem_etapas: 'Sem etapas',
}

export const TOM_DA_INTEGRACAO: Record<StatusIntegracao, TomPill> = {
  concluida: 'bom',
  andamento: 'atencao',
  nao_iniciada: 'ruim',
  sem_etapas: 'neutro',
}

/** Quantas das etapas ativas a pessoa concluiu. Etapa desativada não conta. */
export function contarConcluidas(etapasAtivas: string[], concluidas: string[]): number {
  const feitas = new Set(concluidas)
  return etapasAtivas.filter((id) => feitas.has(id)).length
}

/** Marcar esta etapa fecha a integração? Só é verdade quando ela era a única que faltava. */
export function marcarFechaAIntegracao(etapasAtivas: string[], concluidas: string[], etapaMarcada: string): boolean {
  if (etapasAtivas.length === 0 || !etapasAtivas.includes(etapaMarcada)) return false
  const feitas = new Set(concluidas)
  if (feitas.has(etapaMarcada)) return false
  return etapasAtivas.every((id) => id === etapaMarcada || feitas.has(id))
}

// ---------------------------------------------------------------------------
// Nomes

/** "Ana Paula Rocha" vira "AR": primeira letra do primeiro e do último nome. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''
  return (primeira + ultima).toUpperCase()
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? ''
}

/** Tira acento e caixa, para a busca achar "Cláudia" digitando "claudia". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

// ---------------------------------------------------------------------------
// Lista e números do topo

export type FiltroDePessoas = { busca: string; setor: string; situacao: 'ativo' | 'desligado' | 'todos' }

type PessoaFiltravel = Pick<Colaborador, 'nome' | 'setor' | 'situacao'>

export function filtrarPessoas<T extends PessoaFiltravel>(lista: T[], filtro: FiltroDePessoas): T[] {
  const busca = normalizar(filtro.busca)
  return lista.filter(
    (p) =>
      (filtro.situacao === 'todos' || p.situacao === filtro.situacao) &&
      (filtro.setor === '' || p.setor === filtro.setor) &&
      (busca === '' || normalizar(p.nome).includes(busca)),
  )
}

/** Setores que aparecem na lista, sem repetir e em ordem alfabética. */
export function setoresDaLista(lista: Pick<Colaborador, 'setor'>[]): string[] {
  const setores = new Set(lista.map((p) => p.setor.trim()).filter(Boolean))
  return [...setores].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

export type ResumoDePessoas = {
  ativos: number
  emIntegracao: number
  /** Fração de ativos com DISC (0 a 1). Sem ninguém ativo, fica null. */
  discFeito: number | null
  semDisc: number
}

type PessoaDoResumo = Pick<Colaborador, 'situacao'> & { status: StatusIntegracao; letraDisc: LetraDisc | null }

/** Os quatro números do topo de /pessoas. Só conta quem está ativo. */
export function resumirPessoas(lista: PessoaDoResumo[]): ResumoDePessoas {
  const ativos = lista.filter((p) => p.situacao === 'ativo')
  const comDisc = ativos.filter((p) => p.letraDisc !== null).length
  return {
    ativos: ativos.length,
    emIntegracao: ativos.filter((p) => p.status === 'andamento' || p.status === 'nao_iniciada').length,
    discFeito: ativos.length === 0 ? null : comDisc / ativos.length,
    semDisc: ativos.length - comDisc,
  }
}

// ---------------------------------------------------------------------------
// Jornada

export const ROTULO_DO_EVENTO: Record<TipoEvento, string> = {
  contratacao: 'Contratação',
  integracao: 'Integração',
  mudanca_funcao: 'Mudança de função',
  treinamento: 'Treinamento',
  avaliacao: 'Avaliação',
  ferias: 'Férias',
  desligamento: 'Desligamento',
  disc: 'DISC',
  anotacao: 'Anotação',
}

/**
 * Tipos que a pessoa registra à mão. Contratação, desligamento e DISC ficam de fora:
 * o sistema cria sozinho (cadastro, botão Desligar e resposta do teste).
 */
export const TIPOS_QUE_SE_REGISTRAM: TipoEvento[] = [
  'anotacao',
  'treinamento',
  'avaliacao',
  'mudanca_funcao',
  'ferias',
  'integracao',
]

/** Do mais novo para o mais antigo. No mesmo dia, mantém a ordem que veio do banco. */
export function ordenarJornada<T extends { data: string }>(eventos: T[]): T[] {
  return [...eventos].sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
}

// ---------------------------------------------------------------------------
// Datas

const hojeFormatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_HORARIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Data de hoje no fuso de São Paulo, no formato do banco ("2026-09-28"). */
export function hojeNoFuso(agora: Date = new Date()): string {
  return hojeFormatador.format(agora)
}

// ---------------------------------------------------------------------------
// DISC e WhatsApp

export function linkDoTesteDisc(origem: string, token: string): string {
  return `${origem.replace(/\/+$/, '')}/disc/${token}`
}

/**
 * Número no formato do WhatsApp (55 + DDD + número, só dígitos).
 * Aceita com ou sem o 55 na frente. Número curto demais ou vazio devolve null.
 */
export function numeroDoWhatsApp(telefone: string | null | undefined): string | null {
  const digitos = (telefone ?? '').replace(/\D/g, '')
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos
  return null
}

/** Mensagem curta que vai junto com o link. Sem nome de empresa, para não errar artigo ("a" ou "o"). */
export function mensagemDoConviteDisc(nome: string, link: string): string {
  return (
    `Olá, ${primeiroNome(nome)}! Queremos conhecer melhor o seu jeito de trabalhar. ` +
    `Responda este teste rápido pelo celular (leva uns 5 minutos): ${link}`
  )
}

/** Link que abre a conversa no WhatsApp com a mensagem pronta. Sem telefone válido, null. */
export function linkDoWhatsApp(telefone: string | null | undefined, mensagem: string): string | null {
  const numero = numeroDoWhatsApp(telefone)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
}
