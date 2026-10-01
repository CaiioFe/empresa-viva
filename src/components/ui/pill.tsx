import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type TomPill = 'bom' | 'atencao' | 'ruim' | 'neutro' | 'acento'

const TONS: Record<TomPill, string> = {
  bom: 'bg-bom-claro text-bom',
  atencao: 'bg-ambar-claro text-ambar-escuro',
  ruim: 'bg-ruim-claro text-ruim',
  neutro: 'bg-creme text-tinta-2',
  acento: 'bg-acento-claro text-acento',
}

/** Etiqueta de estado em cápsula. O texto sempre diz o estado; a cor só reforça. */
export function Pill({ tom = 'neutro', children, className }: { tom?: TomPill; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'numero inline-flex items-center rounded-full px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap',
        TONS[tom],
        className,
      )}
    >
      {children}
    </span>
  )
}
