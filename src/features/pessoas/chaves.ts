/*
  Chaves das consultas do módulo Pessoas. Tudo da empresa fica debaixo de ['pessoas', empresaId],
  então uma mudança qualquer (novo colaborador, etapa marcada, convite do DISC) invalida o módulo inteiro
  de uma vez e a tela nunca mostra um número velho.
*/

export const chaves = {
  tudo: (empresaId: string) => ['pessoas', empresaId] as const,
  lista: (empresaId: string) => ['pessoas', empresaId, 'lista'] as const,
  colaborador: (empresaId: string, id: string) => ['pessoas', empresaId, 'colaborador', id] as const,
  jornada: (empresaId: string, id: string) => ['pessoas', empresaId, 'jornada', id] as const,
  integracao: (empresaId: string, id: string) => ['pessoas', empresaId, 'integracao', id] as const,
  disc: (empresaId: string, id: string) => ['pessoas', empresaId, 'disc', id] as const,
  configuracoes: (empresaId: string) => ['configuracoes', empresaId] as const,
  etapas: (empresaId: string) => ['configuracoes', empresaId, 'etapas'] as const,
  membros: (empresaId: string) => ['configuracoes', empresaId, 'membros'] as const,
  /** O painel do dono lê pessoas também: toda mudança aqui avisa o painel. */
  painel: ['painel'] as const,
}
