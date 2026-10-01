import { vi } from 'vitest'
import type { Empresa, Papel, Vinculo } from '@/lib/tipos'

/*
  Dublês usados só pelos testes de tela de Pessoas, DISC e Configurações.
  Os hooks do TanStack Query são trocados por objetos com os campos que as telas leem.
*/

export const EMPRESA_DE_TESTE: Empresa = { id: 'empresa-1', nome: 'Empresa de Teste', perfil: 'comercio', ano_inicio: 2026 }

export function vinculo(papel: Papel): Vinculo {
  return { papel, empresa: EMPRESA_DE_TESTE }
}

/** Consulta já carregada com estes dados. */
export function consulta<T>(data: T) {
  return { data, isPending: false, isError: false, isSuccess: true, error: null, refetch: vi.fn() } as never
}

export function consultaCarregando() {
  return { data: undefined, isPending: true, isError: false, isSuccess: false, error: null, refetch: vi.fn() } as never
}

export function consultaComErro() {
  return { data: undefined, isPending: false, isError: true, isSuccess: false, error: new Error('falhou'), refetch: vi.fn() } as never
}

/** Mutação parada. `mutate` é um vi.fn para o teste conferir o que foi mandado (passe `m as never` ao mock). */
export function mutacao(extra: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    reset: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: undefined,
    ...extra,
  }
}
