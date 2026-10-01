import type { LetraDisc } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { NOME_DO_FATOR, TEXTO_DO_PERFIL, type ResultadoCalculado } from './questionario'

/*
  Como o perfil DISC aparece: letra grande em serifa âmbar, nome do fator, texto do perfil
  e as quatro barras. Usado na ficha e no fim do teste público.
*/

const LETRAS: LetraDisc[] = ['D', 'I', 'S', 'C']

export function PerfilDisc({ resultado, grande = false }: { resultado: ResultadoCalculado; grande?: boolean }) {
  const letra = resultado.predominante
  return (
    <div>
      <div className={cn('flex items-center gap-3', grande && 'flex-col items-start gap-1')}>
        <span className={cn('leading-[0.85] text-ambar font-semibold tracking-tight', grande ? 'text-[120px]' : 'text-[52px]')}>{letra}</span>
        <div>
          <p className={cn('text-tinta font-semibold tracking-tight', grande ? 'text-[34px] leading-tight' : 'text-xl')}>{NOME_DO_FATOR[letra]}</p>
          {!grande && <p className="text-xs leading-relaxed text-tinta-2">{TEXTO_DO_PERFIL[letra]}</p>}
        </div>
      </div>
      {grande && <p className="mt-3 text-[15.5px] text-tinta-2">{TEXTO_DO_PERFIL[letra]}</p>}
      <BarrasDisc resultado={resultado} className={grande ? 'mt-6' : 'mt-3'} />
    </div>
  )
}

export function BarrasDisc({ resultado, className }: { resultado: ResultadoCalculado; className?: string }) {
  const valor: Record<LetraDisc, number> = { D: resultado.d, I: resultado.i, S: resultado.s, C: resultado.c }
  return (
    <div className={cn('grid gap-1.5', className)}>
      {LETRAS.map((l) => (
        <div key={l} className="grid grid-cols-[14px_1fr_34px] items-center gap-2 text-xs text-apagado font-medium">
          <span>{l}</span>
          <span
            role="meter"
            aria-label={NOME_DO_FATOR[l]}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={valor[l]}
            className="relative block h-[5px] overflow-hidden rounded-full bg-creme"
          >
            <span
              className={cn('absolute inset-y-0 left-0 rounded-full', l === resultado.predominante ? 'bg-ambar' : 'bg-acento')}
              style={{ width: `${Math.min(Math.max(valor[l], 0), 100)}%` }}
            />
          </span>
          <span className="text-right">{valor[l]}%</span>
        </div>
      ))}
    </div>
  )
}
