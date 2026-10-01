import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Tabela com rolagem lateral própria: no celular ela rola, a página não. */
export function Tabela({ className, children, ...resto }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className={cn('w-full border-collapse text-sm', className)} {...resto}>
        {children}
      </table>
    </div>
  )
}

export function Th({ className, ...resto }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('border-b border-linha px-2 pb-2 text-left text-xs font-medium whitespace-nowrap text-apagado', className)}
      {...resto}
    />
  )
}

export function Td({ className, ...resto }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-linha px-2 py-2 align-middle text-[13px]', className)} {...resto} />
}
