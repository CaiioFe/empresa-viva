import { useState, type FormEvent } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { useSessao } from '@/app/sessao'
import { Aviso, Button, CabecalhoDaPagina, Campo, Card, Pill, Selecao } from '@/components/ui'
import { Carregando, ErroAoCarregar, erroAoSalvar } from '@/features/pessoas/estados'
import { NOME_DO_PAPEL } from '@/lib/permissoes'
import type { EtapaIntegracao, Membro, Papel } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { useCriarEtapa, useEditarEtapa, useEditarMembro, useEtapas, useMembros, useReordenarEtapas } from './api'
import { moverEtapa, ordenarEtapas, proximaOrdem } from './regras'

const PAPEIS: Papel[] = ['dono', 'financeiro', 'rh', 'consultora']

export function PaginaConfiguracoes() {
  return (
    <div>
      <CabecalhoDaPagina rotulo="Configurações" titulo="Ajustes da empresa" />
      <div className="grid gap-4 lg:grid-cols-2">
        <EtapasDaIntegracao />
        <UsuariosDaEmpresa />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Etapas da integração

function EtapasDaIntegracao() {
  const consulta = useEtapas()
  const criar = useCriarEtapa()
  const editar = useEditarEtapa()
  const reordenar = useReordenarEtapas()
  const [nova, setNova] = useState('')
  const ocupado = criar.isPending || editar.isPending || reordenar.isPending
  const falha = criar.error ?? editar.error ?? reordenar.error

  const etapas = ordenarEtapas(consulta.data ?? [])

  function adicionar(ev: FormEvent) {
    ev.preventDefault()
    if (!nova.trim()) return
    criar.mutate({ nome: nova, ordem: proximaOrdem(etapas) }, { onSuccess: () => setNova('') })
  }

  function mover(id: string, direcao: -1 | 1) {
    const mudancas = moverEtapa(etapas, id, direcao)
    if (mudancas.length > 0) reordenar.mutate(mudancas)
  }

  return (
    <Card titulo="Etapas da integração">
      <p className="mb-4 text-xs leading-relaxed text-tinta-2">
        O caminho de quem acabou de entrar. Cada etapa vira uma caixinha na ficha da pessoa. Etapa desativada some da ficha, mas o
        histórico fica guardado.
      </p>

      {consulta.isPending ? (
        <Carregando texto="Carregando as etapas..." />
      ) : consulta.isError ? (
        <ErroAoCarregar onTentar={() => void consulta.refetch()} />
      ) : etapas.length === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed border-linha-2 px-3 py-4 text-center text-sm text-apagado">
          Nenhuma etapa ainda. Crie a primeira abaixo.
        </p>
      ) : (
        <ol className="mb-4 flex flex-col gap-2">
          {etapas.map((etapa, indice) => (
            <LinhaDaEtapa
              key={`${etapa.id}-${etapa.nome}`}
              etapa={etapa}
              numero={indice + 1}
              primeira={indice === 0}
              ultima={indice === etapas.length - 1}
              ocupado={ocupado}
              onRenomear={(nome) => editar.mutate({ id: etapa.id, nome })}
              onAtivar={(ativa) => editar.mutate({ id: etapa.id, ativa })}
              onMover={(direcao) => mover(etapa.id, direcao)}
            />
          ))}
        </ol>
      )}

      {falha && (
        <Aviso tom="erro" className="mb-3">
          {erroAoSalvar(falha)}
        </Aviso>
      )}

      <form onSubmit={adicionar} className="flex items-end gap-2">
        <div className="flex-1">
          <Campo rotulo="Nova etapa" value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Ex.: Treinamento de segurança" />
        </div>
        <Button type="submit" disabled={ocupado || !nova.trim()}>
          <Plus size={16} aria-hidden />
          Adicionar
        </Button>
      </form>
    </Card>
  )
}

type PropsDaEtapa = {
  etapa: EtapaIntegracao
  numero: number
  primeira: boolean
  ultima: boolean
  ocupado: boolean
  onRenomear: (nome: string) => void
  onAtivar: (ativa: boolean) => void
  onMover: (direcao: -1 | 1) => void
}

function LinhaDaEtapa({ etapa, numero, primeira, ultima, ocupado, onRenomear, onAtivar, onMover }: PropsDaEtapa) {
  const [nome, setNome] = useState(etapa.nome)
  const mudou = nome.trim() !== '' && nome.trim() !== etapa.nome

  return (
    <li className={cn('rounded-lg border border-linha p-2.5', !etapa.ativa && 'bg-fundo')}>
      <div className="flex items-end gap-2">
        <div className="flex flex-col">
          <button
            type="button"
            aria-label={`Subir ${etapa.nome}`}
            disabled={primeira || ocupado}
            onClick={() => onMover(-1)}
            className="rounded p-0.5 text-apagado hover:text-tinta disabled:opacity-30"
          >
            <ChevronUp size={16} aria-hidden />
          </button>
          <button
            type="button"
            aria-label={`Descer ${etapa.nome}`}
            disabled={ultima || ocupado}
            onClick={() => onMover(1)}
            className="rounded p-0.5 text-apagado hover:text-tinta disabled:opacity-30"
          >
            <ChevronDown size={16} aria-hidden />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <Campo rotulo={`Etapa ${numero}`} value={nome} onChange={(e) => setNome(e.target.value)} disabled={ocupado} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-7">
        {!etapa.ativa && <Pill>Desativada</Pill>}
        {mudou && (
          <Button tamanho="pequeno" disabled={ocupado} onClick={() => onRenomear(nome.trim())}>
            Salvar nome
          </Button>
        )}
        <Button variante="fantasma" tamanho="pequeno" disabled={ocupado} onClick={() => onAtivar(!etapa.ativa)}>
          {etapa.ativa ? 'Desativar' : 'Reativar'}
        </Button>
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// Usuários

function UsuariosDaEmpresa() {
  const { usuario } = useSessao()
  const consulta = useMembros()
  const editar = useEditarMembro()

  return (
    <Card titulo="Usuários da empresa">
      <p className="mb-4 text-xs leading-relaxed text-tinta-2">
        Quem entra no sistema e o que cada um pode ver. Para incluir alguém, fale com a Maestria.
      </p>

      {consulta.isPending ? (
        <Carregando texto="Carregando os usuários..." />
      ) : consulta.isError ? (
        <ErroAoCarregar onTentar={() => void consulta.refetch()} />
      ) : consulta.data.length === 0 ? (
        <p className="text-sm text-apagado">Nenhum usuário encontrado.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-linha">
          {consulta.data.map((m) => (
            <LinhaDoMembro
              key={m.id}
              membro={m}
              souEu={m.usuario_id === usuario?.id}
              ocupado={editar.isPending}
              onPapel={(papel) => editar.mutate({ id: m.id, papel })}
              onAtivo={(ativo) => editar.mutate({ id: m.id, ativo })}
            />
          ))}
        </ul>
      )}

      {editar.isError && (
        <Aviso tom="erro" className="mt-3">
          {erroAoSalvar(editar.error)}
        </Aviso>
      )}
    </Card>
  )
}

type PropsDoMembro = {
  membro: Membro
  souEu: boolean
  ocupado: boolean
  onPapel: (papel: Papel) => void
  onAtivo: (ativo: boolean) => void
}

function LinhaDoMembro({ membro, souEu, ocupado, onPapel, onAtivo }: PropsDoMembro) {
  const nome = membro.nome || 'Sem nome'
  return (
    <li className="flex flex-wrap items-end justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="font-semibold text-tinta">{nome}</p>
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          {souEu && <Pill tom="acento">Você</Pill>}
          {!membro.ativo && <Pill tom="ruim">Desativado</Pill>}
          {souEu && <Pill>{NOME_DO_PAPEL[membro.papel]}</Pill>}
        </div>
      </div>
      {!souEu && (
        <div className="flex items-end gap-2">
          <div className="w-36">
            <Selecao
              rotulo="Papel"
              value={membro.papel}
              disabled={ocupado}
              onChange={(e) => onPapel(e.target.value as Papel)}
            >
              {PAPEIS.map((p) => (
                <option key={p} value={p}>
                  {NOME_DO_PAPEL[p]}
                </option>
              ))}
            </Selecao>
          </div>
          <Button variante={membro.ativo ? 'perigo' : 'secundario'} disabled={ocupado} onClick={() => onAtivo(!membro.ativo)}>
            {membro.ativo ? 'Desativar' : 'Reativar'}
          </Button>
        </div>
      )}
    </li>
  )
}
