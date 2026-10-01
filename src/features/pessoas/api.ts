import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEmpresaAtiva } from '@/app/sessao'
import { supabase } from '@/lib/supabase'
import type { Colaborador, EtapaIntegracao, Evento, LetraDisc, ProgressoIntegracao, TipoEvento } from '@/lib/tipos'
import { chaves } from './chaves'
import { contarConcluidas } from './regras'

/*
  Todo acesso ao banco do módulo Pessoas. As telas só usam estes hooks; os testes de tela trocam
  este arquivo inteiro por dados de mentira. Toda leitura e escrita filtra pela empresa ativa
  (a trava de verdade é a RLS do banco; o filtro aqui evita misturar empresas de quem é consultora).
*/

const CAMPOS_DO_COLABORADOR = 'id, empresa_id, nome, funcao, setor, data_entrada, telefone, email, situacao, data_saida'

export type PessoaDaLista = Colaborador & { etapasConcluidas: number; letraDisc: LetraDisc | null }
export type ListaDePessoas = { totalDeEtapas: number; pessoas: PessoaDaLista[] }

export type DadosDoColaborador = {
  nome: string
  funcao: string
  setor: string
  data_entrada: string
  telefone: string | null
  email: string | null
}

export type IntegracaoDoColaborador = { etapas: EtapaIntegracao[]; concluidas: ProgressoIntegracao[] }

type Resposta = { data: unknown[] | null; error: unknown }

/** Lê em blocos de 1.000 (o limite de cada leitura do Supabase), para empresa grande não ficar pela metade. */
async function lerTudo<T>(montar: (de: number, ate: number) => PromiseLike<Resposta>): Promise<T[]> {
  const bloco = 1000
  const todas: T[] = []
  for (let de = 0; ; de += bloco) {
    const { data, error } = await montar(de, de + bloco - 1)
    if (error) throw error
    const linhas = (data ?? []) as T[]
    todas.push(...linhas)
    if (linhas.length < bloco) return todas
  }
}

function useInvalidarPessoas() {
  const cliente = useQueryClient()
  const { empresa } = useEmpresaAtiva()
  return () =>
    Promise.all([
      cliente.invalidateQueries({ queryKey: chaves.tudo(empresa.id) }),
      cliente.invalidateQueries({ queryKey: chaves.painel }),
    ])
}

// ---------------------------------------------------------------------------
// Leituras

export function usePessoas() {
  const { empresa } = useEmpresaAtiva()
  return useQuery({
    queryKey: chaves.lista(empresa.id),
    queryFn: async (): Promise<ListaDePessoas> => {
      const [colaboradores, etapas, progresso, resultados] = await Promise.all([
        lerTudo<Colaborador>((de, ate) =>
          supabase
            .from('colaboradores')
            .select(CAMPOS_DO_COLABORADOR)
            .eq('empresa_id', empresa.id)
            .order('nome')
            .order('id')
            .range(de, ate),
        ),
        supabase.from('etapas_integracao').select('id').eq('empresa_id', empresa.id).eq('ativa', true),
        lerTudo<{ colaborador_id: string; etapa_id: string }>((de, ate) =>
          supabase
            .from('integracao_progresso')
            .select('colaborador_id, etapa_id')
            .eq('empresa_id', empresa.id)
            .order('colaborador_id')
            .order('etapa_id')
            .range(de, ate),
        ),
        lerTudo<{ colaborador_id: string; predominante: LetraDisc | null }>((de, ate) =>
          supabase
            .from('disc_resultados')
            .select('colaborador_id, predominante')
            .eq('empresa_id', empresa.id)
            .order('respondido_em', { ascending: false })
            .order('id')
            .range(de, ate),
        ),
      ])
      if (etapas.error) throw etapas.error

      const etapasAtivas = (etapas.data ?? []).map((e) => e.id as string)
      const feitasPorPessoa = new Map<string, string[]>()
      for (const p of progresso) feitasPorPessoa.set(p.colaborador_id, [...(feitasPorPessoa.get(p.colaborador_id) ?? []), p.etapa_id])
      // resultados vêm do mais novo para o mais antigo: o primeiro de cada pessoa é o que vale
      const letraPorPessoa = new Map<string, LetraDisc>()
      for (const r of resultados) {
        if (r.predominante && !letraPorPessoa.has(r.colaborador_id)) letraPorPessoa.set(r.colaborador_id, r.predominante)
      }

      return {
        totalDeEtapas: etapasAtivas.length,
        pessoas: colaboradores.map((c) => ({
          ...c,
          etapasConcluidas: contarConcluidas(etapasAtivas, feitasPorPessoa.get(c.id) ?? []),
          letraDisc: letraPorPessoa.get(c.id) ?? null,
        })),
      }
    },
  })
}

/** Um colaborador da empresa ativa. Id de outra empresa ou inexistente devolve null. */
export function useColaborador(id: string) {
  const { empresa } = useEmpresaAtiva()
  return useQuery({
    queryKey: chaves.colaborador(empresa.id, id),
    queryFn: async (): Promise<Colaborador | null> => {
      const { data, error } = await supabase
        .from('colaboradores')
        .select(CAMPOS_DO_COLABORADOR)
        .eq('empresa_id', empresa.id)
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      return (data as Colaborador | null) ?? null
    },
  })
}

/** Eventos da jornada, do mais novo para o mais antigo. */
export function useJornada(colaboradorId: string) {
  const { empresa } = useEmpresaAtiva()
  return useQuery({
    queryKey: chaves.jornada(empresa.id, colaboradorId),
    queryFn: async (): Promise<Evento[]> => {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, empresa_id, colaborador_id, data, tipo, texto')
        .eq('empresa_id', empresa.id)
        .eq('colaborador_id', colaboradorId)
        .order('data', { ascending: false })
        .order('criado_em', { ascending: false })
      if (error) throw error
      return (data ?? []) as Evento[]
    },
  })
}

/** Etapas ativas da empresa (em ordem) e as que esta pessoa já concluiu. */
export function useIntegracaoDoColaborador(colaboradorId: string) {
  const { empresa } = useEmpresaAtiva()
  return useQuery({
    queryKey: chaves.integracao(empresa.id, colaboradorId),
    queryFn: async (): Promise<IntegracaoDoColaborador> => {
      const [etapas, concluidas] = await Promise.all([
        supabase
          .from('etapas_integracao')
          .select('id, empresa_id, nome, ordem, ativa')
          .eq('empresa_id', empresa.id)
          .eq('ativa', true)
          .order('ordem')
          .order('nome'),
        supabase
          .from('integracao_progresso')
          .select('colaborador_id, etapa_id, concluida_em')
          .eq('empresa_id', empresa.id)
          .eq('colaborador_id', colaboradorId),
      ])
      if (etapas.error) throw etapas.error
      if (concluidas.error) throw concluidas.error
      return {
        etapas: (etapas.data ?? []) as EtapaIntegracao[],
        concluidas: (concluidas.data ?? []) as ProgressoIntegracao[],
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Escritas

/** Cadastra e devolve o id. O banco cria sozinho o evento de contratação na jornada. */
export function useCriarColaborador() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarPessoas()
  return useMutation({
    mutationFn: async (dados: DadosDoColaborador): Promise<string> => {
      const { data, error } = await supabase
        .from('colaboradores')
        .insert({ ...dados, empresa_id: empresa.id })
        .select('id')
        .single()
      if (error) throw error
      return (data as { id: string }).id
    },
    onSuccess: invalidar,
  })
}

export function useEditarColaborador() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarPessoas()
  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: DadosDoColaborador }) => {
      const { error } = await supabase.from('colaboradores').update(dados).eq('empresa_id', empresa.id).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidar,
  })
}

/** Muda a situação para desligado, grava a data de saída e registra o desligamento na jornada. */
export function useDesligarColaborador() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarPessoas()
  return useMutation({
    mutationFn: async ({ id, dataSaida, texto }: { id: string; dataSaida: string; texto: string }) => {
      const mudanca = await supabase
        .from('colaboradores')
        .update({ situacao: 'desligado', data_saida: dataSaida })
        .eq('empresa_id', empresa.id)
        .eq('id', id)
      if (mudanca.error) throw mudanca.error
      const evento = await supabase.from('eventos').insert({
        empresa_id: empresa.id,
        colaborador_id: id,
        data: dataSaida,
        tipo: 'desligamento',
        texto: texto.trim() || 'Desligado da empresa',
      })
      if (evento.error) throw evento.error
    },
    onSuccess: invalidar,
  })
}

export function useRegistrarEvento() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarPessoas()
  return useMutation({
    mutationFn: async (evento: { colaboradorId: string; tipo: TipoEvento; data: string; texto: string }) => {
      const { error } = await supabase.from('eventos').insert({
        empresa_id: empresa.id,
        colaborador_id: evento.colaboradorId,
        data: evento.data,
        tipo: evento.tipo,
        texto: evento.texto.trim(),
      })
      if (error) throw error
    },
    onSuccess: invalidar,
  })
}

/**
 * Marca ou desmarca uma etapa. Quando a etapa marcada é a última que faltava (`fechaIntegracao`),
 * registra "Integração concluída" na jornada, com a data de hoje.
 */
export function useMarcarEtapa() {
  const { empresa } = useEmpresaAtiva()
  const invalidar = useInvalidarPessoas()
  return useMutation({
    mutationFn: async (m: { colaboradorId: string; etapaId: string; concluida: boolean; fechaIntegracao: boolean; hoje: string }) => {
      if (m.concluida) {
        const { error } = await supabase
          .from('integracao_progresso')
          .upsert(
            { empresa_id: empresa.id, colaborador_id: m.colaboradorId, etapa_id: m.etapaId },
            { onConflict: 'colaborador_id,etapa_id', ignoreDuplicates: true },
          )
        if (error) throw error
        if (m.fechaIntegracao) {
          const evento = await supabase.from('eventos').insert({
            empresa_id: empresa.id,
            colaborador_id: m.colaboradorId,
            data: m.hoje,
            tipo: 'integracao',
            texto: 'Integração concluída',
          })
          if (evento.error) throw evento.error
        }
      } else {
        const { error } = await supabase
          .from('integracao_progresso')
          .delete()
          .eq('empresa_id', empresa.id)
          .eq('colaborador_id', m.colaboradorId)
          .eq('etapa_id', m.etapaId)
        if (error) throw error
      }
    },
    onSuccess: invalidar,
  })
}
