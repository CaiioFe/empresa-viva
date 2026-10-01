import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronsUpDown, Compass, LayoutDashboard, LogOut, Settings, Users, Wallet } from 'lucide-react'
import { useSessao } from '@/app/sessao'
import { useModo } from '@/features/ambiente/faixa'
import { passosDoPapel } from '@/features/tour/passos'
import { marcarTourVisto, Tour, tourJaVisto } from '@/features/tour/tour'
import { itensDoMenu, NOME_DO_PAPEL, type ItemDoMenu } from '@/lib/permissoes'
import { cn } from '@/lib/utils'

const ICONES: Record<ItemDoMenu['icone'], typeof Wallet> = {
  painel: LayoutDashboard,
  caixa: Wallet,
  pessoas: Users,
  config: Settings,
}

const TONS_DE_AVATAR = ['bg-salvia text-salvia-escuro', 'bg-manteiga text-manteiga-escuro', 'bg-lavanda text-lavanda-escuro', 'bg-pessego text-pessego-escuro', 'bg-ceu text-ceu-escuro']

/** Cor pastel estável para um nome (a mesma pessoa ou empresa sempre com a mesma cor). */
export function tomDoNome(nome: string): string {
  let soma = 0
  for (const letra of nome) soma = (soma * 31 + letra.charCodeAt(0)) % 997
  return TONS_DE_AVATAR[soma % TONS_DE_AVATAR.length] ?? TONS_DE_AVATAR[0]!
}

export function iniciaisDe(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Marca: símbolo âmbar arredondado e o nome. */
export function Marca({ className, claro = false }: { className?: string; claro?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-[15px] font-extrabold tracking-tight', claro ? 'text-superficie' : 'text-tinta', className)}>
      <span aria-hidden className="grid size-7 place-items-center rounded-[9px] bg-ambar">
        <span className="size-2.5 rounded-full bg-tinta" />
      </span>
      Empresa Viva
    </span>
  )
}

/** Casca do app: menu branco flutuando sobre o fundo bege no computador, barra de baixo no celular. */
export function AppShell() {
  const { ativo, vinculos, usuario, sair } = useSessao()
  const modo = useModo()
  const local = useLocation()
  const [tourAberto, setTourAberto] = useState(false)
  const idDoUsuario = usuario?.id ?? ''

  useEffect(() => {
    if (!idDoUsuario || local.pathname !== '/' || tourJaVisto(idDoUsuario)) return
    const t = setTimeout(() => setTourAberto(true), 1200)
    return () => clearTimeout(t)
    // só na chegada: depois disso o tour abre pelo botão
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDoUsuario])

  const fecharTour = () => {
    setTourAberto(false)
    if (idDoUsuario) marcarTourVisto(idDoUsuario)
  }

  if (!ativo) return null
  const itens = itensDoMenu(ativo.papel)
  const variasEmpresas = vinculos.length > 1
  const nomeEmpresa = ativo.empresa.nome

  const empresa = (
    <>
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold', tomDoNome(iniciaisDe(nomeEmpresa)))}>
        {iniciaisDe(nomeEmpresa)}
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-[13px] font-bold text-tinta">{nomeEmpresa}</span>
        <span className="block truncate text-xs text-apagado">{NOME_DO_PAPEL[ativo.papel]}</span>
      </span>
    </>
  )

  return (
    <div className="min-h-svh md:grid md:grid-cols-[232px_1fr]">
      <div className="hidden md:block md:p-3 md:pr-0">
        <aside className="sticky top-3 flex h-[calc(100svh-1.5rem)] flex-col rounded-caixa bg-lateral p-4 shadow-painel">
          <div className="px-1 pt-1">
            <Marca />
          </div>

          <div className="mt-5 rounded-2xl bg-creme p-2">
            {variasEmpresas ? (
              <Link to="/empresas" className="flex items-center gap-3 rounded-xl" title="Trocar de empresa">
                {empresa}
                <ChevronsUpDown size={16} className="ml-auto shrink-0 text-apagado" aria-hidden />
              </Link>
            ) : (
              <div className="flex items-center gap-3">{empresa}</div>
            )}
          </div>

          <p className="mt-5 px-3 text-[11px] font-semibold text-apagado">Menu</p>
          <nav aria-label="Menu principal" className="mt-2 flex flex-col gap-1">
            {itens.map((item) => {
              const Icone = ICONES[item.icone]
              return (
                <NavLink
                  key={item.rota}
                  to={item.rota}
                  end={item.rota === '/'}
                  data-tour={`menu-${item.icone}`}
                  className={({ isActive }) =>
                    cn(
                      'flex h-9 items-center gap-2.5 rounded-full px-3.5 text-[13px] font-semibold text-tinta-2 transition-colors duration-150 hover:bg-creme hover:text-tinta',
                      isActive && 'bg-tinta text-superficie hover:bg-tinta hover:text-superficie',
                    )
                  }
                >
                  <Icone size={16} strokeWidth={2} aria-hidden />
                  {item.rotulo}
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3">
            {modo === 'demonstracao' && (
              <div className="rounded-2xl bg-creme p-3">
                <p className="flex items-center gap-2 text-[13px] font-bold text-tinta">
                  <span aria-hidden className="size-2 rounded-full bg-ambar" />
                  Modo demonstração
                </p>
                <p className="mt-1 text-xs leading-relaxed text-tinta-2">Empresas, pessoas e números fictícios.</p>
              </div>
            )}
            <div className="flex items-center gap-2.5 px-1">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tinta text-xs font-bold text-superficie">
                {iniciaisDe(usuario?.email ?? '?')}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs text-tinta-2" title={usuario?.email ?? ''}>
                {usuario?.email}
              </p>
              <button
                type="button"
                onClick={() => void sair()}
                aria-label="Sair"
                title="Sair"
                className="grid size-9 shrink-0 place-items-center rounded-full text-tinta-2 transition-colors hover:bg-creme hover:text-tinta"
              >
                <LogOut size={17} aria-hidden />
              </button>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex min-w-0 flex-col pb-24 md:pb-0">
        <header className="flex items-center gap-3 px-4 pt-4 md:hidden">
          <Marca />
          <span className="ml-auto" />
          <button
            type="button"
            onClick={() => setTourAberto(true)}
            data-tour="botao-tour"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-superficie px-3 text-xs font-semibold text-tinta shadow-painel transition-colors hover:bg-creme"
          >
            <Compass size={14} aria-hidden />
            Tour guiado
          </button>
          <button
            type="button"
            onClick={() => void sair()}
            aria-label="Sair"
            className="grid size-10 place-items-center rounded-full bg-superficie text-tinta-2 shadow-painel"
          >
            <LogOut size={17} aria-hidden />
          </button>
        </header>
        <div className="mx-4 mt-4 flex items-center gap-3 rounded-caixa bg-superficie p-3 shadow-painel md:hidden">
          {variasEmpresas ? (
            <Link to="/empresas" className="flex flex-1 items-center gap-3">
              {empresa}
              <ChevronsUpDown size={16} className="ml-auto text-apagado" aria-hidden />
            </Link>
          ) : (
            empresa
          )}
        </div>
        {modo === 'demonstracao' && (
          <p className="mx-4 mt-2 text-xs font-medium text-apagado md:hidden">Modo demonstração: dados fictícios</p>
        )}

        <div className="mx-auto hidden w-full max-w-[1360px] justify-end px-6 pt-4 md:flex">
          <button
            type="button"
            onClick={() => setTourAberto(true)}
            data-tour="botao-tour"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-superficie px-3 text-xs font-semibold text-tinta shadow-painel transition-colors hover:bg-creme"
          >
            <Compass size={14} aria-hidden />
            Tour guiado
          </button>
        </div>
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-5 sm:px-6 md:pt-1">
          <Outlet />
        </main>
      </div>

      {tourAberto && <Tour passos={passosDoPapel(ativo.papel)} aoFechar={fecharTour} />}

      <nav
        aria-label="Menu do celular"
        className="fixed inset-x-3 bottom-3 z-20 flex gap-1 rounded-full bg-tinta p-1.5 shadow-flutua md:hidden"
      >
        {itens.map((item) => {
          const Icone = ICONES[item.icone]
          return (
            <NavLink
              key={item.rota}
              to={item.rota}
              end={item.rota === '/'}
              aria-label={item.rotulo}
              data-tour={`menu-${item.icone}`}
              className={({ isActive }) =>
                cn(
                  'flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-xs font-semibold text-superficie/65 transition-colors',
                  isActive && 'bg-superficie text-tinta',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icone size={19} strokeWidth={2} aria-hidden />
                  {isActive && <span>{item.rotulo}</span>}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
