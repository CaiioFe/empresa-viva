import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useEmpresaAtiva } from '@/app/sessao'
import { Aviso, Button, CabecalhoDaPagina, Campo, Card, Pill, Selecao, Tabela, Td, Th, Vazio } from '@/components/ui'
import { formatarDataCompleta, formatarDinheiro } from '@/lib/formatos'
import { podeEditarCaixa } from '@/lib/permissoes'
import type { Carga, Categoria, Lancamento } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { AbasDoCaixa, Carregando, ErroAoCarregar, LinkDeAcao, mensagemDeErro, OpcoesDeCategoria } from './abas-do-caixa'
import { anoPadrao, anosDoSeletor, filtrarLancamentos, MESES, mesPadrao, SEM_CATEGORIA, TODAS, valorComSinal } from './apoio'
import {
  useCargas,
  useCategorias,
  useClassificarLancamento,
  useCriarLancamento,
  useCriarRegra,
  useDesfazerCarga,
  useExcluirLancamento,
  useExtremosDasDatas,
  useLancamentosDoAno,
} from './api'
import { lerValor } from './planilha'

/*
  /caixa/lancamentos (TASK-103): lista do mês com filtros, fila "sem categoria" com classificação
  na hora e opção de virar regra, lançamento manual e desfazer uma importação inteira.
*/

const TODOS_OS_MESES = 'todos'

export function PaginaLancamentos() {
  const { papel, empresa } = useEmpresaAtiva()
  const podeEditar = podeEditarCaixa(papel)
  const [params, setParams] = useSearchParams()
  const extremos = useExtremosDasDatas()
  const [novoAberto, setNovoAberto] = useState(false)

  const anoAtual = new Date().getFullYear()
  const anoDaUrl = Number(params.get('ano'))
  const ano =
    Number.isInteger(anoDaUrl) && anoDaUrl > 1900
      ? anoDaUrl
      : anoPadrao(extremos.data?.primeira ?? null, extremos.data?.ultima ?? null, anoAtual)
  const anos = anosDoSeletor(extremos.data?.primeira ?? null, extremos.data?.ultima ?? null, empresa.ano_inicio, anoAtual)
  if (!anos.includes(ano)) anos.unshift(ano)

  const mesDaUrl = params.get('mes')
  const mes: number | null =
    mesDaUrl === TODOS_OS_MESES
      ? null
      : mesDaUrl !== null && /^\d{1,2}$/.test(mesDaUrl) && Number(mesDaUrl) < 12
        ? Number(mesDaUrl)
        : mesPadrao(extremos.data?.ultima ?? null, ano, new Date())
  const categoria = params.get('categoria') ?? TODAS

  const trocar = (campo: string, valor: string) => {
    const p = new URLSearchParams(params)
    p.set('ano', String(ano))
    if (!p.has('mes')) p.set('mes', mes === null ? TODOS_OS_MESES : String(mes))
    p.set(campo, valor)
    setParams(p, { replace: true })
  }

  return (
    <div>
      <CabecalhoDaPagina
        rotulo="Caixa"
        titulo="Lançamentos"
        acoes={
          podeEditar && !novoAberto ? <Button onClick={() => setNovoAberto(true)}>Novo lançamento</Button> : undefined
        }
      />
      <AbasDoCaixa />
      {extremos.isPending ? (
        <Carregando />
      ) : (
        <div className="flex flex-col gap-4">
          {podeEditar && novoAberto && <NovoLancamento aoFechar={() => setNovoAberto(false)} />}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Selecao rotulo="Ano" value={ano} onChange={(e) => trocar('ano', e.target.value)}>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Selecao>
            <Selecao rotulo="Mês" value={mes === null ? TODOS_OS_MESES : mes} onChange={(e) => trocar('mes', e.target.value)}>
              <option value={TODOS_OS_MESES}>Ano todo</option>
              {MESES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </Selecao>
            <FiltroDeCategoria valor={categoria} aoTrocar={(v) => trocar('categoria', v)} />
            <BuscaEmLista />
          </div>
          <ListaDoMes ano={ano} mes={mes} categoria={categoria} podeEditar={podeEditar} />
          <CargasRecentes podeEditar={podeEditar} />
        </div>
      )}
    </div>
  )
}

function FiltroDeCategoria({ valor, aoTrocar }: { valor: string; aoTrocar: (v: string) => void }) {
  const categorias = useCategorias()
  return (
    <Selecao rotulo="Categoria" value={valor} onChange={(e) => aoTrocar(e.target.value)}>
      <option value={TODAS}>Todas</option>
      <option value={SEM_CATEGORIA}>Sem categoria</option>
      {categorias.data && <OpcoesDeCategoria categorias={categorias.data} incluir={valor} />}
    </Selecao>
  )
}

/** A busca mora na URL também, para o link da fila voltar do mesmo jeito. */
function BuscaEmLista() {
  const [params, setParams] = useSearchParams()
  return (
    <Campo
      rotulo="Buscar na descrição"
      type="search"
      placeholder="Ex.: aluguel"
      value={params.get('busca') ?? ''}
      onChange={(e) => {
        const p = new URLSearchParams(params)
        if (e.target.value) p.set('busca', e.target.value)
        else p.delete('busca')
        setParams(p, { replace: true })
      }}
    />
  )
}

function ListaDoMes({ ano, mes, categoria, podeEditar }: { ano: number; mes: number | null; categoria: string; podeEditar: boolean }) {
  const [params] = useSearchParams()
  const busca = params.get('busca') ?? ''
  const lancamentos = useLancamentosDoAno(ano)
  const categorias = useCategorias()
  const [aviso, setAviso] = useState<{ tom: 'sucesso' | 'erro'; texto: string } | null>(null)

  const lista = useMemo(
    () => filtrarLancamentos(lancamentos.data ?? [], { mes, categoria, busca }),
    [lancamentos.data, mes, categoria, busca],
  )
  const semCategoriaNoPeriodo = useMemo(
    () => filtrarLancamentos(lancamentos.data ?? [], { mes, categoria: SEM_CATEGORIA, busca: '' }).length,
    [lancamentos.data, mes],
  )

  const erro = lancamentos.error ?? categorias.error
  if (erro) return <ErroAoCarregar erro={erro} />
  if (!lancamentos.data || !categorias.data) return <Carregando />

  const nomeDe = new Map(categorias.data.map((c) => [c.id, c.nome]))
  const periodo = mes === null ? `em ${ano}` : `em ${MESES[mes]?.toLowerCase()} de ${ano}`
  const fila = categoria === SEM_CATEGORIA
  const entrou = lista.filter((l) => l.valor > 0).reduce((s, l) => s + l.valor, 0)
  const saiu = lista.filter((l) => l.valor < 0).reduce((s, l) => s + l.valor, 0)

  return (
    <Card titulo={fila ? `Fila sem categoria ${periodo}` : `Lançamentos ${periodo}`}>
      {!fila && semCategoriaNoPeriodo > 0 && (
        <Aviso className="mb-3">
          {semCategoriaNoPeriodo === 1 ? '1 lançamento está' : `${semCategoriaNoPeriodo} lançamentos estão`} sem categoria {periodo}.{' '}
          <Link to={`/caixa/lancamentos?ano=${ano}&mes=${mes ?? TODOS_OS_MESES}&categoria=${SEM_CATEGORIA}`} className="font-semibold underline">
            Abrir a fila
          </Link>
        </Aviso>
      )}
      {aviso && (
        <Aviso tom={aviso.tom} className="mb-3">
          {aviso.texto}
        </Aviso>
      )}
      {lista.length === 0 ? (
        <Vazio
          titulo={fila ? 'Nada para classificar' : 'Nenhum lançamento aqui'}
          texto={
            fila
              ? `Todos os lançamentos ${periodo} já têm categoria.`
              : busca
                ? 'Nenhuma descrição bate com a busca. Tente outra palavra ou limpe a busca.'
                : podeEditar
                  ? 'Troque o mês ou a categoria, importe uma planilha ou crie um lançamento manual.'
                  : 'Troque o mês ou a categoria para ver outros lançamentos.'
          }
          acao={!fila && podeEditar && !busca ? <LinkDeAcao para="/caixa/importar" variante="secundario">Importar planilha</LinkDeAcao> : undefined}
        />
      ) : (
        <>
          <p className="mb-2 text-xs text-apagado">
            {lista.length} {lista.length === 1 ? 'lançamento' : 'lançamentos'} · entrou {formatarDinheiro(entrou)} · saiu{' '}
            {formatarDinheiro(Math.abs(saiu))}
          </p>
          <Tabela aria-label="Lançamentos">
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Descrição</Th>
                <Th>Categoria</Th>
                <Th className="text-right">Valor</Th>
                {podeEditar && <Th className="text-right">Ações</Th>}
              </tr>
            </thead>
            <tbody>
              {lista.map((l) => (
                <LinhaDoLancamento
                  key={l.id}
                  lancamento={l}
                  categorias={categorias.data}
                  nomeDaCategoria={l.categoria_id ? (nomeDe.get(l.categoria_id) ?? 'Categoria apagada') : null}
                  fila={fila}
                  podeEditar={podeEditar}
                  aoAvisar={setAviso}
                />
              ))}
            </tbody>
          </Tabela>
        </>
      )}
    </Card>
  )
}

function LinhaDoLancamento({
  lancamento: l,
  categorias,
  nomeDaCategoria,
  fila,
  podeEditar,
  aoAvisar,
}: {
  lancamento: Lancamento
  categorias: Categoria[]
  nomeDaCategoria: string | null
  fila: boolean
  podeEditar: boolean
  aoAvisar: (a: { tom: 'sucesso' | 'erro'; texto: string } | null) => void
}) {
  const classificar = useClassificarLancamento()
  const excluir = useExcluirLancamento()
  const [regraAberta, setRegraAberta] = useState(false)
  const [categoriaDaRegra, setCategoriaDaRegra] = useState('')

  const aoClassificar = async (categoriaId: string) => {
    if (!categoriaId) return
    setCategoriaDaRegra(categoriaId)
    try {
      await classificar.mutateAsync({ id: l.id, categoria_id: categoriaId })
      aoAvisar(null)
    } catch (e) {
      aoAvisar({ tom: 'erro', texto: `Não foi possível classificar. ${mensagemDeErro(e)}` })
    }
  }

  const aoExcluir = async () => {
    if (!window.confirm(`Excluir o lançamento "${l.descricao || 'sem descrição'}" de ${formatarDataCompleta(l.data)}?`)) return
    try {
      await excluir.mutateAsync(l.id)
      aoAvisar({ tom: 'sucesso', texto: 'Lançamento excluído.' })
    } catch (e) {
      aoAvisar({ tom: 'erro', texto: `Não foi possível excluir. ${mensagemDeErro(e)}` })
    }
  }

  const colunas = podeEditar ? 5 : 4

  return (
    <>
      <tr>
        <Td className="numero whitespace-nowrap text-tinta-2">{formatarDataCompleta(l.data)}</Td>
        <Td className="min-w-40 text-tinta">
          {l.descricao || <span className="text-apagado">(sem descrição)</span>}
          {l.origem === 'manual' && (
            <Pill className="ml-2 align-middle" tom="neutro">
              manual
            </Pill>
          )}
        </Td>
        <Td className="min-w-40">
          {fila && podeEditar ? (
            <select
                aria-label={`Categoria de ${l.descricao}`}
                className="w-full rounded-lg border border-linha-2 bg-superficie px-2 py-1.5 text-sm text-tinta outline-none focus:border-acento"
                value=""
                disabled={classificar.isPending}
                onChange={(e) => void aoClassificar(e.target.value)}
              >
                <option value="">Escolher categoria...</option>
                <OpcoesDeCategoria categorias={categorias} />
              </select>
          ) : nomeDaCategoria ? (
            <span className="text-tinta-2">{nomeDaCategoria}</span>
          ) : (
            <Pill tom="atencao">Sem categoria</Pill>
          )}
        </Td>
        <Td className={cn('numero text-right font-semibold whitespace-nowrap', l.valor > 0 ? 'text-bom' : 'text-tinta')}>
          {l.valor > 0 ? '+' : '-'} {formatarDinheiro(Math.abs(l.valor))}
        </Td>
        {podeEditar && (
          <Td className="text-right whitespace-nowrap">
            {fila && (
              <Button variante="fantasma" tamanho="pequeno" onClick={() => setRegraAberta((v) => !v)}>
                Virar regra
              </Button>
            )}
            {l.origem === 'manual' && (
              <Button variante="perigo" tamanho="pequeno" onClick={() => void aoExcluir()} disabled={excluir.isPending}>
                Excluir
              </Button>
            )}
          </Td>
        )}
      </tr>
      {regraAberta && (
        <tr>
          <Td colSpan={colunas} className="bg-creme">
            <NovaRegraDaLinha
              descricao={l.descricao}
              categorias={categorias}
              categoriaInicial={categoriaDaRegra}
              aoFechar={() => setRegraAberta(false)}
              aoAvisar={aoAvisar}
            />
          </Td>
        </tr>
      )}
    </>
  )
}

function NovaRegraDaLinha({
  descricao,
  categorias,
  categoriaInicial,
  aoFechar,
  aoAvisar,
}: {
  descricao: string
  categorias: Categoria[]
  categoriaInicial: string
  aoFechar: () => void
  aoAvisar: (a: { tom: 'sucesso' | 'erro'; texto: string } | null) => void
}) {
  const criarRegra = useCriarRegra()
  const [contem, setContem] = useState(descricao)
  const [categoriaId, setCategoriaId] = useState(categoriaInicial)
  const [erro, setErro] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (contem.trim() === '') return setErro('Escreva o trecho que a descrição precisa ter.')
    if (!categoriaId) return setErro('Escolha a categoria.')
    setErro(null)
    try {
      const { classificados } = await criarRegra.mutateAsync({ contem: contem.trim(), categoria_id: categoriaId })
      aoAvisar({
        tom: 'sucesso',
        texto: `Regra criada. ${classificados === 1 ? '1 lançamento foi classificado' : `${classificados} lançamentos foram classificados`} na hora.`,
      })
      aoFechar()
    } catch (falha) {
      setErro(`Não foi possível criar a regra. ${mensagemDeErro(falha)}`)
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 py-1 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Campo
          rotulo="Se a descrição contém"
          value={contem}
          onChange={(e) => setContem(e.target.value)}
          ajuda="Deixe só a parte que se repete (tire datas e números que mudam)."
          erro={erro ?? undefined}
        />
      </div>
      <div className="sm:w-56">
        <Selecao rotulo="Vai para" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Escolher...</option>
          <OpcoesDeCategoria categorias={categorias} />
        </Selecao>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={criarRegra.isPending}>
          {criarRegra.isPending ? 'Salvando...' : 'Salvar regra'}
        </Button>
        <Button variante="fantasma" onClick={aoFechar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

function NovoLancamento({ aoFechar }: { aoFechar: () => void }) {
  const categorias = useCategorias()
  const criar = useCriarLancamento()
  const [data, setData] = useState(() => new Date().toLocaleDateString('sv-SE'))
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida')
  const [categoriaId, setCategoriaId] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setOk(false)
    const numero = lerValor(valor)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return setErro('Escolha a data.')
    if (descricao.trim() === '') return setErro('Escreva a descrição.')
    if (numero === null || numero === 0) return setErro('Digite um valor maior que zero, como 1.250,00.')
    setErro(null)
    try {
      await criar.mutateAsync({ data, descricao, valor: valorComSinal(numero, tipo), categoria_id: categoriaId || null })
      setDescricao('')
      setValor('')
      setOk(true)
    } catch (falha) {
      setErro(`Não foi possível salvar. ${mensagemDeErro(falha)}`)
    }
  }

  return (
    <Card titulo="Novo lançamento">
      <form onSubmit={enviar} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
        <Campo rotulo="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Conserto do ar-condicionado" required />
        <Campo rotulo="Valor (R$)" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="1.250,00" required />
        <Selecao rotulo="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as 'entrada' | 'saida')}>
          <option value="saida">Saída (pagamento)</option>
          <option value="entrada">Entrada (recebimento)</option>
        </Selecao>
        <Selecao rotulo="Categoria" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
          <option value="">Sem categoria por enquanto</option>
          {categorias.data && <OpcoesDeCategoria categorias={categorias.data} />}
        </Selecao>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={criar.isPending}>
            {criar.isPending ? 'Salvando...' : 'Salvar lançamento'}
          </Button>
          <Button variante="fantasma" onClick={aoFechar}>
            Fechar
          </Button>
        </div>
      </form>
      {erro && (
        <Aviso tom="erro" className="mt-3">
          {erro}
        </Aviso>
      )}
      {ok && (
        <Aviso tom="sucesso" className="mt-3">
          Lançamento salvo. Pode digitar o próximo.
        </Aviso>
      )}
    </Card>
  )
}

function CargasRecentes({ podeEditar }: { podeEditar: boolean }) {
  const cargas = useCargas()
  const desfazer = useDesfazerCarga()
  const [aviso, setAviso] = useState<{ tom: 'sucesso' | 'erro'; texto: string } | null>(null)

  const aoDesfazer = async (c: Carga) => {
    const pergunta = `Desfazer a importação "${c.arquivo}"? Os ${c.linhas} lançamentos dela serão apagados.`
    if (!window.confirm(pergunta)) return
    try {
      await desfazer.mutateAsync(c.id)
      setAviso({ tom: 'sucesso', texto: `Importação "${c.arquivo}" desfeita.` })
    } catch (e) {
      setAviso({ tom: 'erro', texto: `Não foi possível desfazer. ${mensagemDeErro(e)}` })
    }
  }

  return (
    <Card titulo="Importações recentes">
      {aviso && (
        <Aviso tom={aviso.tom} className="mb-3">
          {aviso.texto}
        </Aviso>
      )}
      {cargas.error ? (
        <ErroAoCarregar erro={cargas.error} />
      ) : !cargas.data ? (
        <Carregando />
      ) : cargas.data.length === 0 ? (
        <p className="text-sm text-apagado">Nenhuma planilha importada ainda.</p>
      ) : (
        <ul className="divide-y divide-linha">
          {cargas.data.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-tinta">{c.arquivo}</p>
                <p className="text-xs text-apagado">
                  {c.linhas} {c.linhas === 1 ? 'linha' : 'linhas'} · importada em {formatarDataCompleta(c.criado_em)}
                </p>
              </div>
              {podeEditar && (
                <Button variante="perigo" tamanho="pequeno" onClick={() => void aoDesfazer(c)} disabled={desfazer.isPending}>
                  Desfazer esta importação
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
