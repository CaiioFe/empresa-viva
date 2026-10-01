import type { ReactNode } from 'react'

/** Título da página: área em cima (pequena), título e ações à direita. */
export function CabecalhoDaPagina({ rotulo, titulo, acoes }: { rotulo?: string; titulo: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {rotulo && <div className="mb-0.5 text-xs font-semibold text-apagado">{rotulo}</div>}
        <h1 className="text-titulo font-extrabold tracking-tight text-tinta">{titulo}</h1>
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </header>
  )
}
