import { useQuery } from '@tanstack/react-query'
import { useEmpresaAtiva } from '@/app/sessao'
import { podeVerCaixa, podeVerPessoas } from '@/lib/permissoes'
import { supabase } from '@/lib/supabase'
import type { Categoria, Colaborador, Evento } from '@/lib/tipos'
import type { LancamentoDoCalculo } from '@/features/caixa/calculo'

/*
  Leituras do painel do dono. Ficam separadas das do módulo Caixa e do módulo Pessoas de propósito:
  o painel só lê, e o teste de tela troca este arquivo inteiro por dados de mentira.
*/

export type DadosDoCaixa = {
  ano: number
  saldoInicial: number
  categorias: Categoria[]
  lancamentos: LancamentoDoCalculo[]
}

export type PessoaDoPainel = Pick<Colaborador, 'id' | 'nome' | 'funcao' | 'data_entrada'> & {
  etapasConcluidas: number
  temDisc: boolean
}

export type DadosDePessoas = {
  totalDeEtapas: number
  pessoas: PessoaDoPainel[]
  eventosDaSemana: (Pick<Evento, 'id' | 'colaborador_id' | 'data' | 'tipo' | 'texto'> & { nome: string })[]
}

async function todosOsLancamentos(empresaId: string, ano: number): Promise<LancamentoDoCalculo[]> {
  const bloco = 1000
  const todos: LancamentoDoCalculo[] = []
  for (let de = 0; ; de += bloco) {
    const { data, error } = await supabase
      .from('lancamentos')
      .select('data, valor, categoria_id')
      .eq('empresa_id', empresaId)
      .gte('data', `${ano}-01-01`)
      .lte('data', `${ano}-12-31`)
      .order('data')
      .range(de, de + bloco - 1)
    if (error) throw error
    const linhas = (data ?? []).map((l) => ({ ...l, valor: Number(l.valor) })) as LancamentoDoCalculo[]
    todos.push(...linhas)
    if (linhas.length < bloco) return todos
  }
}

/** Ano do lançamento mais recente, para o painel abrir onde tem dado (a demo pode estar num ano fechado). */
async function anoMaisRecente(empresaId: string): Promise<number> {
  const { data, error } = await supabase
    .from('lancamentos')
    .select('data')
    .eq('empresa_id', empresaId)
    .order('data', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.data ? Number(String(data.data).slice(0, 4)) : new Date().getFullYear()
}

export function useCaixaDoPainel() {
  const { empresa, papel } = useEmpresaAtiva()
  return useQuery({
    queryKey: ['painel', 'caixa', empresa.id],
    enabled: podeVerCaixa(papel),
    queryFn: async (): Promise<DadosDoCaixa> => {
      const ano = await anoMaisRecente(empresa.id)
      const [categorias, saldo, lancamentos] = await Promise.all([
        supabase.from('categorias').select('*').eq('empresa_id', empresa.id),
        supabase.from('saldos_iniciais').select('valor').eq('empresa_id', empresa.id).eq('ano', ano).maybeSingle(),
        todosOsLancamentos(empresa.id, ano),
      ])
      if (categorias.error) throw categorias.error
      if (saldo.error) throw saldo.error
      return {
        ano,
        saldoInicial: Number(saldo.data?.valor ?? 0),
        categorias: (categorias.data ?? []) as Categoria[],
        lancamentos,
      }
    },
  })
}

export function usePessoasDoPainel() {
  const { empresa, papel } = useEmpresaAtiva()
  return useQuery({
    queryKey: ['painel', 'pessoas', empresa.id],
    enabled: podeVerPessoas(papel),
    queryFn: async (): Promise<DadosDePessoas> => {
      const semanaPassada = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
      const [colaboradores, etapas, progresso, resultados, eventos] = await Promise.all([
        supabase
          .from('colaboradores')
          .select('id, nome, funcao, data_entrada')
          .eq('empresa_id', empresa.id)
          .eq('situacao', 'ativo'),
        supabase.from('etapas_integracao').select('id').eq('empresa_id', empresa.id).eq('ativa', true),
        supabase.from('integracao_progresso').select('colaborador_id, etapa_id').eq('empresa_id', empresa.id),
        supabase.from('disc_resultados').select('colaborador_id').eq('empresa_id', empresa.id),
        supabase
          .from('eventos')
          .select('id, colaborador_id, data, tipo, texto, colaborador:colaboradores(nome)')
          .eq('empresa_id', empresa.id)
          .gte('data', semanaPassada)
          .order('data', { ascending: false })
          .limit(8),
      ])
      for (const r of [colaboradores, etapas, progresso, resultados, eventos]) if (r.error) throw r.error

      const etapasAtivas = new Set((etapas.data ?? []).map((e) => e.id as string))
      const concluidas = new Map<string, number>()
      for (const p of progresso.data ?? []) {
        if (!etapasAtivas.has(p.etapa_id as string)) continue
        concluidas.set(p.colaborador_id as string, (concluidas.get(p.colaborador_id as string) ?? 0) + 1)
      }
      const comDisc = new Set((resultados.data ?? []).map((r) => r.colaborador_id as string))

      type LinhaEvento = Pick<Evento, 'id' | 'colaborador_id' | 'data' | 'tipo' | 'texto'> & {
        colaborador: { nome: string } | null
      }
      return {
        totalDeEtapas: etapasAtivas.size,
        pessoas: ((colaboradores.data ?? []) as PessoaDoPainel[]).map((c) => ({
          ...c,
          etapasConcluidas: concluidas.get(c.id) ?? 0,
          temDisc: comDisc.has(c.id),
        })),
        eventosDaSemana: ((eventos.data ?? []) as unknown as LinhaEvento[]).map(({ colaborador, ...e }) => ({
          ...e,
          nome: colaborador?.nome ?? '',
        })),
      }
    },
  })
}
