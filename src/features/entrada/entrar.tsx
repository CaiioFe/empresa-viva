import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useSessao } from '@/app/sessao'
import { Aviso, Button, Campo } from '@/components/ui'
import { Marca } from '@/components/layout/app-shell'
import { useModo } from '@/features/ambiente/faixa'
import { NOME_DO_PAPEL } from '@/lib/permissoes'
import type { Papel } from '@/lib/tipos'
import { cn } from '@/lib/utils'

/*
  Usuários da demonstração. A senha é pública de propósito: a base da demo só tem empresas e pessoas
  inventadas, e esses usuários são apagados quando o sistema vira real (virar_ambiente_real).
*/
export const USUARIOS_DA_DEMONSTRACAO: { papel: Papel; email: string; descricao: string }[] = [
  { papel: 'dono', email: 'caiofebc+ev-dono@gmail.com', descricao: 'Vê o caixa e as pessoas da empresa' },
  { papel: 'financeiro', email: 'caiofebc+ev-financeiro@gmail.com', descricao: 'Só o caixa' },
  { papel: 'rh', email: 'caiofebc+ev-rh@gmail.com', descricao: 'Só as pessoas' },
  { papel: 'consultora', email: 'caiofebc+ev-consultora@gmail.com', descricao: 'Acompanha as três empresas' },
]
export const SENHA_DA_DEMONSTRACAO = 'empresa-viva-demo-2026'

export function PaginaEntrar() {
  const { usuario, carregando, entrar } = useSessao()
  const modo = useModo()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!carregando && usuario) return <Navigate to="/" replace />

  async function tentar(e: string, s: string) {
    setEnviando(true)
    setErro(null)
    const falha = await entrar(e, s)
    if (falha) setErro(falha)
    setEnviando(false)
  }

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    void tentar(email, senha)
  }

  return (
    <div className="min-h-svh bg-fundo p-3 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100svh-1.5rem)] max-w-[1280px] gap-3 sm:min-h-[calc(100svh-2rem)] sm:gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Vitrine />

        <section className="flex flex-col rounded-caixa bg-superficie p-6 shadow-painel sm:p-10">
          <Marca />
          <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-10">
            <h1 className="text-[28px] font-extrabold tracking-tight text-tinta">Bem-vindo de volta</h1>
            <p className="mt-1.5 text-sm text-tinta-2">Entre para ver o caixa e as pessoas da sua empresa.</p>
            <form onSubmit={enviar} className="mt-8 flex flex-col gap-4">
              <Campo rotulo="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <Campo
                rotulo="Senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              {erro && <Aviso tom="erro">{erro}</Aviso>}
              <Button type="submit" disabled={enviando} className="mt-2 w-full">
                {enviando ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            {modo === 'demonstracao' && (
              <section aria-labelledby="titulo-demo" className="mt-10">
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-linha" />
                  <h2 id="titulo-demo" className="text-xs font-semibold text-apagado">
                    Demonstração: entre como
                  </h2>
                  <span className="h-px flex-1 bg-linha" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {USUARIOS_DA_DEMONSTRACAO.map((u, i) => (
                    <button
                      key={u.papel}
                      type="button"
                      disabled={enviando}
                      onClick={() => void tentar(u.email, SENHA_DA_DEMONSTRACAO)}
                      className="group flex flex-col items-start gap-3 rounded-2xl bg-creme p-3.5 text-left transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-areia/70 disabled:opacity-50"
                    >
                      <span className="flex w-full items-center justify-between">
                        <span aria-hidden className={cn('size-2.5 rounded-full', TONS_DA_DEMO[i % TONS_DA_DEMO.length])} />
                        <ChevronRight size={16} className="text-apagado group-hover:text-tinta" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-tinta">{NOME_DO_PAPEL[u.papel]}</span>
                        <span className="block text-xs leading-snug text-tinta-2">{u.descricao}</span>
                      </span>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-apagado">Empresas, pessoas e números fictícios. Não precisa de senha.</p>
              </section>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

const TONS_DA_DEMO = ['bg-salvia', 'bg-manteiga', 'bg-lavanda', 'bg-pessego']

/** Lado esquerdo: uma prévia do sistema em blocos, para quem chega entender o que tem dentro. */
function Vitrine() {
  return (
    <section
      aria-hidden
      className="relative hidden overflow-hidden rounded-caixa bg-tinta p-10 text-superficie shadow-painel lg:flex lg:flex-col lg:justify-center lg:gap-12 xl:p-14"
    >
      <div>
        <p className="text-sm font-semibold text-superficie/60">Empresa Viva</p>
        <p className="mt-3 max-w-md text-[34px] leading-[1.1] font-extrabold tracking-tight">
          O caixa e as pessoas da sua empresa, num lugar só.
        </p>
      </div>

      <div className="relative grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-2xl bg-superficie p-5 text-tinta">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-tinta-2">Saldo em caixa</p>
            <span className="rounded-full bg-bom-claro px-2.5 py-1 text-xs font-bold text-bom">+8,7%</span>
          </div>
          <p className="numero mt-2 text-[32px] font-extrabold tracking-tight">R$ 220.365,86</p>
          <div className="mt-5 flex h-28 items-end justify-between">
            {[62, 38, 37, 8, 32, 42, 58, 44, 64].map((h, i) => (
              <span key={i} className="flex h-full w-4 items-end rounded-full bg-creme">
                <span className={cn('w-full rounded-full', i === 8 ? 'bg-acento' : 'bg-tinta')} style={{ height: `${h + 25}%` }} />
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-superficie/8 p-5">
          <p className="text-[13px] font-semibold text-superficie/60">Pessoal no mês</p>
          <p className="numero mt-2 text-2xl font-extrabold tracking-tight">+28,9%</p>
          <p className="mt-1 text-xs text-superficie/60">de R$ 44,9 mil para R$ 57,9 mil</p>
        </div>
        <div className="rounded-2xl bg-superficie/8 p-5">
          <p className="text-[13px] font-semibold text-superficie/60">Perfil DISC</p>
          <div className="mt-3 flex -space-x-2">
            {[
              ['D', 'bg-pessego'],
              ['I', 'bg-manteiga'],
              ['S', 'bg-salvia'],
              ['C', 'bg-ceu'],
            ].map(([l, c]) => (
              <span key={l} className={cn('grid size-10 place-items-center rounded-full text-sm font-extrabold text-tinta ring-4 ring-tinta', c)}>
                {l}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-superficie/60">75% do time já respondeu</p>
        </div>
      </div>
    </section>
  )
}
