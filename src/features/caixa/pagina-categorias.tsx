import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useEmpresaAtiva } from '@/app/sessao'
import { Aviso, Button, CabecalhoDaPagina, Campo, Card, Pill, Selecao, Vazio } from '@/components/ui'
import { podeEditarCaixa } from '@/lib/permissoes'
import type { Categoria, GrupoCategoria, RegraClassificacao } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { AbasDoCaixa, Carregando, ErroAoCarregar, mensagemDeErro, OpcoesDeCategoria } from './abas-do-caixa'
import { categoriasDoGrupo, mover, pendentesQueBatem, proximaOrdem } from './apoio'
import {
  useCategorias,
  useCriarCategoria,
  useCriarRegra,
  useEditarCategoria,
  useExcluirRegra,
  useLancamentosSemCategoria,
  useRegras,
  useReordenarCategorias,
} from './api'
import { GRUPOS } from './calculo'

/*
  /caixa/categorias (TASK-101): plano de contas por grupo e regras de classificação.
  Dono e financeiro mudam; a consultora vê tudo sem os botões.
*/

type Recado = { tom: 'sucesso' | 'erro'; texto: string } | null

export function PaginaCategorias() {
  const { papel } = useEmpresaAtiva()
  const podeEditar = podeEditarCaixa(papel)
  const categorias = useCategorias()
  const regras = useRegras()

  const erro = categorias.error ?? regras.error
  return (
    <div>
      <CabecalhoDaPagina rotulo="Caixa" titulo="Categorias e regras" />
      <AbasDoCaixa />
      {erro ? (
        <ErroAoCarregar erro={erro} />
      ) : !categorias.data || !regras.data ? (
        <Carregando />
      ) : (
        <div className="flex flex-col gap-4">
          {!podeEditar && <Aviso>Você está vendo o plano de contas da empresa. Só o dono e o financeiro podem mudar.</Aviso>}
          <div className="grid gap-4 lg:grid-cols-2">
            {GRUPOS.map(({ grupo, rotulo }) => (
              <GrupoDeCategorias key={grupo} grupo={grupo} rotulo={rotulo} categorias={categorias.data} podeEditar={podeEditar} />
            ))}
          </div>
          <Regras regras={regras.data} categorias={categorias.data} podeEditar={podeEditar} />
        </div>
      )}
    </div>
  )
}

function GrupoDeCategorias({
  grupo,
  rotulo,
  categorias,
  podeEditar,
}: {
  grupo: GrupoCategoria
  rotulo: string
  categorias: Categoria[]
  podeEditar: boolean
}) {
  const criar = useCriarCategoria()
  const reordenar = useReordenarCategorias()
  const [nome, setNome] = useState('')
  const [recado, setRecado] = useState<Recado>(null)
  const lista = categoriasDoGrupo(categorias, grupo)

  const aoCriar = async (e: FormEvent) => {
    e.preventDefault()
    const limpo = nome.trim()
    if (!limpo) return
    if (lista.some((c) => c.nome.toLowerCase() === limpo.toLowerCase())) {
      setRecado({ tom: 'erro', texto: `Já existe "${limpo}" neste grupo.` })
      return
    }
    try {
      await criar.mutateAsync({ nome: limpo, grupo, ordem: proximaOrdem(categorias, grupo) })
      setNome('')
      setRecado(null)
    } catch (falha) {
      setRecado({ tom: 'erro', texto: `Não foi possível criar. ${mensagemDeErro(falha)}` })
    }
  }

  const aoMover = async (id: string, direcao: 'subir' | 'descer') => {
    const mudancas = mover(categorias, id, direcao)
    if (mudancas.length === 0) return
    try {
      await reordenar.mutateAsync(mudancas)
    } catch (falha) {
      setRecado({ tom: 'erro', texto: `Não foi possível mudar a ordem. ${mensagemDeErro(falha)}` })
    }
  }

  return (
    <Card titulo={rotulo} aria-label={rotulo}>
      {lista.length === 0 ? (
        <p className="text-sm text-apagado">Nenhuma categoria neste grupo.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {lista.map((c, i) => (
            <LinhaDaCategoria
              key={c.id}
              categoria={c}
              primeira={i === 0}
              ultima={i === lista.length - 1}
              podeEditar={podeEditar}
              ocupado={reordenar.isPending}
              aoMover={(d) => void aoMover(c.id, d)}
              aoFalhar={setRecado}
            />
          ))}
        </ul>
      )}
      {recado && (
        <Aviso tom={recado.tom} className="mt-3">
          {recado.texto}
        </Aviso>
      )}
      {podeEditar && (
        <form onSubmit={aoCriar} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Campo rotulo={`Nova categoria em ${rotulo.toLowerCase()}`} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <Button type="submit" variante="secundario" disabled={criar.isPending || nome.trim() === ''}>
            Criar
          </Button>
        </form>
      )}
    </Card>
  )
}

function LinhaDaCategoria({
  categoria: c,
  primeira,
  ultima,
  podeEditar,
  ocupado,
  aoMover,
  aoFalhar,
}: {
  categoria: Categoria
  primeira: boolean
  ultima: boolean
  podeEditar: boolean
  ocupado: boolean
  aoMover: (d: 'subir' | 'descer') => void
  aoFalhar: (r: Recado) => void
}) {
  const editar = useEditarCategoria()
  const [renomeando, setRenomeando] = useState(false)
  const [nome, setNome] = useState(c.nome)

  const salvarNome = async (e: FormEvent) => {
    e.preventDefault()
    const limpo = nome.trim()
    if (!limpo || limpo === c.nome) return setRenomeando(false)
    try {
      await editar.mutateAsync({ id: c.id, nome: limpo })
      setRenomeando(false)
    } catch (falha) {
      aoFalhar({ tom: 'erro', texto: `Não foi possível renomear. ${mensagemDeErro(falha)}` })
    }
  }

  const alternar = async () => {
    try {
      await editar.mutateAsync({ id: c.id, ativa: !c.ativa })
    } catch (falha) {
      aoFalhar({ tom: 'erro', texto: `Não foi possível ${c.ativa ? 'desativar' : 'ativar'}. ${mensagemDeErro(falha)}` })
    }
  }

  if (renomeando) {
    return (
      <li className="py-2">
        <form onSubmit={salvarNome} className="flex items-end gap-2">
          <div className="flex-1">
            <Campo rotulo={`Novo nome de ${c.nome}`} value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
          <Button type="submit" tamanho="pequeno" disabled={editar.isPending}>
            Salvar
          </Button>
          <Button
            variante="fantasma"
            tamanho="pequeno"
            onClick={() => {
              setNome(c.nome)
              setRenomeando(false)
            }}
          >
            Cancelar
          </Button>
        </form>
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <span className={cn('min-w-0 flex-1 text-sm', c.ativa ? 'text-tinta' : 'text-apagado line-through')}>{c.nome}</span>
      {!c.ativa && <Pill>Desativada</Pill>}
      {podeEditar && (
        <span className="flex items-center gap-1">
          <Button variante="fantasma" tamanho="pequeno" aria-label={`Subir ${c.nome}`} disabled={primeira || ocupado} onClick={() => aoMover('subir')}>
            <ArrowUp size={14} aria-hidden />
          </Button>
          <Button variante="fantasma" tamanho="pequeno" aria-label={`Descer ${c.nome}`} disabled={ultima || ocupado} onClick={() => aoMover('descer')}>
            <ArrowDown size={14} aria-hidden />
          </Button>
          <Button variante="fantasma" tamanho="pequeno" onClick={() => setRenomeando(true)}>
            Renomear
          </Button>
          <Button variante="fantasma" tamanho="pequeno" onClick={() => void alternar()} disabled={editar.isPending}>
            {c.ativa ? 'Desativar' : 'Ativar'}
          </Button>
        </span>
      )}
    </li>
  )
}

function Regras({ regras, categorias, podeEditar }: { regras: RegraClassificacao[]; categorias: Categoria[]; podeEditar: boolean }) {
  const excluir = useExcluirRegra()
  const [recado, setRecado] = useState<Recado>(null)
  const nomeDe = new Map(categorias.map((c) => [c.id, c.nome]))
  const ordenadas = regras.slice().sort((a, b) => a.contem.localeCompare(b.contem, 'pt-BR'))

  const aoExcluir = async (r: RegraClassificacao) => {
    if (!window.confirm(`Excluir a regra "${r.contem}"? Os lançamentos já classificados continuam como estão.`)) return
    try {
      await excluir.mutateAsync(r.id)
      setRecado({ tom: 'sucesso', texto: 'Regra excluída.' })
    } catch (falha) {
      setRecado({ tom: 'erro', texto: `Não foi possível excluir. ${mensagemDeErro(falha)}` })
    }
  }

  return (
    <Card titulo="Regras de classificação">
      <p className="mb-3 text-sm text-tinta-2">
        Cada regra diz: se a descrição do lançamento contém um trecho, ele vai para uma categoria. Vale na importação e na hora
        em que a regra é criada. Maiúscula e acento não fazem diferença; se duas regras batem, vale o trecho mais longo.
      </p>
      {podeEditar && <NovaRegra categorias={categorias} aoConcluir={setRecado} />}
      {recado && (
        <Aviso tom={recado.tom} className="mb-3">
          {recado.texto}
        </Aviso>
      )}
      {ordenadas.length === 0 ? (
        <Vazio
          titulo="Nenhuma regra ainda"
          texto={
            podeEditar
              ? 'Crie a primeira acima, ou use o botão "Virar regra" na fila sem categoria em Lançamentos.'
              : 'Quando o financeiro criar regras, elas aparecem aqui.'
          }
        />
      ) : (
        <ul className="divide-y divide-linha" aria-label="Regras">
          {ordenadas.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 text-tinta-2">
                Se a descrição contém <strong className="text-tinta">&ldquo;{r.contem}&rdquo;</strong> vai para{' '}
                <strong className="text-tinta">{nomeDe.get(r.categoria_id) ?? 'categoria apagada'}</strong>
              </span>
              {podeEditar && (
                <Button variante="perigo" tamanho="pequeno" onClick={() => void aoExcluir(r)} disabled={excluir.isPending}>
                  Excluir
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function NovaRegra({ categorias, aoConcluir }: { categorias: Categoria[]; aoConcluir: (r: Recado) => void }) {
  const criar = useCriarRegra()
  const pendentes = useLancamentosSemCategoria()
  const [contem, setContem] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const batem = contem.trim() && pendentes.data ? pendentesQueBatem(pendentes.data, contem).length : null

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (contem.trim() === '') return setErro('Escreva o trecho da descrição.')
    if (!categoriaId) return setErro('Escolha a categoria.')
    setErro(null)
    try {
      const { classificados } = await criar.mutateAsync({ contem: contem.trim(), categoria_id: categoriaId })
      setContem('')
      setCategoriaId('')
      aoConcluir({
        tom: 'sucesso',
        texto: `Regra criada. ${
          classificados === 0
            ? 'Nenhum lançamento sem categoria batia com ela agora.'
            : `${classificados === 1 ? '1 lançamento sem categoria foi classificado' : `${classificados} lançamentos sem categoria foram classificados`} na hora.`
        }`,
      })
    } catch (falha) {
      setErro(`Não foi possível criar a regra. ${mensagemDeErro(falha)}`)
    }
  }

  return (
    <form onSubmit={enviar} className="mb-4 rounded-lg border border-linha bg-creme p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Campo rotulo="Se a descrição contém" value={contem} onChange={(e) => setContem(e.target.value)} placeholder="Ex.: energia" />
        </div>
        <div className="sm:w-60">
          <Selecao rotulo="Vai para" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Escolher categoria...</option>
            <OpcoesDeCategoria categorias={categorias} />
          </Selecao>
        </div>
        <Button type="submit" disabled={criar.isPending}>
          {criar.isPending ? 'Salvando...' : 'Criar regra'}
        </Button>
      </div>
      {batem !== null && (
        <p className="mt-2 text-xs text-tinta-2" aria-live="polite">
          {batem === 0
            ? 'Nenhum lançamento sem categoria tem esse trecho agora.'
            : `Esta regra classificaria agora ${batem === 1 ? '1 lançamento' : `${batem} lançamentos`} sem categoria.`}
        </p>
      )}
      {erro && <p className="mt-2 text-xs text-ruim">{erro}</p>}
    </form>
  )
}
