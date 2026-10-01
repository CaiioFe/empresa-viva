import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Empresa, Papel, Vinculo } from '@/lib/tipos'

const CHAVE_EMPRESA = 'empresa-viva:empresa-ativa'

function lerEmpresaSalva(): string | null {
  try {
    return localStorage.getItem(CHAVE_EMPRESA)
  } catch {
    return null
  }
}

function salvarEmpresa(id: string | null) {
  try {
    if (id) localStorage.setItem(CHAVE_EMPRESA, id)
    else localStorage.removeItem(CHAVE_EMPRESA)
  } catch {
    // navegador sem armazenamento: a pessoa só escolhe de novo na próxima vez
  }
}

/** Com um vínculo só, ele é o ativo. Com vários, vale o que a pessoa escolheu por último, se ainda existir. */
export function escolherVinculoAtivo(vinculos: Vinculo[], salvo: string | null): Vinculo | null {
  if (vinculos.length === 1) return vinculos[0] ?? null
  return vinculos.find((v) => v.empresa.id === salvo) ?? null
}

type LinhaMembro = { papel: Papel; empresa: Empresa | null }

async function buscarVinculos(usuarioId: string): Promise<Vinculo[]> {
  const { data, error } = await supabase
    .from('membros')
    .select('papel, empresa:empresas(id, nome, perfil, ano_inicio)')
    .eq('usuario_id', usuarioId)
    .eq('ativo', true)
  if (error) throw error
  return ((data ?? []) as unknown as LinhaMembro[])
    .filter((l): l is { papel: Papel; empresa: Empresa } => l.empresa !== null)
    .sort((a, b) => a.empresa.nome.localeCompare(b.empresa.nome, 'pt-BR'))
}

type EstadoSessao = {
  carregando: boolean
  usuario: User | null
  vinculos: Vinculo[]
  ativo: Vinculo | null
  entrar: (email: string, senha: string) => Promise<string | null>
  sair: () => Promise<void>
  escolherEmpresa: (empresaId: string) => void
}

const Contexto = createContext<EstadoSessao | null>(null)

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [usuario, setUsuario] = useState<User | null>(null)
  const [vinculos, setVinculos] = useState<Vinculo[]>([])
  const [empresaEscolhida, setEmpresaEscolhida] = useState<string | null>(lerEmpresaSalva)

  const carregar = useCallback(async (u: User | null) => {
    setUsuario(u)
    if (!u) {
      setVinculos([])
      setCarregando(false)
      return
    }
    try {
      setVinculos(await buscarVinculos(u.id))
    } catch {
      setVinculos([])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => carregar(data.session?.user ?? null))
    const { data } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT') {
        setCarregando(true)
        void carregar(sessao?.user ?? null)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [carregar])

  const entrar = useCallback(async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (!error) return null
    return /invalid/i.test(error.message) ? 'E-mail ou senha não conferem.' : 'Não foi possível entrar agora. Tente de novo.'
  }, [])

  const sair = useCallback(async () => {
    salvarEmpresa(null)
    setEmpresaEscolhida(null)
    await supabase.auth.signOut()
  }, [])

  const escolherEmpresa = useCallback((empresaId: string) => {
    salvarEmpresa(empresaId)
    setEmpresaEscolhida(empresaId)
  }, [])

  const valor = useMemo<EstadoSessao>(
    () => ({
      carregando,
      usuario,
      vinculos,
      ativo: escolherVinculoAtivo(vinculos, empresaEscolhida),
      entrar,
      sair,
      escolherEmpresa,
    }),
    [carregando, usuario, vinculos, empresaEscolhida, entrar, sair, escolherEmpresa],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSessao(): EstadoSessao {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('useSessao precisa estar dentro de <SessaoProvider>')
  return valor
}

/** Atalho para as telas internas, que só existem com uma empresa ativa. */
export function useEmpresaAtiva(): Vinculo {
  const { ativo } = useSessao()
  if (!ativo) throw new Error('Tela interna aberta sem empresa ativa')
  return ativo
}
