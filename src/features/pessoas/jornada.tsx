import { useState, type FormEvent } from 'react'
import {
  ArrowRightLeft,
  ClipboardCheck,
  Compass,
  GraduationCap,
  ListChecks,
  LogOut,
  Plus,
  StickyNote,
  TreePalm,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { AreaDeTexto, Aviso, Button, Campo, Card, Selecao } from '@/components/ui'
import { formatarDataCompleta } from '@/lib/formatos'
import type { TipoEvento } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { useJornada, useRegistrarEvento } from './api'
import { Carregando, ErroAoCarregar, erroAoSalvar } from './estados'
import { hojeNoFuso, ordenarJornada, ROTULO_DO_EVENTO, TIPOS_QUE_SE_REGISTRAM } from './regras'

/** Ícone e cor da bolinha de cada tipo de evento. Só tokens do tema. */
const VISUAL: Record<TipoEvento, { Icone: LucideIcon; bolinha: string; texto: string }> = {
  contratacao: { Icone: UserPlus, bolinha: 'border-acento bg-superficie', texto: 'text-acento' },
  integracao: { Icone: ListChecks, bolinha: 'border-bom bg-superficie', texto: 'text-bom' },
  mudanca_funcao: { Icone: ArrowRightLeft, bolinha: 'border-acento bg-acento', texto: 'text-acento' },
  treinamento: { Icone: GraduationCap, bolinha: 'border-acento bg-superficie', texto: 'text-acento' },
  avaliacao: { Icone: ClipboardCheck, bolinha: 'border-ambar bg-superficie', texto: 'text-ambar-escuro' },
  ferias: { Icone: TreePalm, bolinha: 'border-linha-2 bg-superficie', texto: 'text-tinta-2' },
  desligamento: { Icone: LogOut, bolinha: 'border-ruim bg-ruim', texto: 'text-ruim' },
  disc: { Icone: Compass, bolinha: 'border-ambar bg-ambar', texto: 'text-ambar-escuro' },
  anotacao: { Icone: StickyNote, bolinha: 'border-linha-2 bg-superficie', texto: 'text-apagado' },
}

export function CartaoJornada({ colaboradorId, podeRegistrar }: { colaboradorId: string; podeRegistrar: boolean }) {
  const consulta = useJornada(colaboradorId)
  const [registrando, setRegistrando] = useState(false)

  const acao = podeRegistrar && !registrando && (
    <Button variante="secundario" tamanho="pequeno" onClick={() => setRegistrando(true)}>
      <Plus size={14} aria-hidden />
      Registrar na jornada
    </Button>
  )

  return (
    <Card titulo="Jornada na empresa" acao={acao || undefined}>
      {registrando && <FormularioDeEvento colaboradorId={colaboradorId} onFechar={() => setRegistrando(false)} />}

      {consulta.isPending ? (
        <Carregando texto="Carregando a jornada..." />
      ) : consulta.isError ? (
        <ErroAoCarregar onTentar={() => void consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <p className="py-4 text-sm text-apagado">Nada registrado ainda.</p>
      ) : (
        <ol aria-label="Jornada" className="relative ml-1 pl-5 before:absolute before:top-1.5 before:bottom-1.5 before:left-[4px] before:w-px before:bg-linha">
          {ordenarJornada(consulta.data).map((ev) => {
            const { Icone, bolinha, texto } = VISUAL[ev.tipo]
            return (
              <li key={ev.id} className="relative pb-3.5 last:pb-0">
                <span aria-hidden className={cn('absolute top-[5px] -left-5 h-[9px] w-[9px] rounded-full border-2', bolinha)} />
                <span className="flex flex-wrap items-center gap-x-2 text-xs text-apagado font-medium">
                  <span>{formatarDataCompleta(ev.data)}</span>
                  <span className={cn('inline-flex items-center gap-1', texto)}>
                    <Icone size={11} aria-hidden />
                    {ROTULO_DO_EVENTO[ev.tipo]}
                  </span>
                </span>
                {ev.texto && <p className="text-[13px] leading-snug text-tinta-2">{ev.texto}</p>}
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

function FormularioDeEvento({ colaboradorId, onFechar }: { colaboradorId: string; onFechar: () => void }) {
  const registrar = useRegistrarEvento()
  const [tipo, setTipo] = useState<TipoEvento>('anotacao')
  const [data, setData] = useState(hojeNoFuso())
  const [texto, setTexto] = useState('')
  const [faltaTexto, setFaltaTexto] = useState(false)

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    if (!texto.trim()) {
      setFaltaTexto(true)
      return
    }
    registrar.mutate({ colaboradorId, tipo, data, texto }, { onSuccess: onFechar })
  }

  return (
    <form onSubmit={enviar} noValidate className="mb-5 grid gap-3 rounded-lg border border-linha bg-fundo p-3 sm:grid-cols-2">
      <Selecao rotulo="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoEvento)}>
        {TIPOS_QUE_SE_REGISTRAM.map((t) => (
          <option key={t} value={t}>
            {ROTULO_DO_EVENTO[t]}
          </option>
        ))}
      </Selecao>
      <Campo rotulo="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
      <div className="sm:col-span-2">
        <AreaDeTexto
          rotulo="O que aconteceu"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value)
            setFaltaTexto(false)
          }}
          erro={faltaTexto ? 'Escreva o que aconteceu.' : undefined}
          placeholder="Ex.: concluiu o treinamento de atendimento"
        />
      </div>
      {registrar.isError && (
        <Aviso tom="erro" className="sm:col-span-2">
          {erroAoSalvar(registrar.error)}
        </Aviso>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" tamanho="pequeno" disabled={registrar.isPending || !data}>
          {registrar.isPending ? 'Salvando...' : 'Registrar'}
        </Button>
        <Button variante="fantasma" tamanho="pequeno" onClick={onFechar} disabled={registrar.isPending}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
