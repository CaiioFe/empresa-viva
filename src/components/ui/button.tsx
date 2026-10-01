import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'perigo'
type Tamanho = 'normal' | 'pequeno'

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-tinta text-superficie shadow-painel hover:bg-grafite-2 active:scale-[0.98]',
  secundario: 'bg-superficie text-tinta shadow-[inset_0_0_0_1px_var(--color-linha-2)] hover:bg-creme active:scale-[0.98]',
  fantasma: 'bg-transparent text-tinta-2 hover:bg-creme hover:text-tinta',
  perigo: 'bg-superficie text-ruim shadow-[inset_0_0_0_1px_var(--color-linha-2)] hover:bg-ruim-claro',
}

const TAMANHOS: Record<Tamanho, string> = {
  normal: 'h-10 px-4 text-[13px] sm:h-9',
  pequeno: 'h-8 px-3 text-xs',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: Tamanho }

export function Button({ variante = 'primario', tamanho = 'normal', className, type = 'button', ...resto }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-[background-color,transform] duration-150 disabled:pointer-events-none disabled:opacity-50',
        VARIANTES[variante],
        TAMANHOS[tamanho],
        className,
      )}
      {...resto}
    />
  )
}
