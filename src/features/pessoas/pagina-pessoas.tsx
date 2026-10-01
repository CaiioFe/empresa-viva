import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useEmpresaAtiva } from '@/app/sessao'
import { Button, CabecalhoDaPagina, Campo, Card, Kpi, Pill, Resumo, Selecao, Tabela, Td, Th, Vazio } from '@/components/ui'
import { formatarDataCompleta, formatarNumero, formatarPercentual } from '@/lib/formatos'
import { podeEditarPessoas } from '@/lib/permissoes'
import { useCriarColaborador, usePessoas } from './api'
import { Avatar, Carregando, ErroAoCarregar, QuadradoDisc, erroAoSalvar } from './estados'
import { FormularioColaborador } from './formulario-colaborador'
import {
  filtrarPessoas,
  iniciais,
  resumirPessoas,
  ROTULO_DA_INTEGRACAO,
  setoresDaLista,
  statusDaIntegracao,
  TOM_DA_INTEGRACAO,
  type FiltroDePessoas,
} from './regras'

export function PaginaPessoas() {
  const { papel } = useEmpresaAtiva()
  const navegar = useNavigate()
  const consulta = usePessoas()
  const criar = useCriarColaborador()
  const [cadastrando, setCadastrando] = useState(false)
  const [filtro, setFiltro] = useState<FiltroDePessoas>({ busca: '', setor: '', situacao: 'ativo' })
  const podeEditar = podeEditarPessoas(papel)

  const pessoas = useMemo(() => {
    const total = consulta.data?.totalDeEtapas ?? 0
    return (consulta.data?.pessoas ?? []).map((p) => ({ ...p, status: statusDaIntegracao(total, p.etapasConcluidas) }))
  }, [consulta.data])
  const resumo = useMemo(() => resumirPessoas(pessoas), [pessoas])
  const setores = useMemo(() => setoresDaLista(pessoas), [pessoas])
  const visiveis = useMemo(() => filtrarPessoas(pessoas, filtro), [pessoas, filtro])

  const botaoNovo = podeEditar && !cadastrando && (
    <Button onClick={() => setCadastrando(true)}>
      <Plus size={16} aria-hidden />
      Novo colaborador
    </Button>
  )

  return (
    <div>
      <CabecalhoDaPagina rotulo="Pessoas" titulo="Colaboradores" acoes={botaoNovo} />

      {cadastrando && (
        <Card titulo="Novo colaborador" className="mb-5">
          <FormularioColaborador
            setores={setores}
            textoDoBotao="Cadastrar"
            salvando={criar.isPending}
            erro={criar.isError ? erroAoSalvar(criar.error) : null}
            onCancelar={() => {
              criar.reset()
              setCadastrando(false)
            }}
            onSalvar={(dados) =>
              criar.mutate(dados, {
                onSuccess: (id) => {
                  setCadastrando(false)
                  navegar(`/pessoas/${id}`)
                },
              })
            }
          />
        </Card>
      )}

      {consulta.isPending ? (
        <Carregando texto="Carregando as pessoas..." />
      ) : consulta.isError ? (
        <ErroAoCarregar onTentar={() => void consulta.refetch()} />
      ) : pessoas.length === 0 ? (
        <Vazio
          titulo="Nenhum colaborador ainda"
          texto={
            podeEditar
              ? 'Cadastre a primeira pessoa do time no botão "Novo colaborador". A contratação entra sozinha na jornada dela.'
              : 'Quando o RH ou o Dono cadastrar as pessoas, elas aparecem aqui.'
          }
        />
      ) : (
        <>
          <Resumo className="mb-6">
            <Kpi rotulo="Colaboradores" valor={formatarNumero(resumo.ativos)} detalhe="ativos hoje" />
            <Kpi
              rotulo="Em integração"
              valor={formatarNumero(resumo.emIntegracao)}
              detalhe={resumo.emIntegracao === 1 ? 'com etapa pendente' : 'com etapas pendentes'}
            />
            <Kpi
              rotulo="DISC feito"
              valor={resumo.discFeito === null ? '-' : formatarPercentual(resumo.discFeito)}
              detalhe={resumo.semDisc === 0 ? 'time completo' : 'dos ativos'}
              tendencia={resumo.semDisc === 0 && resumo.ativos > 0 ? 'boa' : 'neutra'}
            />
            <Kpi
              rotulo="Sem DISC"
              valor={formatarNumero(resumo.semDisc)}
              detalhe={resumo.semDisc === 0 ? 'ninguém pendente' : 'mande o teste pela ficha'}
              tendencia={resumo.semDisc > 0 ? 'ruim' : 'boa'}
            />
          </Resumo>

          <Card>
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px_160px]">
              <div className="relative">
                <Campo
                  rotulo="Buscar"
                  type="search"
                  placeholder="Nome da pessoa"
                  value={filtro.busca}
                  onChange={(e) => setFiltro({ ...filtro, busca: e.target.value })}
                  className="pl-8"
                />
                <Search size={15} aria-hidden className="pointer-events-none absolute bottom-[11px] left-2.5 text-apagado" />
              </div>
              <Selecao rotulo="Setor" value={filtro.setor} onChange={(e) => setFiltro({ ...filtro, setor: e.target.value })}>
                <option value="">Todos</option>
                {setores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Selecao>
              <Selecao
                rotulo="Situação"
                value={filtro.situacao}
                onChange={(e) => setFiltro({ ...filtro, situacao: e.target.value as FiltroDePessoas['situacao'] })}
              >
                <option value="ativo">Ativos</option>
                <option value="desligado">Desligados</option>
                <option value="todos">Todos</option>
              </Selecao>
            </div>

            {visiveis.length === 0 ? (
              <p className="py-6 text-center text-sm text-apagado">Ninguém com esse filtro.</p>
            ) : (
              <Tabela>
                <thead>
                  <tr>
                    <Th>Pessoa</Th>
                    <Th className="hidden sm:table-cell">Entrada</Th>
                    <Th>Integração</Th>
                    <Th>DISC</Th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navegar(`/pessoas/${p.id}`)}
                      className="cursor-pointer transition-colors hover:bg-fundo"
                    >
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar iniciais={iniciais(p.nome)} />
                          <div className="min-w-0">
                            <Link
                              to={`/pessoas/${p.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="block leading-tight font-semibold text-tinta hover:text-acento"
                            >
                              {p.nome}
                            </Link>
                            <span className="block text-[11px] text-apagado">
                              {[p.funcao, p.situacao === 'desligado' ? 'desligado' : null].filter(Boolean).join(' · ') || 'Sem função'}
                            </span>
                          </div>
                        </div>
                      </Td>
                      <Td className="hidden whitespace-nowrap text-tinta-2 sm:table-cell">{formatarDataCompleta(p.data_entrada)}</Td>
                      <Td>
                        <Pill tom={TOM_DA_INTEGRACAO[p.status]}>{ROTULO_DA_INTEGRACAO[p.status]}</Pill>
                      </Td>
                      <Td>
                        <QuadradoDisc letra={p.letraDisc} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Tabela>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
