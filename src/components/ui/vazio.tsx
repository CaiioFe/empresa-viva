import type { ReactNode } from 'react'

/** Estado vazio: diz o que falta e oferece o próximo passo. */
export function Vazio({ titulo, texto, acao }: { titulo: string; texto?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-caixa bg-superficie px-6 py-12 text-center shadow-painel">
      <p className="text-secao font-bold text-tinta">{titulo}</p>
      {texto && <p className="max-w-md text-sm text-tinta-2">{texto}</p>}
      {acao && <div className="mt-3">{acao}</div>}
    </div>
  )
}
