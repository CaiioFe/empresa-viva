import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useSessao } from '@/app/sessao'
import { AppShell } from '@/components/layout/app-shell'
import { PaginaEmpresas, PaginaSemAcesso } from '@/features/entrada/empresas'
import { PaginaEntrar } from '@/features/entrada/entrar'
import { podeConfigurar, podeVerCaixa, podeVerPessoas } from '@/lib/permissoes'
import type { Papel } from '@/lib/tipos'

const PaginaPainel = lazy(() => import('@/features/painel/painel').then((m) => ({ default: m.PaginaPainel })))
const PaginaCaixa = lazy(() => import('@/features/caixa/pagina-caixa').then((m) => ({ default: m.PaginaCaixa })))
const PaginaLancamentos = lazy(() =>
  import('@/features/caixa/pagina-lancamentos').then((m) => ({ default: m.PaginaLancamentos })),
)
const PaginaImportar = lazy(() => import('@/features/caixa/pagina-importar').then((m) => ({ default: m.PaginaImportar })))
const PaginaCategorias = lazy(() =>
  import('@/features/caixa/pagina-categorias').then((m) => ({ default: m.PaginaCategorias })),
)
const PaginaPessoas = lazy(() => import('@/features/pessoas/pagina-pessoas').then((m) => ({ default: m.PaginaPessoas })))
const PaginaFicha = lazy(() => import('@/features/pessoas/pagina-ficha').then((m) => ({ default: m.PaginaFicha })))
const PaginaConfiguracoes = lazy(() =>
  import('@/features/configuracoes/pagina-configuracoes').then((m) => ({ default: m.PaginaConfiguracoes })),
)
const PaginaDisc = lazy(() => import('@/features/disc/pagina-disc').then((m) => ({ default: m.PaginaDisc })))

function Carregando() {
  return <p className="p-8 text-center text-sm text-apagado">Carregando...</p>
}

/** Só passa quem entrou, está ligado a alguma empresa e já escolheu qual. */
function Protegida() {
  const { carregando, usuario, vinculos, ativo } = useSessao()
  if (carregando) return <Carregando />
  if (!usuario) return <Navigate to="/entrar" replace />
  if (vinculos.length === 0) return <PaginaSemAcesso />
  if (!ativo) return <Navigate to="/empresas" replace />
  return <Outlet />
}

/** Esconde a rota de quem não pode abrir. A trava de verdade está no banco. */
function Exige({ pode, children }: { pode: (p: Papel) => boolean; children: ReactNode }) {
  const { ativo } = useSessao()
  if (!ativo || !pode(ativo.papel)) return <Navigate to="/" replace />
  return <>{children}</>
}

function ListaDeEmpresas() {
  const { carregando, usuario, vinculos } = useSessao()
  if (carregando) return <Carregando />
  if (!usuario) return <Navigate to="/entrar" replace />
  if (vinculos.length === 0) return <PaginaSemAcesso />
  return <PaginaEmpresas />
}

export function Rotas() {
  return (
    <Suspense fallback={<Carregando />}>
      <Routes>
        <Route path="/entrar" element={<PaginaEntrar />} />
        <Route path="/disc/:token" element={<PaginaDisc />} />
        <Route path="/empresas" element={<ListaDeEmpresas />} />
        <Route element={<Protegida />}>
          <Route element={<AppShell />}>
            <Route index element={<PaginaPainel />} />
            <Route path="caixa" element={<Exige pode={podeVerCaixa}><PaginaCaixa /></Exige>} />
            <Route path="caixa/lancamentos" element={<Exige pode={podeVerCaixa}><PaginaLancamentos /></Exige>} />
            <Route path="caixa/importar" element={<Exige pode={podeVerCaixa}><PaginaImportar /></Exige>} />
            <Route path="caixa/categorias" element={<Exige pode={podeVerCaixa}><PaginaCategorias /></Exige>} />
            <Route path="pessoas" element={<Exige pode={podeVerPessoas}><PaginaPessoas /></Exige>} />
            <Route path="pessoas/:id" element={<Exige pode={podeVerPessoas}><PaginaFicha /></Exige>} />
            <Route path="configuracoes" element={<Exige pode={podeConfigurar}><PaginaConfiguracoes /></Exige>} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
