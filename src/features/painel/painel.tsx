import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ChevronRight, TriangleAlert } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useEmpresaAtiva } from '@/app/sessao'
import { iniciaisDe, tomDoNome } from '@/components/layout/app-shell'
import { Aviso, CabecalhoDaPagina, Card, Kpi, Pill, Resumo, Vazio } from '@/components/ui'
import { curva8020, LIMITE_DO_SEMAFORO, maioresVariacoes, MESES_CURTOS, montarFluxo, variacao, type FluxoDoAno } from '@/features/caixa/calculo'
import { formatarData, formatarDinheiro, formatarDinheiroCurto, formatarNumero } from '@/lib/formatos'
import { podeVerCaixa, podeVerPessoas } from '@/lib/permissoes'
import { cn } from '@/lib/utils'
import { useCaixaDoPainel, usePessoasDoPainel, type DadosDePessoas } from './api'

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const CORES_DA_ROSCA = ['var(--color-tinta)', 'var(--color-lavanda)', 'var(--color-manteiga)', 'var(--color-salvia)', 'var(--color-pessego)']

function Mais({ para, children }: { para: string; children: string }) {
  return (
    <Link
      to={para}
      className="inline-flex h-7 items-center gap-1 rounded-full bg-superficie px-3 text-xs font-semibold text-tinta shadow-painel transition-colors hover:bg-creme"
    >
      {children}
      <ArrowRight size={13} aria-hidden />
    </Link>
  )
}

function TituloDaSecao({ id, children, acao }: { id: string; children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-base font-extrabold tracking-tight text-tinta">
        {children}
      </h2>
      {acao}
    </div>
  )
}

function Esqueleto() {
  return (
    <div aria-hidden className="flex animate-pulse flex-col gap-4">
      <div className="h-6 w-44 rounded-full bg-areia" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-caixa bg-areia" />
        ))}
      </div>
      <div className="h-72 rounded-caixa bg-areia" />
    </div>
  )
}

function comparacao(atual: number, anterior: number | undefined, quandoSobe: 'boa' | 'ruim') {
  if (anterior === undefined) return { detalhe: undefined, tendencia: 'neutra' as const }
  const pct = variacao(atual, anterior)
  if (pct === null) return { detalhe: 'sem mês anterior para comparar', tendencia: 'neutra' as const }
  const sobe = pct > 0
  const texto = `${sobe ? '+' : ''}${formatarNumero(pct, 1)}% contra o mês anterior`
  // só pinta de verde ou vermelho o que passa do limite do semáforo (12%), igual à tela do caixa
  if (Math.abs(pct) <= LIMITE_DO_SEMAFORO) return { detalhe: texto, tendencia: 'neutra' as const }
  const boa = (sobe && quandoSobe === 'boa') || (!sobe && quandoSobe === 'ruim')
  return { detalhe: texto, tendencia: boa ? ('boa' as const) : ('ruim' as const) }
}

function GraficoEntradasESaidas({ fluxo }: { fluxo: FluxoDoAno }) {
  const dados = MESES_CURTOS.slice(0, fluxo.ultimoMesComDado + 1).map((m, i) => ({
    mes: m,
    entrou: fluxo.recebimentos[i] ?? 0,
    saiu: Math.abs(fluxo.pagamentosOperacionais[i] ?? 0),
  }))
  return (
    <div className="h-48" role="img" aria-label="Gráfico de entradas e saídas mês a mês">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 8, right: 4, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="gEntrou" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-salvia-escuro)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-salvia-escuro)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gSaiu" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-pessego-escuro)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-pessego-escuro)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-linha)" strokeDasharray="4 6" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tick={{ fill: 'var(--color-apagado)', fontSize: 12 }} dy={6} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fill: 'var(--color-apagado)', fontSize: 12 }}
            tickFormatter={(v: number) => formatarDinheiroCurto(v).replace("R$ ", "")}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-linha-2)', strokeDasharray: '4 4' }}
            contentStyle={{ borderRadius: 14, border: 'none', boxShadow: 'var(--shadow-flutua)', fontSize: 12 }}
            formatter={(v, nome) => [formatarDinheiro(Number(v)), nome === 'entrou' ? 'Entrou' : 'Saiu']}
          />
          <Area type="monotone" dataKey="entrou" stroke="var(--color-salvia-escuro)" strokeWidth={2.5} fill="url(#gEntrou)" />
          <Area type="monotone" dataKey="saiu" stroke="var(--color-pessego-escuro)" strokeWidth={2.5} fill="url(#gSaiu)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function RoscaDoMes({ fluxo, mes }: { fluxo: FluxoDoAno; mes: number }) {
  const pagamentos = fluxo.grupos.find((g) => g.grupo === 'pagamentos_operacionais')?.linhas ?? []
  const curva = curva8020(pagamentos, mes)
  const principais = curva.slice(0, 4)
  const resto = curva.slice(4).reduce((s, c) => s + c.valor, 0)
  const fatias = [...principais.map((c) => ({ nome: c.nome, valor: c.valor })), ...(resto > 0 ? [{ nome: 'Outras', valor: resto }] : [])]
  const total = fatias.reduce((s, f) => s + f.valor, 0)
  if (total === 0) return <p className="text-sm text-tinta-2">Nenhum pagamento neste mês.</p>

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative size-32 shrink-0" role="img" aria-label="Distribuição dos pagamentos do mês por categoria">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={fatias} dataKey="valor" nameKey="nome" innerRadius="68%" outerRadius="100%" paddingAngle={2} cornerRadius={6} stroke="none">
              {fatias.map((f, i) => (
                <Cell key={f.nome} fill={CORES_DA_ROSCA[i % CORES_DA_ROSCA.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] font-semibold text-apagado">Saiu no mês</p>
            <p className="numero text-[15px] font-extrabold tracking-tight text-tinta">{formatarDinheiroCurto(total)}</p>
          </div>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-1.5">
        {fatias.map((f, i) => (
          <li key={f.nome} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: CORES_DA_ROSCA[i % CORES_DA_ROSCA.length] }} />
            <span className="min-w-0 flex-1 truncate text-tinta-2">{f.nome}</span>
            <span className="numero font-bold text-tinta">{Math.round((f.valor / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BlocoDoCaixa({ fluxo }: { fluxo: FluxoDoAno }) {
  const mes = fluxo.ultimoMesComDado
  if (mes < 0) {
    return (
      <Vazio
        titulo="O caixa ainda está vazio"
        texto="Importe a planilha do sistema que a empresa já usa."
        acao={<Mais para="/caixa/importar">Importar planilha</Mais>}
      />
    )
  }
  const anterior = mes > 0 ? mes - 1 : undefined
  const receb = fluxo.recebimentos[mes] ?? 0
  const pag = Math.abs(fluxo.pagamentosOperacionais[mes] ?? 0)
  const margem = fluxo.margem[mes]
  const destaques = maioresVariacoes(fluxo, mes)
  const semCategoria = fluxo.semCategoria.some((v) => v !== 0)

  return (
    <section aria-labelledby="titulo-caixa">
      <TituloDaSecao id="titulo-caixa" acao={<Mais para="/caixa">Fluxo do ano</Mais>}>
        Caixa de {MESES[mes]}
      </TituloDaSecao>
      <Resumo>
        <Kpi destaque tour="saldo" rotulo="Saldo em caixa" valor={formatarDinheiro(fluxo.saldoFinal[mes] ?? 0)} detalhe="no fim do mês" />
        <Kpi
          rotulo="Recebimentos"
          valor={formatarDinheiro(receb)}
          {...comparacao(receb, anterior === undefined ? undefined : fluxo.recebimentos[anterior], 'boa')}
        />
        <Kpi
          rotulo="Pagamentos"
          valor={formatarDinheiro(pag)}
          {...comparacao(pag, anterior === undefined ? undefined : Math.abs(fluxo.pagamentosOperacionais[anterior] ?? 0), 'ruim')}
        />
        <Kpi
          className="max-xl:col-span-2"
          rotulo="Margem de caixa"
          valor={margem === null || margem === undefined ? '-' : `${formatarNumero(margem, 1)}%`}
          detalhe="do que entrou, quanto sobrou"
        />
      </Resumo>

      <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-[1.45fr_1fr_1fr]">
        <Card
          className="lg:col-span-2 xl:col-span-1"
          titulo="Entradas e saídas"
          subtitulo={`Janeiro a ${MESES[mes]} de ${fluxo.ano}`}
          acao={
            <div className="flex items-center gap-3 text-xs font-semibold text-tinta-2">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-salvia-escuro" /> Entrou
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-pessego-escuro" /> Saiu
              </span>
            </div>
          }
        >
          <GraficoEntradasESaidas fluxo={fluxo} />
        </Card>
        <Card titulo="Para onde foi o dinheiro" subtitulo={`Pagamentos de ${MESES[mes]}`}>
          <RoscaDoMes fluxo={fluxo} mes={mes} />
        </Card>
        <Card titulo="O que mais subiu" subtitulo="Pagamentos acima de 12% contra o mês anterior">
          {destaques.length === 0 ? (
            <p className="text-sm text-tinta-2">Nenhum pagamento fugiu do padrão do mês anterior.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {destaques.map((d) => (
                <li key={d.categoriaId} className="flex items-center gap-2.5 rounded-xl bg-creme px-3 py-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-superficie text-tinta shadow-painel">
                    <ArrowUpRight size={14} strokeWidth={2.5} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-tinta">{d.nome}</p>
                    <p className="numero truncate text-[11px] text-apagado">
                      {formatarDinheiroCurto(Math.abs(d.anterior))} para {formatarDinheiroCurto(Math.abs(d.atual))}
                    </p>
                  </div>
                  <Pill tom="ruim">+{formatarNumero(d.pct, 1)}%</Pill>
                </li>
              ))}
            </ul>
          )}
          {semCategoria && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-creme px-3 py-2 text-xs text-tinta">
              <TriangleAlert size={16} className="text-ambar-escuro" aria-hidden />
              <span className="flex-1">Há lançamentos sem categoria.</span>
              <Link to="/caixa/lancamentos?categoria=sem" className="rounded-full bg-tinta px-3 py-1 text-[11px] font-semibold text-superficie">
                Classificar agora
              </Link>
            </div>
          )}
        </Card>
      </div>

    </section>
  )
}

function BlocoDePessoas({ dados }: { dados: DadosDePessoas }) {
  const { pessoas, totalDeEtapas, eventosDaSemana } = dados
  if (pessoas.length === 0) {
    return (
      <Vazio
        titulo="Nenhum colaborador cadastrado"
        texto="Cadastre o time para acompanhar a jornada de cada um."
        acao={<Mais para="/pessoas">Ir para Pessoas</Mais>}
      />
    )
  }
  const emIntegracao = pessoas.filter((p) => totalDeEtapas > 0 && p.etapasConcluidas < totalDeEtapas)
  const semDisc = pessoas.filter((p) => !p.temDisc)
  const atencao = [...new Map([...emIntegracao, ...semDisc].map((p) => [p.id, p])).values()].slice(0, 6)

  return (
    <section aria-labelledby="titulo-pessoas">
      <TituloDaSecao id="titulo-pessoas" acao={<Mais para="/pessoas">Ver o time</Mais>}>
        Pessoas
      </TituloDaSecao>
      <Resumo>
        <Kpi rotulo="No time" valor={pessoas.length} detalhe="ativos" tom="ceu" />
        <Kpi rotulo="Em integração" valor={emIntegracao.length} detalhe="com etapa pendente" tom="manteiga" />
        <Kpi
          className="max-xl:col-span-2"
          tom="lavanda"
          rotulo="DISC feito"
          valor={`${Math.round(((pessoas.length - semDisc.length) / pessoas.length) * 100)}%`}
          detalhe={semDisc.length ? `${semDisc.length} sem perfil` : 'time completo'}
        />
      </Resumo>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card titulo="Pede atenção" subtitulo="Integração pendente ou DISC por fazer" className="min-w-0">
          {atencao.length === 0 ? (
            <p className="text-sm text-tinta-2">Todo mundo integrado e com o DISC feito.</p>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {atencao.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/pessoas/${p.id}`}
                    className="group flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors duration-150 hover:bg-creme"
                  >
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold', tomDoNome(iniciaisDe(p.nome)))}>
                      {iniciaisDe(p.nome)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-tinta">{p.nome}</span>
                      <span className="block text-xs text-apagado">{p.funcao || 'Sem função'}</span>
                    </span>
                    <span className="hidden shrink-0 flex-wrap justify-end gap-1.5 sm:flex">
                      {totalDeEtapas > 0 && p.etapasConcluidas < totalDeEtapas && (
                        <Pill tom="atencao">
                          Integração {p.etapasConcluidas}/{totalDeEtapas}
                        </Pill>
                      )}
                      {!p.temDisc && <Pill tom="ruim">Sem DISC</Pill>}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-apagado group-hover:text-tinta" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card titulo="Na última semana" subtitulo="O que foi registrado na jornada do time" className="min-w-0">
          {eventosDaSemana.length === 0 ? (
            <p className="text-sm text-tinta-2">Nada registrado na jornada nos últimos 7 dias.</p>
          ) : (
            <ol className="-mx-2 flex flex-col">
              {eventosDaSemana.map((e) => (
                <li key={e.id} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold', tomDoNome(iniciaisDe(e.nome)))}>
                    {iniciaisDe(e.nome)}
                  </span>
                  <span className="min-w-0 flex-1 text-xs text-tinta-2">
                    <Link to={`/pessoas/${e.colaborador_id}`} className="text-[13px] font-bold text-tinta hover:underline hover:underline-offset-4">
                      {e.nome}
                    </Link>
                    <span className="block truncate">{e.texto}</span>
                  </span>
                  <span className="numero shrink-0 rounded-full bg-creme px-2.5 py-1 text-[11px] font-semibold text-tinta-2">
                    {formatarData(e.data).slice(0, 5)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </section>
  )
}

export function PaginaPainel() {
  const { empresa, papel } = useEmpresaAtiva()
  const caixa = useCaixaDoPainel()
  const pessoas = usePessoasDoPainel()
  const fluxo = caixa.data
    ? montarFluxo(caixa.data.ano, caixa.data.saldoInicial, caixa.data.categorias, caixa.data.lancamentos)
    : null

  return (
    <div className="flex flex-col gap-7">
      <CabecalhoDaPagina rotulo={empresa.nome} titulo="Visão geral" />
      {podeVerCaixa(papel) &&
        (caixa.isPending ? (
          <Esqueleto />
        ) : caixa.isError ? (
          <Aviso tom="erro">Não foi possível carregar o caixa agora. Atualize a página para tentar de novo.</Aviso>
        ) : (
          fluxo && <BlocoDoCaixa fluxo={fluxo} />
        ))}
      {podeVerPessoas(papel) &&
        (pessoas.isPending ? (
          <Esqueleto />
        ) : pessoas.isError ? (
          <Aviso tom="erro">Não foi possível carregar as pessoas agora. Atualize a página para tentar de novo.</Aviso>
        ) : (
          pessoas.data && <BlocoDePessoas dados={pessoas.data} />
        ))}
    </div>
  )
}
