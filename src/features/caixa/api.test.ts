import { supabase } from '@/lib/supabase'
import { importarCarga } from './api'

vi.mock('@/app/sessao', () => ({ useEmpresaAtiva: vi.fn() }))
vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }))

type Chamada = { tabela: string; acao: string; dados?: unknown }

/** Banco de mentira: registra o que foi pedido e deixa o teste escolher em qual bloco de lançamentos falhar. */
function bancoFalso(falharNoBloco: number | null) {
  const chamadas: Chamada[] = []
  let blocos = 0
  vi.mocked(supabase.from).mockImplementation(((tabela: string) => {
    const filtros = { eq: () => filtros, then: (ok: (r: unknown) => void) => ok({ error: null }) }
    return {
      insert: (dados: unknown) => {
        chamadas.push({ tabela, acao: 'insert', dados })
        if (tabela === 'cargas') {
          return { select: () => ({ single: () => Promise.resolve({ data: { id: 'carga-nova' }, error: null }) }) }
        }
        blocos += 1
        return Promise.resolve({ error: blocos === falharNoBloco ? { message: 'falhou no bloco' } : null })
      },
      delete: () => {
        chamadas.push({ tabela, acao: 'delete' })
        return filtros
      },
    }
  }) as never)
  return chamadas
}

const linhas = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ data: '2026-03-01', descricao: `linha ${i}`, valor: -(i + 1), categoria_id: null }))

const MAPA = { cabecalho: 0, data: 0, descricao: 1, valor: 2, entrada: null, saida: null }

test('grava a carga e os lançamentos em blocos de 500 com o id da carga', async () => {
  const chamadas = bancoFalso(null)
  const r = await importarCarga('e1', { arquivo: 'extrato.csv', mapeamento: MAPA, lancamentos: linhas(1200) })
  expect(r).toEqual({ cargaId: 'carga-nova', gravados: 1200 })
  expect(chamadas[0]).toMatchObject({ tabela: 'cargas', acao: 'insert', dados: { empresa_id: 'e1', arquivo: 'extrato.csv', linhas: 1200 } })
  const blocos = chamadas.filter((c) => c.tabela === 'lancamentos').map((c) => (c.dados as unknown[]).length)
  expect(blocos).toEqual([500, 500, 200])
  const primeiro = (chamadas[1]!.dados as Record<string, unknown>[])[0]
  expect(primeiro).toMatchObject({ empresa_id: 'e1', carga_id: 'carga-nova', origem: 'planilha' })
  expect(chamadas.some((c) => c.acao === 'delete')).toBe(false)
})

test('se um bloco falha, apaga a carga e devolve o erro', async () => {
  const chamadas = bancoFalso(2)
  await expect(importarCarga('e1', { arquivo: 'x.csv', mapeamento: MAPA, lancamentos: linhas(1200) })).rejects.toThrow('falhou no bloco')
  expect(chamadas.at(-1)).toEqual({ tabela: 'cargas', acao: 'delete' })
})
