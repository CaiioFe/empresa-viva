import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEmpresaAtiva } from '@/app/sessao'
import { chaves } from '@/features/pessoas/chaves'
import { supabase } from '@/lib/supabase'
import type { ConviteDisc, LetraDisc, ResultadoDisc } from '@/lib/tipos'
import type { ResultadoCalculado } from './questionario'
import { pareceToken } from './regras'

/*
  Acesso ao banco do DISC. Duas metades:
  - dentro do app (ficha): ler o resultado e o convite pendente, criar convite. Filtra pela empresa ativa.
  - página pública /disc/:token (sem login): só as duas funções do banco que aceitam o token.
*/

export type DiscDoColaborador = { resultado: ResultadoDisc | null; convitePendente: ConviteDisc | null }

/** Resultado mais recente e, se não houver, o convite que ainda espera resposta. */
export function useDiscDoColaborador(colaboradorId: string) {
  const { empresa } = useEmpresaAtiva()
  return useQuery({
    queryKey: chaves.disc(empresa.id, colaboradorId),
    queryFn: async (): Promise<DiscDoColaborador> => {
      const [resultado, convite] = await Promise.all([
        supabase
          .from('disc_resultados')
          .select('id, colaborador_id, d, i, s, c, predominante, respondido_em')
          .eq('empresa_id', empresa.id)
          .eq('colaborador_id', colaboradorId)
          .order('respondido_em', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('disc_convites')
          .select('id, colaborador_id, token, criado_em, respondido_em')
          .eq('empresa_id', empresa.id)
          .eq('colaborador_id', colaboradorId)
          .is('respondido_em', null)
          .order('criado_em', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      if (resultado.error) throw resultado.error
      if (convite.error) throw convite.error
      const linha = resultado.data as ResultadoDisc | null
      return {
        resultado: linha
          ? { ...linha, d: Number(linha.d), i: Number(linha.i), s: Number(linha.s), c: Number(linha.c) }
          : null,
        convitePendente: (convite.data as ConviteDisc | null) ?? null,
      }
    },
  })
}

/** Cria o convite do teste. O banco gera o token do link. */
export function useCriarConviteDisc() {
  const { empresa } = useEmpresaAtiva()
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ colaboradorId }: { colaboradorId: string }): Promise<ConviteDisc> => {
      const { data, error } = await supabase
        .from('disc_convites')
        .insert({ empresa_id: empresa.id, colaborador_id: colaboradorId })
        .select('id, colaborador_id, token, criado_em, respondido_em')
        .single()
      if (error) throw error
      return data as ConviteDisc
    },
    onSuccess: () =>
      Promise.all([
        cliente.invalidateQueries({ queryKey: chaves.tudo(empresa.id) }),
        cliente.invalidateQueries({ queryKey: chaves.painel }),
      ]),
  })
}

// ---------------------------------------------------------------------------
// Página pública

export type ConvitePublico = { primeiroNome: string; respondido: boolean }

/** Lê o convite pelo token. Token que não existe (ou nem tem formato de token) devolve null. */
export function useConviteDisc(token: string) {
  return useQuery({
    queryKey: ['disc-publico', token],
    retry: false,
    staleTime: Infinity,
    queryFn: async (): Promise<ConvitePublico | null> => {
      if (!pareceToken(token)) return null
      const { data, error } = await supabase.rpc('disc_ler_convite', { p_token: token })
      if (error) throw error
      const linha = (data as { primeiro_nome: string; respondido: boolean }[] | null)?.[0]
      return linha ? { primeiroNome: linha.primeiro_nome, respondido: linha.respondido } : null
    },
  })
}

/** Manda as 24 letras. O banco calcula de novo, grava uma vez só e devolve o perfil. */
export function useResponderDisc() {
  return useMutation({
    mutationFn: async ({ token, respostas }: { token: string; respostas: LetraDisc[] }): Promise<ResultadoCalculado> => {
      const { data, error } = await supabase.rpc('disc_responder', { p_token: token, p_respostas: respostas })
      if (error) throw new Error(error.message)
      const linha = (data as ResultadoCalculado[] | ResultadoCalculado | null)
      const resultado = Array.isArray(linha) ? linha[0] : linha
      if (!resultado) throw new Error('O banco não devolveu o resultado.')
      return {
        d: Number(resultado.d),
        i: Number(resultado.i),
        s: Number(resultado.s),
        c: Number(resultado.c),
        predominante: resultado.predominante,
      }
    },
  })
}
