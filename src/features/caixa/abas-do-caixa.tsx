import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Aviso } from '@/components/ui'
import type { Categoria } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { GRUPOS } from './calculo'

const ABAS = [
  { rota: '/caixa', rotulo: 'Fluxo do ano' },
  { rota: '/caixa/lancamentos', rotulo: 'Lançamentos' },
  { rota: '/caixa/importar', rotulo: 'Importar' },
  { rota: '/caixa/categorias', rotulo: 'Categorias' },
] as const

/** Abas do módulo Caixa, no topo das quatro telas. No celular, rolam de lado. */
export function AbasDoCaixa() {
  return (
    <nav aria-label="Telas do caixa" className="-mx-4 mb-5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-linha">
        {ABAS.map((aba) => (
          <li key={aba.rota}>
            <NavLink
              to={aba.rota}
              end
              className={({ isActive }) =>
                cn(
                  '-mb-px inline-block border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-tinta-2 transition-colors hover:text-tinta',
                  isActive && 'border-acento text-tinta',
                )
              }
            >
              {aba.rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const LINK_DE_ACAO = {
  primario: 'bg-grafite text-white hover:bg-acento',
  secundario: 'border border-linha-2 bg-superficie text-tinta hover:border-tinta',
}

/** Link com cara de botão (mesmo desenho do Button), para levar a outra tela. */
export function LinkDeAcao({
  para,
  variante = 'primario',
  children,
}: {
  para: string
  variante?: keyof typeof LINK_DE_ACAO
  children: ReactNode
}) {
  return (
    <Link
      to={para}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold whitespace-nowrap transition-colors',
        LINK_DE_ACAO[variante],
      )}
    >
      {children}
    </Link>
  )
}

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return <p className="py-10 text-center text-sm text-apagado">{texto}</p>
}

/** Mensagem de erro de leitura, com o motivo que o banco deu. */
export function ErroAoCarregar({ erro }: { erro: unknown }) {
  const motivo = erro instanceof Error ? erro.message : ''
  return (
    <Aviso tom="erro">
      Não foi possível carregar os dados agora. Confira a internet e recarregue a página.
      {motivo && <span className="mt-1 block text-xs opacity-80">Detalhe: {motivo}</span>}
    </Aviso>
  )
}

/** Texto de erro de uma gravação, para mostrar num Aviso. */
export function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error && erro.message ? erro.message : 'Tente de novo em instantes.'
}

/** Opções de categoria agrupadas (só as ativas, mais a atual se ela estiver desativada). */
export function OpcoesDeCategoria({ categorias, incluir }: { categorias: Categoria[]; incluir?: string | null }) {
  return (
    <>
      {GRUPOS.map(({ grupo, rotulo }) => {
        const doGrupo = categorias
          .filter((c) => c.grupo === grupo && (c.ativa || c.id === incluir))
          .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
        if (doGrupo.length === 0) return null
        return (
          <optgroup key={grupo} label={rotulo}>
            {doGrupo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </optgroup>
        )
      })}
    </>
  )
}
