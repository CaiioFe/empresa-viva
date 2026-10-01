/*
  Tipos das tabelas do schema empresa_viva, escritos à mão a partir da migration da TASK-003.
  Dá para trocar por tipos gerados pelo Supabase.
*/

export type Papel = 'dono' | 'financeiro' | 'rh' | 'consultora'
export type Perfil = 'comercio' | 'frota' | 'clinica' | 'outro'
export type GrupoCategoria =
  | 'recebimentos'
  | 'pagamentos_operacionais'
  | 'investimentos'
  | 'acionistas'
  | 'financiamento'
  | 'nao_operacional'
export type TipoEvento =
  | 'contratacao'
  | 'integracao'
  | 'mudanca_funcao'
  | 'treinamento'
  | 'avaliacao'
  | 'ferias'
  | 'desligamento'
  | 'disc'
  | 'anotacao'
export type LetraDisc = 'D' | 'I' | 'S' | 'C'

export type Empresa = { id: string; nome: string; perfil: Perfil; ano_inicio: number }

export type Membro = {
  id: string
  empresa_id: string
  usuario_id: string
  papel: Papel
  nome: string
  ativo: boolean
}

/** Vínculo da pessoa logada: o papel dela numa empresa, com a empresa junto. */
export type Vinculo = { papel: Papel; empresa: Empresa }

export type Categoria = { id: string; empresa_id: string; nome: string; grupo: GrupoCategoria; ordem: number; ativa: boolean }

export type RegraClassificacao = { id: string; empresa_id: string; contem: string; categoria_id: string }

export type Lancamento = {
  id: string
  empresa_id: string
  data: string
  descricao: string
  valor: number
  categoria_id: string | null
  origem: 'planilha' | 'manual'
  carga_id: string | null
}

export type Carga = { id: string; empresa_id: string; arquivo: string; linhas: number; criado_em: string }

export type Colaborador = {
  id: string
  empresa_id: string
  nome: string
  funcao: string
  setor: string
  data_entrada: string
  telefone: string | null
  email: string | null
  situacao: 'ativo' | 'desligado'
  data_saida: string | null
}

export type Evento = { id: string; empresa_id: string; colaborador_id: string; data: string; tipo: TipoEvento; texto: string }

export type EtapaIntegracao = { id: string; empresa_id: string; nome: string; ordem: number; ativa: boolean }

export type ProgressoIntegracao = { colaborador_id: string; etapa_id: string; concluida_em: string }

export type ConviteDisc = { id: string; colaborador_id: string; token: string; criado_em: string; respondido_em: string | null }

export type ResultadoDisc = {
  id: string
  colaborador_id: string
  d: number
  i: number
  s: number
  c: number
  predominante: LetraDisc
  respondido_em: string
}
