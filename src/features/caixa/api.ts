import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEmpresaAtiva } from '@/app/sessao'
import { supabase } from '@/lib/supabase'
import type { Carga, Categoria, GrupoCategoria, Lancamento, RegraClassificacao } from '@/lib/tipos'
import { emBlocos, pendentesQueBatem } from './apoio'
import type { Mapeamento } from './planilha'

/*
  Todo acesso ao banco do módulo Caixa mora aqui, em hooks do TanStack Query.
  Toda leitura e escrita filtra pela empresa ativa (a RLS do banco confere de novo).
  As telas só usam estes hooks; os testes de tela trocam este arquivo por um dublê.
*/

const BLOCO_DE_LEITURA = 1000
const BLOCO_DE_GRAVACAO = 500
/** Quantos ids vão num `in (...)` de cada vez, para a URL não passar do limite. */
const BLOCO_DE_IDS = 200

const COLUNAS_DO_LANCAMENTO = 'id, empresa_id, data, descricao, valor, categoria_id, origem, carga_id'

/** Chaves do cache: tudo do caixa de uma empresa começa com ['caixa', empresaId]. */
export const chaves = {
  tudo: (empresaId: string) => ['caixa', empresaId] as const,
  categorias: (empresaId: string) => ['caixa', empresaId, 'categorias'] as const,
  regras: (empresaId: string) => ['caixa', empresaId, 'regras'] as const,
  lancamentosDoAno: (empresaId: string, ano: number) => ['caixa', empresaId, 'lancamentos', 'ano', ano] as const,
  lancamentosEntre: (empresaId: string, inicio: string, fim: string) =>
    ['caixa', empresaId, 'lancamentos', 'entre', inicio, fim] as const,
  semCategoria: (empresaId: string) => ['caixa', empresaId, 'lancamentos', 'sem-categoria'] as const,
  extremos: (empresaId: string) => ['caixa', empresaId, 'extremos'] as const,
  saldoInicial: (empresaId: string, ano: number) => ['caixa', empresaId, 'saldo-inicial', ano] as const,
  cargas: (empresaId: string) => ['caixa', empresaId, 'cargas'] as const,
}

function useEmpresaId(): string {
  return useEmpresaAtiva().empresa.id
}

type LinhaDeLancamento = Omit<Lancamento, 'valor'> & { valor: number | string }

const paraLancamento = (l: LinhaDeLancamento): Lancamento => ({ ...l, valor: Number(l.valor) })

type Pagina<T> = { data: T[] | null; error: { message: string } | null }

/** Lê em blocos de 1000 até acabar (o Supabase devolve no máximo 1000 linhas por pedido). */
async function lerTudo<T>(pedir: (de: number, ate: number) => PromiseLike<Pagina<T>>): Promise<T[]> {
  const todas: T[] = []
  for (let de = 0; ; de += BLOCO_DE_LEITURA) {
    const { data, error } = await pedir(de, de + BLOCO_DE_LEITURA - 1)
    if (error) throw new Error(error.message)
    const pagina = data ?? []
    todas.push(...pagina)
    if (pagina.length < BLOCO_DE_LEITURA) return todas
  }
}

async function lerLancamentos(empresaId: string, filtro: { inicio?: string; fim?: string; semCategoria?: boolean }) {
  const linhas = await lerTudo<LinhaDeLancamento>((de, ate) => {
    let q = supabase.from('lancamentos').select(COLUNAS_DO_LANCAMENTO).eq('empresa_id', empresaId)
    if (filtro.inicio) q = q.gte('data', filtro.inicio)
    if (filtro.fim) q = q.lte('data', filtro.fim)
    if (filtro.semCategoria) q = q.is('categoria_id', null)
    return q.order('data', { ascending: true }).order('id', { ascending: true }).range(de, ate)
  })
  return linhas.map(paraLancamento)
}

// ---------------------------------------------------------------- leituras

export function useCategorias() {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.categorias(empresaId),
    queryFn: async (): Promise<Categoria[]> => {
      const { data, error } = await supabase
        .from('categorias')
        .select('id, empresa_id, nome, grupo, ordem, ativa')
        .eq('empresa_id', empresaId)
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true })
      if (error) throw new Error(error.message)
      return (data ?? []) as Categoria[]
    },
  })
}

export function useRegras() {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.regras(empresaId),
    queryFn: async (): Promise<RegraClassificacao[]> => {
      const { data, error } = await supabase
        .from('regras_classificacao')
        .select('id, empresa_id, contem, categoria_id')
        .eq('empresa_id', empresaId)
        .order('contem', { ascending: true })
      if (error) throw new Error(error.message)
      return (data ?? []) as RegraClassificacao[]
    },
  })
}

export function useLancamentosDoAno(ano: number) {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.lancamentosDoAno(empresaId, ano),
    queryFn: () => lerLancamentos(empresaId, { inicio: `${ano}-01-01`, fim: `${ano}-12-31` }),
  })
}

/** Lançamentos gravados entre duas datas (para conferir se uma planilha já foi importada). */
export function useLancamentosEntre(inicio: string | null, fim: string | null) {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.lancamentosEntre(empresaId, inicio ?? '', fim ?? ''),
    queryFn: () => lerLancamentos(empresaId, { inicio: inicio ?? undefined, fim: fim ?? undefined }),
    enabled: inicio !== null && fim !== null,
  })
}

/** Todos os lançamentos sem categoria da empresa, de qualquer ano. */
export function useLancamentosSemCategoria() {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.semCategoria(empresaId),
    queryFn: () => lerLancamentos(empresaId, { semCategoria: true }),
  })
}

export type Extremos = { primeira: string | null; ultima: string | null }

/** Data do primeiro e do último lançamento da empresa (para escolher o ano e o mês que a tela abre). */
export function useExtremosDasDatas() {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.extremos(empresaId),
    queryFn: async (): Promise<Extremos> => {
      const ponta = async (ascending: boolean) => {
        const { data, error } = await supabase
          .from('lancamentos')
          .select('data')
          .eq('empresa_id', empresaId)
          .order('data', { ascending })
          .limit(1)
        if (error) throw new Error(error.message)
        return (data?.[0]?.data as string | undefined) ?? null
      }
      const [primeira, ultima] = await Promise.all([ponta(true), ponta(false)])
      return { primeira, ultima }
    },
  })
}

export function useSaldoInicial(ano: number) {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.saldoInicial(empresaId, ano),
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('saldos_iniciais')
        .select('valor')
        .eq('empresa_id', empresaId)
        .eq('ano', ano)
        .maybeSingle()
      if (error) throw new Error(error.message)
      return data ? Number(data.valor) : 0
    },
  })
}

/** As importações mais recentes, para poder desfazer uma inteira. */
export function useCargas() {
  const empresaId = useEmpresaId()
  return useQuery({
    queryKey: chaves.cargas(empresaId),
    queryFn: async (): Promise<Carga[]> => {
      const { data, error } = await supabase
        .from('cargas')
        .select('id, empresa_id, arquivo, linhas, criado_em')
        .eq('empresa_id', empresaId)
        .order('criado_em', { ascending: false })
        .limit(10)
      if (error) throw new Error(error.message)
      return (data ?? []) as Carga[]
    },
  })
}

// ---------------------------------------------------------------- escritas

/** Depois de qualquer escrita, recarrega tudo do caixa da empresa (é pouco dado). */
function useRecarregar() {
  const empresaId = useEmpresaId()
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: chaves.tudo(empresaId) })
}

function falhou(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export function useSalvarSaldoInicial() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async ({ ano, valor }: { ano: number; valor: number }) => {
      const { error } = await supabase
        .from('saldos_iniciais')
        .upsert({ empresa_id: empresaId, ano, valor }, { onConflict: 'empresa_id,ano' })
      falhou(error)
    },
    onSuccess: recarregar,
  })
}

export function useCriarCategoria() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async (nova: { nome: string; grupo: GrupoCategoria; ordem: number }) => {
      const { error } = await supabase
        .from('categorias')
        .insert({ empresa_id: empresaId, nome: nova.nome.trim(), grupo: nova.grupo, ordem: nova.ordem, ativa: true })
      falhou(error)
    },
    onSuccess: recarregar,
  })
}

export function useEditarCategoria() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async ({ id, ...campos }: { id: string; nome?: string; ativa?: boolean }) => {
      const { error } = await supabase.from('categorias').update(campos).eq('empresa_id', empresaId).eq('id', id)
      falhou(error)
    },
    onSuccess: recarregar,
  })
}

/** Grava a ordem nova das categorias que mudaram de lugar. */
export function useReordenarCategorias() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async (itens: { id: string; ordem: number }[]) => {
      for (const { id, ordem } of itens) {
        const { error } = await supabase.from('categorias').update({ ordem }).eq('empresa_id', empresaId).eq('id', id)
        falhou(error)
      }
    },
    onSuccess: recarregar,
  })
}

async function classificarEmLote(empresaId: string, ids: string[], categoriaId: string): Promise<number> {
  let classificados = 0
  for (const bloco of emBlocos(ids, BLOCO_DE_IDS)) {
    const { data, error } = await supabase
      .from('lancamentos')
      .update({ categoria_id: categoriaId })
      .eq('empresa_id', empresaId)
      .is('categoria_id', null)
      .in('id', bloco)
      .select('id')
    falhou(error)
    classificados += data?.length ?? 0
  }
  return classificados
}

/**
 * Cria a regra e já classifica os lançamentos sem categoria da empresa que batem com ela.
 * Devolve quantos foram classificados.
 */
export function useCriarRegra() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async ({ contem, categoria_id }: { contem: string; categoria_id: string }) => {
      const trecho = contem.trim()
      const { error } = await supabase.from('regras_classificacao').insert({ empresa_id: empresaId, contem: trecho, categoria_id })
      falhou(error)
      const pendentes = await lerLancamentos(empresaId, { semCategoria: true })
      const ids = pendentesQueBatem(pendentes, trecho)
      const classificados = await classificarEmLote(empresaId, ids, categoria_id)
      return { classificados }
    },
    onSuccess: recarregar,
  })
}

export function useExcluirRegra() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('regras_classificacao').delete().eq('empresa_id', empresaId).eq('id', id)
      falhou(error)
    },
    onSuccess: recarregar,
  })
}

/** Troca a categoria de um lançamento (ou tira, com null). */
export function useClassificarLancamento() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async ({ id, categoria_id }: { id: string; categoria_id: string | null }) => {
      const { error } = await supabase.from('lancamentos').update({ categoria_id }).eq('empresa_id', empresaId).eq('id', id)
      falhou(error)
    },
    onSuccess: recarregar,
  })
}

export type LancamentoNovo = { data: string; descricao: string; valor: number; categoria_id: string | null }

export function useCriarLancamento() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async (novo: LancamentoNovo) => {
      if (novo.valor === 0) throw new Error('O valor não pode ser zero.')
      const { error } = await supabase.from('lancamentos').insert({
        empresa_id: empresaId,
        data: novo.data,
        descricao: novo.descricao.trim(),
        valor: novo.valor,
        categoria_id: novo.categoria_id,
        origem: 'manual',
        carga_id: null,
      })
      falhou(error)
    },
    onSuccess: recarregar,
  })
}

/** Só apaga lançamento manual. O da planilha sai desfazendo a importação inteira. */
export function useExcluirLancamento() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lancamentos')
        .delete()
        .eq('empresa_id', empresaId)
        .eq('id', id)
        .eq('origem', 'manual')
      falhou(error)
    },
    onSuccess: recarregar,
  })
}

export type PedidoDeImportacao = {
  arquivo: string
  mapeamento: Mapeamento
  lancamentos: { data: string; descricao: string; valor: number; categoria_id: string | null }[]
}

/**
 * Grava uma importação: primeiro a carga, depois os lançamentos em blocos de 500 com o id dela.
 * Se algum bloco falhar, apaga a carga (o banco apaga junto os lançamentos que já entraram).
 */
export async function importarCarga(empresaId: string, pedido: PedidoDeImportacao): Promise<{ cargaId: string; gravados: number }> {
  const { data, error } = await supabase
    .from('cargas')
    .insert({ empresa_id: empresaId, arquivo: pedido.arquivo, linhas: pedido.lancamentos.length, mapeamento: pedido.mapeamento })
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'Não foi possível registrar a importação.')
  const cargaId = data.id as string

  let gravados = 0
  try {
    for (const bloco of emBlocos(pedido.lancamentos, BLOCO_DE_GRAVACAO)) {
      const { error: erroDoBloco } = await supabase.from('lancamentos').insert(
        bloco.map((l) => ({
          empresa_id: empresaId,
          data: l.data,
          descricao: l.descricao,
          valor: l.valor,
          categoria_id: l.categoria_id,
          origem: 'planilha' as const,
          carga_id: cargaId,
        })),
      )
      falhou(erroDoBloco)
      gravados += bloco.length
    }
  } catch (e) {
    await supabase.from('cargas').delete().eq('empresa_id', empresaId).eq('id', cargaId)
    throw e
  }
  return { cargaId, gravados }
}

export function useImportarCarga() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: (pedido: PedidoDeImportacao) => importarCarga(empresaId, pedido),
    onSuccess: recarregar,
  })
}

/** Apaga a carga; o banco apaga junto todos os lançamentos dela. */
export function useDesfazerCarga() {
  const empresaId = useEmpresaId()
  const recarregar = useRecarregar()
  return useMutation({
    mutationFn: async (cargaId: string) => {
      const { error } = await supabase.from('cargas').delete().eq('empresa_id', empresaId).eq('id', cargaId)
      falhou(error)
    },
    onSuccess: recarregar,
  })
}
