import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Modo = 'demonstracao' | 'real'

/** Quem sabe o modo é o banco (tabela ambiente). Se não der para ler, trata como real: nada de botão de demo. */
export function useModo(): Modo {
  const { data } = useQuery({
    queryKey: ['ambiente'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ambiente').select('modo').maybeSingle()
      if (error) throw error
      return (data?.modo as Modo | undefined) ?? 'real'
    },
    staleTime: 5 * 60_000,
  })
  return data ?? 'real'
}

export function FaixaDeDemonstracao() {
  const modo = useModo()
  if (modo !== 'demonstracao') return null
  return (
    <div className="bg-ambar-claro px-4 py-1.5 text-center text-xs text-ambar-escuro font-medium">
      Demonstração com empresas e pessoas fictícias
    </div>
  )
}
