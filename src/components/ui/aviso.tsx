import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Tom = 'info' | 'erro' | 'sucesso'
const TONS: Record<Tom, string> = {
  info: 'border-acento/25 bg-acento-claro text-acento',
  erro: 'border-ruim/30 bg-ruim-claro text-ruim',
  sucesso: 'border-bom/30 bg-bom-claro text-bom',
}

export function Aviso({ tom = 'info', children, className }: { tom?: Tom; children: ReactNode; className?: string }) {
  return (
    <div role={tom === 'erro' ? 'alert' : 'status'} className={cn('rounded-lg border px-3 py-2 text-sm', TONS[tom], className)}>
      {children}
    </div>
  )
}
