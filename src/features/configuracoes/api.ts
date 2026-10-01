import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEmpresaAtiva } from '@/app/sessao'
import { chaves } from '@/features/pessoas/chaves'
import { supabase } from '@/lib/supabase'
import type { EtapaIntegracao, Membro, Papel } from '@/lib/tipos'

/*
  Acesso ao banco da tela de Configurações (só o Dono abre).
  Usuário novo não se cria por aqui: a Maestria cria, porque o banco é compartilhado (ver ARQUITETURA).
*/

function useInvalidarConfiguracoes() {
  const cliente = useQueryClient()
  const { empresa } = useEmpresaAtiva()
  return () =>
    Promise.all([
      cliente.invalidateQueries({ queryKey: chaves.configuracoes(empresa.id) }),
      // etapas mexem no status de integração de todo mundo
      cliente.invalidateQueries({ queryKey: chaves.tudo(empresa.id) }),
      cliente.invalidateQueries({ queryKey: chaves.painel }),
    ])
}

/** Todas as etapas, ativas e desativadas, em ordem. */
export function useEtapas() {
  const { empresa } = useEmpresaAtiva()
  return useQuery({
    queryKey: chaves.etapas(empresa.id),
    queryFn: async (): Promise<EtapaIntegracao[]> => {
      const { data, error } = await supabase
        .from('etapas_integracao')
        .select('id, empresa_id, nome, ordem, ativa')
        .eq('empresa_id', empresa.id)
        .order('ordem')
        .order('nome')
      if (error) throw error
      return (data ?? []) as EtapaIntegracao[]
    },
  })
}

export function useCriarEtapa() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarConfiguracoes()
  return useMutation({
    mutationFn: async ({ nome, ordem }: { nome: string; ordem: number }) => {
      const { error } = await supabase.from('etapas_integracao').insert({ empresa_id: empresa.id, nome: nome.trim(), ordem })
      if (error) throw error
    },
    onSuccess: invalidar,
  })
}

/** Renomeia, desativa ou reativa uma etapa. */
export function useEditarEtapa() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarConfiguracoes()
  return useMutation({
    mutationFn: async ({ id, ...mudanca }: { id: string; nome?: string; ativa?: boolean }) => {
      const { error } = await supabase.from('etapas_integracao').update(mudanca).eq('empresa_id', empresa.id).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidar,
  })
}

/** Grava a nova ordem das etapas que mudaram de lugar. */
export function useReordenarEtapas() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarConfiguracoes()
  return useMutation({
    mutationFn: async (novas: { id: string; ordem: number }[]) => {
      const respostas = await Promise.all(
        novas.map(({ id, ordem }) =>
          supabase.from('etapas_integracao').update({ ordem }).eq('empresa_id', empresa.id).eq('id', id),
        ),
      )
      const falha = respostas.find((r) => r.error)
      if (falha?.error) throw falha.error
    },
    onSuccess: invalidar,
  })
}

/** Usuários da empresa. O banco só deixa o Dono ver todos. */
export function useMembros() {
  const { empresa } = useEmpresaAtiva()
  return useQuery({
    queryKey: chaves.membros(empresa.id),
    queryFn: async (): Promise<Membro[]> => {
      const { data, error } = await supabase
        .from('membros')
        .select('id, empresa_id, usuario_id, papel, nome, ativo')
        .eq('empresa_id', empresa.id)
        .order('nome')
      if (error) throw error
      return (data ?? []) as Membro[]
    },
  })
}

/** Muda o papel ou desativa/reativa alguém. O banco recusa mexer na própria linha. */
export function useEditarMembro() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarConfiguracoes()
  return useMutation({
    mutationFn: async ({ id, ...mudanca }: { id: string; papel?: Papel; ativo?: boolean }) => {
      const { error } = await supabase.from('membros').update(mudanca).eq('empresa_id', empresa.id).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidar,
  })
}
