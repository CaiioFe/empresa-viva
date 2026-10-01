import { useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useEmpresaAtiva } from '@/app/sessao'
import { Aviso, Button, CabecalhoDaPagina, Campo, Card, Kpi, Pill, Resumo, Selecao, Tabela, Td, Th, Vazio, type Tendencia, type TomPill } from '@/components/ui'
import { formatarDinheiro, formatarNumero } from '@/lib/formatos'
import { podeEditarCaixa } from '@/lib/permissoes'
import type { GrupoCategoria } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { AbasDoCaixa, Carregando, ErroAoCarregar, LinkDeAcao, mensagemDeErro } from './abas-do-caixa'
import { anoPadrao, anosDoSeletor, MESES, SEM_CATEGORIA, textoDaVariacao } from './apoio'
import { useCategorias, useExtremosDasDatas, useLancamentosDoAno, useSaldoInicial, useSalvarSaldoInicial } from './api'
import {
  curva8020,
  MESES_CURTOS,
  montarFluxo,
  semaforo,
  sobreRecebimentos,
  variacao,
  type FluxoDoAno,
  type LinhaDoFluxo,
  type Semaforo,
} from './calculo'
import { lerValor } from './planilha'

/*
  /caixa: fluxo de caixa do ano (TASK-104). Todo o cálculo vem de calculo.ts; aqui só se desenha.
  Convenção: no banco, pagamento é negativo; na tela, aparece sem o sinal.
*/

const TOM_DO_SEMAFORO: Record<Semaforo, TomPill> = { ruim: 'ruim', bom: 'bom', neutro: 'neutro' }
const TENDENCIA_DO_SEMAFORO: Record<Semaforo, Tendencia> = { ruim: 'ruim', bom: 'boa', neutro: 'neutra' }

/** Célula de valor da tabela anual: zero vira um traço curto para a tabela respirar. */
const celula = (v: number) => (v === 0 ? '-' : formatarNumero(v, 2))
const porcento = (v: number | null) => (v === null ? '-' : `${formatarNumero(v, 1)}%`)

export function PaginaCaixa() {
  const { empresa } = useEmpresaAtiva()
  const [params, setParams] = useSearchParams()
  const extremos = useExtremosDasDatas()
  const anoAtual = new Date().getFullYear()
  const anoDaUrl = Number(params.get('ano'))
  const ano =
    Number.isInteger(anoDaUrl) && anoDaUrl > 1900
      ? anoDaUrl
      : anoPadrao(extremos.data?.primeira ?? null, extremos.data?.ultima ?? null, anoAtual)
  const anos = anosDoSeletor(extremos.data?.primeira ?? null, extremos.data?.ultima ?? null, empresa.ano_inicio, anoAtual)
  if (!anos.includes(ano)) anos.unshift(ano)

  const trocarAno = (novo: number) => {
    const p = new URLSearchParams(params)
    p.set('ano', String(novo))
    setParams(p, { replace: true })
  }

  return (
    <div>
      <CabecalhoDaPagina
        rotulo="Caixa"
        titulo="Fluxo do ano"
        acoes={
          <div className="w-32">
            <Selecao rotulo="Ano" value={ano} onChange={(e) => trocarAno(Number(e.target.value))}>
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Selecao>
          </div>
        }
      />
      <AbasDoCaixa />
      {extremos.isPending ? <Carregando /> : <FluxoDoAnoCompleto ano={ano} />}
    </div>
  )
}

function FluxoDoAnoCompleto({ ano }: { ano: number }) {
  const { papel } = useEmpresaAtiva()
  const categorias = useCategorias()
  const lancamentos = useLancamentosDoAno(ano)
  const saldo = useSaldoInicial(ano)

  const fluxo = useMemo(
    () =>
      categorias.data && lancamentos.data && saldo.data !== undefined
        ? montarFluxo(ano, saldo.data, categorias.data, lancamentos.data)
        : null,
    [ano, categorias.data, lancamentos.data, saldo.data],
  )

  const erro = categorias.error ?? lancamentos.error ?? saldo.error
  if (erro) return <ErroAoCarregar erro={erro} />
  if (!fluxo || !lancamentos.data) return <Carregando />

  const podeEditar = podeEditarCaixa(papel)

  if (lancamentos.data.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <SaldoInicial ano={ano} valor={fluxo.saldoInicial} podeEditar={podeEditar} />
        <Vazio
          titulo={`Nenhum lançamento em ${ano}`}
          texto={
            podeEditar
              ? 'Importe a planilha do banco ou do sistema da empresa para montar o fluxo do ano.'
              : 'Quando o financeiro importar a planilha do ano, o fluxo aparece aqui.'
          }
          acao={podeEditar ? <LinkDeAcao para="/caixa/importar">Importar planilha</LinkDeAcao> : undefined}
        />
      </div>
    )
  }

  return <PainelDoFluxo fluxo={fluxo} podeEditar={podeEditar} />
}

function PainelDoFluxo({ fluxo, podeEditar }: { fluxo: FluxoDoAno; podeEditar: boolean }) {
  const ultimo = Math.max(fluxo.ultimoMesComDado, 0)
  const [mesEscolhido, setMesEscolhido] = useState<number | null>(null)
  const mes = mesEscolhido ?? ultimo

  return (
    <div className="flex flex-col gap-4">
      <Indicadores fluxo={fluxo} mes={ultimo} />
      <GraficoDaMargem fluxo={fluxo} />
      <SaldoInicial ano={fluxo.ano} valor={fluxo.saldoInicial} podeEditar={podeEditar} />
      <TabelaDoFluxo fluxo={fluxo} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <ComparacaoDoMes fluxo={fluxo} mes={mes} aoTrocar={setMesEscolhido} />
        <Curva fluxo={fluxo} mes={mes} />
      </div>
    </div>
  )
}

function Indicadores({ fluxo, mes }: { fluxo: FluxoDoAno; mes: number }) {
  const nome = (MESES[mes] ?? '').toLowerCase()
  const anterior = mes > 0 ? mes - 1 : null
  const comparar = (grupo: GrupoCategoria, serie: number[]) => {
    if (anterior === null) return { detalhe: `em ${nome}`, tendencia: 'neutra' as Tendencia }
    const pct = variacao(serie[mes] ?? 0, serie[anterior] ?? 0)
    return {
      detalhe: `${textoDaVariacao(pct)} sobre ${MESES[anterior]?.toLowerCase()}`,
      tendencia: TENDENCIA_DO_SEMAFORO[semaforo(grupo, pct)],
    }
  }
  const receb = comparar('recebimentos', fluxo.recebimentos)
  const pagto = comparar('pagamentos_operacionais', fluxo.pagamentosOperacionais)
  const margem = fluxo.margem[mes] ?? null

  return (
    <Resumo>
      <Kpi destaque rotulo={`Saldo final de ${nome}`} valor={formatarDinheiro(fluxo.saldoFinal[mes] ?? 0)} detalhe="o que sobrou no caixa" />
      <Kpi rotulo="Recebimentos" valor={formatarDinheiro(fluxo.recebimentos[mes] ?? 0)} detalhe={receb.detalhe} tendencia={receb.tendencia} />
      <Kpi
        rotulo="Pagamentos operacionais"
        valor={formatarDinheiro(Math.abs(fluxo.pagamentosOperacionais[mes] ?? 0))}
        detalhe={pagto.detalhe}
        tendencia={pagto.tendencia}
      />
      <Kpi
        className="max-xl:col-span-2"
        rotulo="Margem de caixa"
        valor={porcento(margem)}
        detalhe={`resultado de ${formatarDinheiro(fluxo.resultadoDaOperacao[mes] ?? 0)}`}
        tendencia={margem === null ? 'neutra' : margem >= 0 ? 'boa' : 'ruim'}
      />
    </Resumo>
  )
}

function GraficoDaMargem({ fluxo }: { fluxo: FluxoDoAno }) {
  const dados = MESES_CURTOS.map((m, i) => ({ mes: m, margem: fluxo.margem[i] ?? null }))
  return (
    <Card titulo="Margem de caixa mês a mês" subtitulo="Quanto sobrou da operação para cada R$ 100 recebidos">
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--color-linha)" strokeDasharray="4 6" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-apagado)', fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-apagado)', fontSize: 11 }}
              tickFormatter={(v: number) => `${formatarNumero(v)}%`}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-creme)' }}
              formatter={(v) => [`${formatarNumero(Number(v), 1)}%`, 'Margem']}
              contentStyle={{ border: 'none', borderRadius: 14, boxShadow: 'var(--shadow-flutua)', fontSize: 12 }}
            />
            <Bar dataKey="margem" radius={999} barSize={20} background={{ fill: 'var(--color-creme)', radius: 999 }}>
              {dados.map((d, i) => (
                <Cell
                  key={d.mes}
                  fill={(d.margem ?? 0) < 0 ? 'var(--color-ruim)' : i === fluxo.ultimoMesComDado ? 'var(--color-acento)' : 'var(--color-tinta)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

function SaldoInicial({ ano, valor, podeEditar }: { ano: number; valor: number; podeEditar: boolean }) {
  const salvar = useSalvarSaldoInicial()
  const [editando, setEditando] = useState(false)
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const numero = texto.trim() === '' ? 0 : lerValor(texto)
    if (numero === null) {
      setErro('Digite um valor como 12.500,00')
      return
    }
    setErro(null)
    try {
      await salvar.mutateAsync({ ano, valor: numero })
      setEditando(false)
    } catch (falha) {
      setErro(`Não foi possível salvar. ${mensagemDeErro(falha)}`)
    }
  }

  if (editando) {
    return (
      <form onSubmit={enviar} className="flex flex-wrap items-end gap-2 rounded-caixa bg-superficie p-4 shadow-painel">
        <div className="w-48">
          <Campo
            rotulo={`Saldo inicial de ${ano}`}
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            erro={erro ?? undefined}
            autoFocus
          />
        </div>
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variante="fantasma" onClick={() => setEditando(false)}>
          Cancelar
        </Button>
      </form>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-tinta-2">
      <span>
        Saldo no caixa em 1º de janeiro de {ano}: <strong className="numero text-tinta">{formatarDinheiro(valor)}</strong>
      </span>
      {podeEditar && (
        <Button
          variante="fantasma"
          tamanho="pequeno"
          onClick={() => {
            setTexto(formatarNumero(valor, 2))
            setEditando(true)
          }}
        >
          Alterar saldo inicial
        </Button>
      )}
    </div>
  )
}

type LinhaDaTabela = {
  chave: string
  rotulo: string
  meses: number[]
  total: number
  estilo: 'saldo' | 'grupo' | 'categoria' | 'resumo' | 'alerta'
  link?: string
}

/** Monta as linhas da tabela anual na ordem de leitura do dono. Pagamentos operacionais sem o sinal. */
function linhasDaTabela(fluxo: FluxoDoAno): LinhaDaTabela[] {
  const soma = (v: number[]) => Math.round(v.reduce((s, x) => s + x, 0) * 100) / 100
  // Saldo de mês que ainda não aconteceu (depois do último lançamento) aparece como "-".
  const ateOUltimoMes = (v: number[]) => v.map((x, i) => (i > fluxo.ultimoMesComDado ? 0 : x))
  const linhas: LinhaDaTabela[] = [
    {
      chave: 'saldo-inicial',
      rotulo: 'Saldo inicial',
      meses: ateOUltimoMes([fluxo.saldoInicial, ...fluxo.saldoFinal.slice(0, 11)]),
      total: fluxo.saldoInicial,
      estilo: 'saldo',
    },
  ]
  const doGrupo = (grupo: GrupoCategoria) => {
    const g = fluxo.grupos.find((x) => x.grupo === grupo)
    if (!g || (g.linhas.length === 0 && g.total === 0)) return
    const sinal = grupo === 'pagamentos_operacionais' ? -1 : 1
    const virar = (v: number[]) => v.map((x) => (x === 0 ? 0 : x * sinal))
    linhas.push({ chave: `g-${grupo}`, rotulo: g.rotulo, meses: virar(g.meses), total: g.total * sinal || 0, estilo: 'grupo' })
    for (const l of g.linhas as LinhaDoFluxo[]) {
      linhas.push({ chave: `c-${l.categoriaId}`, rotulo: l.nome, meses: virar(l.meses), total: l.total * sinal || 0, estilo: 'categoria' })
    }
  }
  doGrupo('recebimentos')
  doGrupo('pagamentos_operacionais')
  linhas.push({
    chave: 'resultado',
    rotulo: 'Resultado da operação',
    meses: fluxo.resultadoDaOperacao,
    total: soma(fluxo.resultadoDaOperacao),
    estilo: 'resumo',
  })
  for (const g of ['investimentos', 'acionistas', 'financiamento', 'nao_operacional'] as const) doGrupo(g)
  if (fluxo.semCategoria.some((v) => v !== 0)) {
    linhas.push({
      chave: 'sem-categoria',
      rotulo: 'Sem categoria',
      meses: fluxo.semCategoria,
      total: soma(fluxo.semCategoria),
      estilo: 'alerta',
      link: `/caixa/lancamentos?ano=${fluxo.ano}&mes=todos&categoria=${SEM_CATEGORIA}`,
    })
  }
  linhas.push({ chave: 'fluxo-liquido', rotulo: 'Fluxo líquido', meses: fluxo.fluxoLiquido, total: soma(fluxo.fluxoLiquido), estilo: 'resumo' })
  linhas.push({
    chave: 'saldo-final',
    rotulo: 'Saldo final',
    meses: ateOUltimoMes(fluxo.saldoFinal),
    total: fluxo.saldoFinal[Math.max(fluxo.ultimoMesComDado, 0)] ?? fluxo.saldoInicial,
    estilo: 'saldo',
  })
  return linhas
}

const FUNDO_DA_LINHA: Record<LinhaDaTabela['estilo'], string> = {
  saldo: 'bg-creme font-semibold text-tinta',
  grupo: 'bg-superficie font-semibold text-tinta',
  categoria: 'bg-superficie text-tinta-2',
  resumo: 'bg-acento-claro font-semibold text-tinta',
  alerta: 'bg-ambar-claro text-ambar-escuro',
}

function TabelaDoFluxo({ fluxo }: { fluxo: FluxoDoAno }) {
  const linhas = linhasDaTabela(fluxo)
  return (
    <Card titulo={`Fluxo de caixa de ${fluxo.ano}`}>
      <p className="mb-3 text-xs text-apagado">Pagamentos aparecem sem o sinal de menos. No celular, arraste a tabela para o lado.</p>
      <Tabela aria-label={`Fluxo de caixa de ${fluxo.ano}`} className="min-w-[1180px]">
        <thead>
          <tr>
            <Th className="sticky left-0 z-10 min-w-44 bg-superficie">Categoria</Th>
            {MESES_CURTOS.map((m) => (
              <Th key={m} className="text-right">
                {m}
              </Th>
            ))}
            <Th className="text-right">Total</Th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.chave} className={FUNDO_DA_LINHA[l.estilo]} data-linha={l.chave}>
              <Td className={cn('sticky left-0 z-10 max-w-52 truncate', FUNDO_DA_LINHA[l.estilo], l.estilo === 'categoria' && 'pl-5')}>
                {l.link ? (
                  <Link to={l.link} className="underline underline-offset-2 hover:text-tinta">
                    {l.rotulo} (classificar)
                  </Link>
                ) : (
                  l.rotulo
                )}
              </Td>
              {l.meses.map((v, i) => (
                <Td key={i} className={cn('numero text-right whitespace-nowrap', v === 0 && 'text-apagado', v < 0 && l.estilo !== 'alerta' && 'text-ruim')}>
                  {celula(v)}
                </Td>
              ))}
              <Td className={cn('numero text-right font-semibold whitespace-nowrap', l.total < 0 && 'text-ruim')}>{celula(l.total)}</Td>
            </tr>
          ))}
        </tbody>
      </Tabela>
    </Card>
  )
}

function ComparacaoDoMes({ fluxo, mes, aoTrocar }: { fluxo: FluxoDoAno; mes: number; aoTrocar: (m: number) => void }) {
  const recebimentosDoMes = fluxo.recebimentos[mes] ?? 0
  const secoes = fluxo.grupos.filter((g) => g.grupo === 'recebimentos' || g.grupo === 'pagamentos_operacionais')
  const anterior = mes > 0 ? MESES[mes - 1]?.toLowerCase() : null

  return (
    <Card
      titulo="Comparar mês"
      acao={
        <div className="w-40">
          <Selecao rotulo="Mês" value={mes} onChange={(e) => aoTrocar(Number(e.target.value))}>
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </Selecao>
        </div>
      }
    >
      <p className="mb-3 text-xs text-apagado">
        {anterior
          ? `Variação contra ${anterior}. Vermelho: pagamento que subiu ou recebimento que caiu mais de 12%.`
          : 'Janeiro não tem mês anterior no mesmo ano para comparar.'}
      </p>
      <Tabela aria-label="Comparação do mês">
        <thead>
          <tr>
            <Th>Categoria</Th>
            <Th className="text-right">Valor</Th>
            <Th className="text-right">% receb.</Th>
            <Th className="text-right">Variação</Th>
          </tr>
        </thead>
        {secoes.map((g) => {
          const linhas = g.linhas.filter((l) => (l.meses[mes] ?? 0) !== 0 || (mes > 0 && (l.meses[mes - 1] ?? 0) !== 0))
          return (
            <tbody key={g.grupo}>
              <tr>
                <Td colSpan={4} className="bg-creme text-xs text-tinta-2 font-medium">
                  {g.rotulo}
                </Td>
              </tr>
              {linhas.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-apagado">
                    Nada lançado neste mês.
                  </Td>
                </tr>
              )}
              {linhas.map((l) => {
                const atual = l.meses[mes] ?? 0
                const pct = mes > 0 ? variacao(atual, l.meses[mes - 1] ?? 0) : null
                const luz = semaforo(g.grupo, pct)
                return (
                  <tr key={l.categoriaId}>
                    <Td className="text-tinta">{l.nome}</Td>
                    <Td className="numero text-right whitespace-nowrap">{formatarDinheiro(Math.abs(atual))}</Td>
                    <Td className="numero text-right text-tinta-2">{porcento(sobreRecebimentos(atual, recebimentosDoMes))}</Td>
                    <Td className="text-right">
                      <Pill tom={TOM_DO_SEMAFORO[luz]}>{textoDaVariacao(pct)}</Pill>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          )
        })}
      </Tabela>
    </Card>
  )
}

function Curva({ fluxo, mes }: { fluxo: FluxoDoAno; mes: number }) {
  const pagamentos = fluxo.grupos.find((g) => g.grupo === 'pagamentos_operacionais')?.linhas ?? []
  const itens = curva8020(pagamentos, mes)
  const nos80 = itens.filter((i) => i.nos80).length
  const nome = MESES[mes] ?? ''

  return (
    <Card titulo={`Curva 80/20 de ${nome.toLowerCase()}`}>
      {itens.length === 0 ? (
        <p className="text-sm text-apagado">Nenhum pagamento operacional em {nome.toLowerCase()}.</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-tinta-2">
            <strong className="text-tinta">
              {nos80} de {itens.length} {itens.length === 1 ? 'categoria' : 'categorias'}
            </strong>{' '}
            {nos80 === 1 ? 'responde' : 'respondem'} por 80% dos pagamentos. É onde vale olhar primeiro.
          </p>
          <ul className="flex flex-col gap-2.5">
            {itens.map((i) => (
              <li key={i.categoriaId}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className={cn('min-w-0 truncate', i.nos80 ? 'font-semibold text-tinta' : 'text-tinta-2')}>
                    {i.nome}
                    {i.nos80 && (
                      <Pill tom="acento" className="ml-2 align-middle">
                        nos 80%
                      </Pill>
                    )}
                  </span>
                  <span className="numero shrink-0 text-xs text-tinta-2">
                    {formatarDinheiro(i.valor)} · {formatarNumero(i.pct, 1)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-linha" aria-hidden>
                  <div className={cn('h-full rounded-full', i.nos80 ? 'bg-acento' : 'bg-apagado/50')} style={{ width: `${Math.max(i.pct, 1)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {itens.length > 0 && (
        <Aviso className="mt-4">
          Acumulado: as categorias em destaque somam {formatarNumero(itens.filter((i) => i.nos80).at(-1)?.acumulado ?? 0, 1)}% do que saiu no mês.
        </Aviso>
      )}
    </Card>
  )
}
