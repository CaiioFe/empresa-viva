import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Tendencia = 'boa' | 'ruim' | 'neutra'
export type TomBloco = 'salvia' | 'manteiga' | 'lavanda' | 'pessego' | 'ceu'

const PONTO: Record<TomBloco, string> = {
  salvia: 'bg-salvia',
  manteiga: 'bg-manteiga',
  lavanda: 'bg-lavanda',
  pessego: 'bg-pessego',
  ceu: 'bg-ceu',
}

type Props = {
  rotulo: string
  valor: ReactNode
  /** Texto de contexto. Se começar com + ou -, vira uma etiqueta com seta. */
  detalhe?: ReactNode
  tendencia?: Tendencia
  /** O número principal: bloco escuro e, no celular, a linha inteira. */
  destaque?: boolean
  /** Cor do ponto ao lado do rótulo (a cor é detalhe, o bloco é branco). */
  tom?: TomBloco
  /** Marca para o tour guiado achar este número. */
  tour?: string
  className?: string
}

/**
 * Um número do resumo. Bloco branco com um ponto de cor; o principal vai em bloco escuro.
 * O tamanho do número acompanha a largura do bloco (container query), então nunca vaza.
 */
export function Kpi({ rotulo, valor, detalhe, tendencia = 'neutra', destaque = false, tom, tour, className }: Props) {
  const texto = typeof detalhe === 'string' ? detalhe : null
  const variacao = texto?.match(/^([+-][\d.,]+%)\s*(.*)$/)
  const Seta = variacao?.[1]?.startsWith('-') ? ArrowDownRight : ArrowUpRight

  return (
    <div
      data-kpi
      data-tour={tour}
      className={cn(
        '@container flex min-w-0 flex-col justify-between gap-2.5 rounded-caixa px-4 py-3.5 shadow-painel',
        destaque ? 'col-span-2 bg-tinta text-superficie xl:col-span-1' : 'bg-superficie text-tinta',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {!destaque && <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', PONTO[tom ?? 'salvia'])} />}
        <span className={cn('truncate text-xs font-semibold', destaque ? 'text-superficie/70' : 'text-tinta-2')}>{rotulo}</span>
      </div>
      <div className="min-w-0">
        <div
          className={cn(
            'numero leading-none font-extrabold tracking-tight whitespace-nowrap',
            destaque ? 'text-[clamp(18px,10cqw,26px)]' : 'text-[clamp(16px,9.5cqw,21px)]',
          )}
        >
          {valor}
        </div>
        {detalhe &&
          (variacao ? (
            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-bold',
                  destaque ? 'bg-superficie/12 text-superficie' : 'bg-creme text-tinta',
                  !destaque && tendencia === 'boa' && 'bg-bom-claro text-bom',
                  !destaque && tendencia === 'ruim' && 'bg-ruim-claro text-ruim',
                )}
              >
                <Seta size={12} strokeWidth={2.5} aria-hidden />
                {variacao[1]}
              </span>
              {variacao[2] && <span className={destaque ? 'text-superficie/60' : 'text-apagado'}>{variacao[2]}</span>}
            </div>
          ) : (
            <div className={cn('mt-2 text-[11px]', destaque ? 'text-superficie/60' : 'text-apagado')}>{detalhe}</div>
          ))}
      </div>
    </div>
  )
}

const ORDEM: TomBloco[] = ['salvia', 'manteiga', 'lavanda', 'pessego', 'ceu']

/** Linha de números. Dá a cada um uma cor de ponto da sequência. */
export function Resumo({ children, className }: { children: ReactNode; className?: string }) {
  let i = 0
  const blocos = Children.map(children, (filho) => {
    if (!isValidElement(filho)) return filho
    const el = filho as ReactElement<Props>
    if (el.props.destaque || el.props.tom) return el
    return cloneElement(el, { tom: ORDEM[i++ % ORDEM.length] })
  })
  return <div className={cn('grid grid-cols-2 gap-3 xl:auto-cols-fr xl:grid-flow-col xl:grid-cols-none', className)}>{blocos}</div>
}
