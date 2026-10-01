import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const CAMPO =
  'w-full rounded-xl border border-transparent bg-creme px-3.5 text-sm text-tinta outline-none transition-colors duration-150 placeholder:text-apagado hover:bg-areia/60 focus:border-acento focus:bg-superficie focus:ring-4 focus:ring-acento/12 disabled:text-apagado aria-invalid:border-ruim'

type Base = { rotulo: string; ajuda?: ReactNode; erro?: string }

function Moldura({ id, rotulo, ajuda, erro, children }: Base & { id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-tinta">
        {rotulo}
      </label>
      {children}
      {erro ? <p className="text-xs text-ruim">{erro}</p> : ajuda && <p className="text-xs text-apagado">{ajuda}</p>}
    </div>
  )
}

export function Campo({ rotulo, ajuda, erro, className, ...resto }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <input id={id} aria-invalid={erro ? true : undefined} className={cn(CAMPO, 'h-10 sm:h-9', className)} {...resto} />
    </Moldura>
  )
}

export function Selecao({ rotulo, ajuda, erro, className, children, ...resto }: Base & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <select id={id} className={cn(CAMPO, 'h-10 pr-9 sm:h-9', className)} {...resto}>
        {children}
      </select>
    </Moldura>
  )
}

export function AreaDeTexto({ rotulo, ajuda, erro, className, ...resto }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} ajuda={ajuda} erro={erro}>
      <textarea id={id} className={cn(CAMPO, 'min-h-24 py-2.5', className)} {...resto} />
    </Moldura>
  )
}
