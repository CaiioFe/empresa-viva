import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Categoria, Empresa, Papel, Vinculo } from '@/lib/tipos'

/*
  Dublês usados só pelos testes de tela do caixa (arquivos *.test.tsx).
  Os testes trocam './api' e '@/app/sessao' por vi.mock e usam estas fábricas para montar as respostas.
*/

export const EMPRESA: Empresa = { id: 'empresa-teste', nome: 'Empresa de Teste', perfil: 'comercio', ano_inicio: 2026 }

export const vinculo = (papel: Papel): Vinculo => ({ papel, empresa: EMPRESA })

/** Resposta de useQuery já carregada. */
export function consulta<T>(data: T) {
  return { data, error: null, isPending: false, isLoading: false, isError: false, isSuccess: true } as never
}

/** Resposta de useQuery ainda carregando. */
export function carregando() {
  return { data: undefined, error: null, isPending: true, isLoading: true, isError: false, isSuccess: false } as never
}

/** Resposta de useQuery com erro. */
export function comErro(mensagem: string) {
  return { data: undefined, error: new Error(mensagem), isPending: false, isLoading: false, isError: true, isSuccess: false } as never
}

/** Resposta de useMutation, com o mutateAsync que o teste confere. */
export function mutacao(resultado: unknown = undefined) {
  return { mutateAsync: vi.fn().mockResolvedValue(resultado), mutate: vi.fn(), isPending: false }
}

export const categoria = (id: string, nome: string, grupo: Categoria['grupo'], ordem: number, ativa = true): Categoria => ({
  id,
  empresa_id: EMPRESA.id,
  nome,
  grupo,
  ordem,
  ativa,
})

export const CATEGORIAS: Categoria[] = [
  categoria('vendas', 'Vendas', 'recebimentos', 1),
  categoria('pessoal', 'Pessoal', 'pagamentos_operacionais', 1),
  categoria('aluguel', 'Aluguel', 'pagamentos_operacionais', 2),
  categoria('marketing', 'Marketing', 'pagamentos_operacionais', 3),
  categoria('prolabore', 'Pró-labore', 'acionistas', 1),
]

export function renderizarEm(rota: string, ui: ReactElement) {
  return render(<MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>)
}
