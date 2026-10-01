import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = Omit<HTMLAttributes<HTMLElement>, 'title'> & { titulo?: ReactNode; subtitulo?: ReactNode; acao?: ReactNode }

/** Painel branco, bem arredondado, sem borda, com sombra suave. */
export function Card({ titulo, subtitulo, acao, className, children, ...resto }: Props) {
  return (
    <section className={cn('rounded-caixa bg-superficie p-4 shadow-painel sm:p-5', className)} {...resto}>
      {(titulo || acao) && (
        <header className="mb-3 flex min-h-8 items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-[15px] font-bold tracking-tight text-tinta">{titulo}</h2>}
            {subtitulo && <p className="mt-0.5 text-xs text-apagado">{subtitulo}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  )
}
