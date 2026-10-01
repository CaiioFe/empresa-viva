import { Aviso, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import { tomDoNome } from '@/components/layout/app-shell'

/*
  Pedaços de tela repetidos no módulo Pessoas (e usados também em Configurações e no DISC):
  carregando, erro de leitura, avatar de iniciais e o quadradinho da letra DISC.
*/

export function Carregando({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <p role="status" className="py-8 text-center text-sm text-apagado">
      {texto}
    </p>
  )
}

export function ErroAoCarregar({ texto, onTentar }: { texto?: string; onTentar?: () => void }) {
  return (
    <Aviso tom="erro" className="flex flex-wrap items-center justify-between gap-2">
      <span>{texto ?? 'Não foi possível carregar agora. Confira a internet e tente de novo.'}</span>
      {onTentar && (
        <Button variante="secundario" tamanho="pequeno" onClick={onTentar}>
          Tentar de novo
        </Button>
      )}
    </Aviso>
  )
}

/** Frase para mostrar quando uma gravação falha. O detalhe técnico fica no console, não na tela. */
export function erroAoSalvar(erro: unknown): string {
  if (erro) console.error(erro)
  return 'Não foi possível salvar. Confira a internet e tente de novo.'
}

export function Avatar({ iniciais, grande = false }: { iniciais: string; grande?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-extrabold',
        tomDoNome(iniciais),
        grande ? 'h-14 w-14 text-base' : 'h-9 w-9 text-xs',
      )}
    >
      {iniciais}
    </span>
  )
}

const TOM_DO_DISC: Record<string, string> = {
  D: 'bg-pessego text-pessego-escuro',
  I: 'bg-manteiga text-manteiga-escuro',
  S: 'bg-salvia text-salvia-escuro',
  C: 'bg-ceu text-ceu-escuro',
}

/** Letra do DISC numa bolinha com a cor do perfil; sem DISC, um "?" tracejado. */
export function QuadradoDisc({ letra }: { letra: string | null }) {
  if (!letra) {
    return (
      <span
        title="Ainda sem DISC"
        aria-label="Sem DISC"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-linha-2 text-xs font-bold text-apagado"
      >
        ?
      </span>
    )
  }
  return (
    <span
      aria-label={`DISC ${letra}`}
      className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold', TOM_DO_DISC[letra] ?? 'bg-creme text-tinta')}
    >
      {letra}
    </span>
  )
}
