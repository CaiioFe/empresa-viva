import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Mail, Pencil, Phone, UserMinus } from 'lucide-react'
import { useEmpresaAtiva } from '@/app/sessao'
import { AreaDeTexto, Aviso, Button, CabecalhoDaPagina, Campo, Card, Pill, Vazio } from '@/components/ui'
import { CartaoDisc } from '@/features/disc/cartao-disc'
import { formatarDataCompleta } from '@/lib/formatos'
import { podeEditarPessoas, podeRegistrarNaJornada } from '@/lib/permissoes'
import type { Colaborador } from '@/lib/tipos'
import { useColaborador, useDesligarColaborador, useEditarColaborador, usePessoas } from './api'
import { Avatar, Carregando, ErroAoCarregar, erroAoSalvar } from './estados'
import { FormularioColaborador } from './formulario-colaborador'
import { CartaoIntegracao } from './integracao'
import { CartaoJornada } from './jornada'
import { hojeNoFuso, iniciais, setoresDaLista } from './regras'

function Voltar() {
  return (
    <Link to="/pessoas" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-tinta-2 hover:text-tinta">
      <ArrowLeft size={15} aria-hidden />
      Pessoas
    </Link>
  )
}

export function PaginaFicha() {
  const { id = '' } = useParams()
  const consulta = useColaborador(id)

  if (consulta.isPending) return <Carregando texto="Carregando a ficha..." />
  if (consulta.isError) {
    return (
      <div>
        <Voltar />
        <ErroAoCarregar onTentar={() => void consulta.refetch()} />
      </div>
    )
  }
  if (!consulta.data) {
    return (
      <div>
        <Voltar />
        <Vazio titulo="Colaborador não encontrado" texto="Pode ter sido apagado ou ser de outra empresa. Volte para a lista e tente de novo." />
      </div>
    )
  }
  return <Ficha colaborador={consulta.data} />
}

type Modo = 'vendo' | 'editando' | 'desligando'

function Ficha({ colaborador }: { colaborador: Colaborador }) {
  const { papel } = useEmpresaAtiva()
  const [modo, setModo] = useState<Modo>('vendo')
  const podeEditar = podeEditarPessoas(papel)
  const desligado = colaborador.situacao === 'desligado'

  const acoes = podeEditar && modo === 'vendo' && (
    <>
      <Button variante="secundario" tamanho="pequeno" onClick={() => setModo('editando')}>
        <Pencil size={14} aria-hidden />
        Editar dados
      </Button>
      {!desligado && (
        <Button variante="perigo" tamanho="pequeno" onClick={() => setModo('desligando')}>
          <UserMinus size={14} aria-hidden />
          Desligar
        </Button>
      )}
    </>
  )

  return (
    <div>
      <Voltar />
      <CabecalhoDaPagina
        rotulo={colaborador.setor || 'Colaborador'}
        titulo={
          <span className="flex items-center gap-3">
            <Avatar iniciais={iniciais(colaborador.nome)} grande />
            {colaborador.nome}
          </span>
        }
        acoes={acoes || undefined}
      />

      <div className="-mt-2 mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-tinta-2">
        {colaborador.funcao && <span className="font-semibold text-tinta">{colaborador.funcao}</span>}
        {colaborador.setor && <span>{colaborador.setor}</span>}
        <span>Entrada em {formatarDataCompleta(colaborador.data_entrada)}</span>
        {colaborador.telefone && (
          <span className="inline-flex items-center gap-1">
            <Phone size={13} aria-hidden />
            {colaborador.telefone}
          </span>
        )}
        {colaborador.email && (
          <span className="inline-flex items-center gap-1 break-all">
            <Mail size={13} aria-hidden />
            {colaborador.email}
          </span>
        )}
        {desligado && (
          <Pill tom="ruim">
            Desligado{colaborador.data_saida ? ` em ${formatarDataCompleta(colaborador.data_saida)}` : ''}
          </Pill>
        )}
      </div>

      {modo === 'editando' && <EditarDados colaborador={colaborador} onFechar={() => setModo('vendo')} />}
      {modo === 'desligando' && <Desligar colaborador={colaborador} onFechar={() => setModo('vendo')} />}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <CartaoJornada colaboradorId={colaborador.id} podeRegistrar={podeRegistrarNaJornada(papel)} />
        <div className="flex flex-col gap-4">
          <CartaoIntegracao colaboradorId={colaborador.id} podeMarcar={podeEditar && colaborador.situacao === 'ativo'} />
          <CartaoDisc colaborador={colaborador} podeEnviar={podeEditar} />
        </div>
      </div>
    </div>
  )
}

function EditarDados({ colaborador, onFechar }: { colaborador: Colaborador; onFechar: () => void }) {
  const editar = useEditarColaborador()
  const lista = usePessoas()
  const setores = setoresDaLista(lista.data?.pessoas ?? [])
  return (
    <Card titulo="Editar dados" className="mb-5">
      <FormularioColaborador
        inicial={colaborador}
        setores={setores}
        textoDoBotao="Salvar"
        salvando={editar.isPending}
        erro={editar.isError ? erroAoSalvar(editar.error) : null}
        onCancelar={onFechar}
        onSalvar={(dados) => editar.mutate({ id: colaborador.id, dados }, { onSuccess: onFechar })}
      />
    </Card>
  )
}

function Desligar({ colaborador, onFechar }: { colaborador: Colaborador; onFechar: () => void }) {
  const desligar = useDesligarColaborador()
  const [dataSaida, setDataSaida] = useState(hojeNoFuso())
  const [texto, setTexto] = useState('')

  function enviar(ev: FormEvent) {
    ev.preventDefault()
    desligar.mutate({ id: colaborador.id, dataSaida, texto }, { onSuccess: onFechar })
  }

  return (
    <Card titulo="Desligar colaborador" className="mb-5 border-ruim/30">
      <form onSubmit={enviar} noValidate className="grid gap-3 sm:grid-cols-2">
        <p className="text-sm text-tinta-2 sm:col-span-2">
          {colaborador.nome} sai da lista de ativos e o desligamento entra na jornada. O histórico continua guardado.
        </p>
        <Campo rotulo="Data de saída" type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} required />
        <div className="sm:col-span-2">
          <AreaDeTexto
            rotulo="Motivo ou observação"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ex.: pediu demissão para mudar de cidade"
          />
        </div>
        {desligar.isError && (
          <Aviso tom="erro" className="sm:col-span-2">
            {erroAoSalvar(desligar.error)}
          </Aviso>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" variante="perigo" disabled={desligar.isPending || !dataSaida}>
            {desligar.isPending ? 'Salvando...' : 'Confirmar desligamento'}
          </Button>
          <Button variante="fantasma" onClick={onFechar} disabled={desligar.isPending}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
