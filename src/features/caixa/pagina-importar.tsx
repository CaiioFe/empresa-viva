import { useMemo, useState, type ChangeEvent } from 'react'
import { useEmpresaAtiva } from '@/app/sessao'
import { Aviso, Button, CabecalhoDaPagina, Campo, Card, Pill, Selecao, Tabela, Td, Th } from '@/components/ui'
import { formatarDataCompleta, formatarDinheiro } from '@/lib/formatos'
import { podeEditarCaixa } from '@/lib/permissoes'
import { cn } from '@/lib/utils'
import { AbasDoCaixa, Carregando, ErroAoCarregar, LinkDeAcao, mensagemDeErro } from './abas-do-caixa'
import {
  agruparRecusas,
  intervaloDeDatas,
  lerMapeamentoSalvo,
  mesmoCabecalho,
  nomesDoCabecalho,
  pareceRepetida,
  salvarMapeamento,
  SEM_CATEGORIA,
} from './apoio'
import { useCategorias, useImportarCarga, useLancamentosEntre, useRegras } from './api'
import { classificar, contarRepetidas, lerArquivo, lerLinhas, sugerirMapeamento, type Celula, type Mapeamento } from './planilha'

/*
  /caixa/importar (TASK-102): escolher o arquivo, conferir as colunas, ver a prévia e confirmar.
  A leitura e a classificação são funções puras de planilha.ts; a gravação fica em api.ts.
*/

const LINHAS_NA_PREVIA = 20
const RECUSAS_LISTADAS = 8

type Modo = 'unico' | 'duas'
type Lida = { arquivo: string; linhas: Celula[][]; mapa: Mapeamento; modo: Modo; lembrado: boolean }
type Resultado = { gravados: number; semCategoria: number; ano: number }

export function PaginaImportar() {
  const { papel } = useEmpresaAtiva()
  return (
    <div>
      <CabecalhoDaPagina
        rotulo="Caixa"
        titulo="Importar planilha"
        acoes={
          <a
            href="/planilha-modelo.csv"
            download
            className="inline-flex h-10 items-center rounded-lg border border-linha-2 bg-superficie px-4 text-sm font-semibold text-tinta hover:border-tinta"
          >
            Baixar planilha modelo
          </a>
        }
      />
      <AbasDoCaixa />
      {podeEditarCaixa(papel) ? (
        <Importacao />
      ) : (
        <Aviso>
          Só o dono e o financeiro da empresa importam planilhas. Você pode acompanhar o resultado em Fluxo do ano e em
          Lançamentos.
        </Aviso>
      )}
    </div>
  )
}

function Importacao() {
  const { empresa } = useEmpresaAtiva()
  const [lida, setLida] = useState<Lida | null>(null)
  const [lendo, setLendo] = useState(false)
  const [erroDeLeitura, setErroDeLeitura] = useState<string | null>(null)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [chaveDoCampo, setChaveDoCampo] = useState(0)

  const recomecar = () => {
    setLida(null)
    setResultado(null)
    setErroDeLeitura(null)
    setChaveDoCampo((k) => k + 1)
  }

  const aoEscolher = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErroDeLeitura(null)
    setLida(null)
    if (!/\.(xlsx|xls|csv)$/i.test(arquivo.name)) {
      setErroDeLeitura('Esse tipo de arquivo não dá para ler. Use uma planilha .xlsx, .xls ou .csv.')
      return
    }
    setLendo(true)
    try {
      const linhas = await lerArquivo(arquivo)
      if (linhas.length < 2) {
        setErroDeLeitura('A planilha parece vazia: precisa ter o cabeçalho e pelo menos uma linha.')
        return
      }
      let mapa = sugerirMapeamento(linhas)
      let lembrado = false
      const salvo = lerMapeamentoSalvo(empresa.id)
      if (salvo && mesmoCabecalho(salvo.cabecalho, nomesDoCabecalho(linhas, salvo.mapa.cabecalho))) {
        mapa = salvo.mapa
        lembrado = true
      }
      const modo: Modo = mapa.entrada !== null && mapa.saida !== null ? 'duas' : 'unico'
      setLida({ arquivo: arquivo.name, linhas, mapa, modo, lembrado })
    } catch {
      setErroDeLeitura('Não foi possível abrir o arquivo. Confira se ele não está protegido por senha ou corrompido.')
    } finally {
      setLendo(false)
    }
  }

  if (resultado) return <ResultadoDaImportacao resultado={resultado} aoRecomecar={recomecar} />

  return (
    <div className="flex flex-col gap-4">
      <Card titulo="1. Escolha o arquivo">
        <p className="mb-3 text-sm text-tinta-2">
          Exporte o extrato do banco ou o relatório do sistema da empresa em Excel (.xlsx ou .xls) ou CSV. Se tiver dúvida
          do formato, baixe a planilha modelo.
        </p>
        <Campo
          key={chaveDoCampo}
          rotulo="Arquivo da planilha"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => void aoEscolher(e)}
          disabled={lendo}
        />
        {lendo && <p className="mt-2 text-sm text-apagado">Lendo a planilha...</p>}
        {erroDeLeitura && (
          <Aviso tom="erro" className="mt-3">
            {erroDeLeitura}
          </Aviso>
        )}
      </Card>
      {lida && <MapearEConferir lida={lida} aoMudar={setLida} aoConcluir={setResultado} />}
    </div>
  )
}

const letraDaColuna = (i: number) => {
  let n = i
  let letra = ''
  do {
    letra = String.fromCharCode(65 + (n % 26)) + letra
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return letra
}

function MapearEConferir({ lida, aoMudar, aoConcluir }: { lida: Lida; aoMudar: (l: Lida) => void; aoConcluir: (r: Resultado) => void }) {
  const { empresa } = useEmpresaAtiva()
  const regras = useRegras()
  const categorias = useCategorias()
  const importar = useImportarCarga()
  const [erroAoGravar, setErroAoGravar] = useState<string | null>(null)

  const { mapa, modo, linhas } = lida
  const nomes = nomesDoCabecalho(linhas, mapa.cabecalho)
  const mapaDoModo = useMemo<Mapeamento>(
    () => (modo === 'unico' ? { ...mapa, entrada: null, saida: null } : { ...mapa, valor: null }),
    [mapa, modo],
  )

  const lidas = useMemo(() => lerLinhas(linhas, mapaDoModo), [linhas, mapaDoModo])
  const boas = useMemo(
    () =>
      lidas
        .filter((l) => l.ok)
        .map((l) => ({ ...l, categoria_id: classificar(l.descricao, regras.data ?? []) })),
    [lidas, regras.data],
  )
  const recusas = agruparRecusas(lidas)
  const totalRecusadas = recusas.reduce((s, r) => s + r.linhas.length, 0)
  const semCategoria = boas.filter((l) => !l.categoria_id).length

  const intervalo = intervaloDeDatas(boas)
  const existentes = useLancamentosEntre(intervalo?.inicio ?? null, intervalo?.fim ?? null)
  const repetidas = existentes.data ? contarRepetidas(boas, existentes.data) : 0
  const repetida = pareceRepetida(repetidas, boas.length)

  const nomeDe = new Map((categorias.data ?? []).map((c) => [c.id, c.nome]))
  const faltaColuna =
    mapaDoModo.data === null || (modo === 'unico' ? mapaDoModo.valor === null : mapaDoModo.entrada === null || mapaDoModo.saida === null)

  const trocarColuna = (campo: keyof Omit<Mapeamento, 'cabecalho'>, valor: string) =>
    aoMudar({ ...lida, mapa: { ...mapa, [campo]: valor === '' ? null : Number(valor) }, lembrado: false })

  const opcoes = (
    <>
      <option value="">Escolher coluna...</option>
      {nomes.map((n, i) => (
        <option key={i} value={i}>
          {letraDaColuna(i)}: {n || '(sem nome)'}
        </option>
      ))}
    </>
  )

  const confirmar = async () => {
    setErroAoGravar(null)
    try {
      const { gravados } = await importar.mutateAsync({
        arquivo: lida.arquivo,
        mapeamento: mapaDoModo,
        lancamentos: boas.map((l) => ({ data: l.data, descricao: l.descricao, valor: l.valor, categoria_id: l.categoria_id })),
      })
      salvarMapeamento(empresa.id, { cabecalho: nomes, mapa: mapaDoModo })
      aoConcluir({ gravados, semCategoria, ano: Number((intervalo?.fim ?? '').slice(0, 4)) || new Date().getFullYear() })
    } catch (e) {
      setErroAoGravar(`A importação não foi gravada e nada ficou pela metade. ${mensagemDeErro(e)}`)
    }
  }

  return (
    <>
      <Card titulo="2. Confira as colunas">
        {lida.lembrado && (
          <Aviso className="mb-3">Esta planilha tem o mesmo cabeçalho da última importação. Usamos as mesmas colunas de antes.</Aviso>
        )}
        <p className="mb-3 text-sm text-tinta-2">
          Arquivo <strong className="text-tinta">{lida.arquivo}</strong>. Cabeçalho na linha {mapa.cabecalho + 1}. Confira qual
          coluna é cada informação.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Selecao rotulo="Data" value={mapa.data ?? ''} onChange={(e) => trocarColuna('data', e.target.value)}>
            {opcoes}
          </Selecao>
          <Selecao rotulo="Descrição" value={mapa.descricao ?? ''} onChange={(e) => trocarColuna('descricao', e.target.value)}>
            {opcoes}
          </Selecao>
          <Selecao
            rotulo="Como vem o valor"
            value={modo}
            onChange={(e) => aoMudar({ ...lida, modo: e.target.value as Modo, lembrado: false })}
          >
            <option value="unico">Valor único (negativo é saída)</option>
            <option value="duas">Entrada e saída em colunas separadas</option>
          </Selecao>
          {modo === 'unico' ? (
            <Selecao rotulo="Valor" value={mapa.valor ?? ''} onChange={(e) => trocarColuna('valor', e.target.value)}>
              {opcoes}
            </Selecao>
          ) : (
            <>
              <Selecao rotulo="Entrada" value={mapa.entrada ?? ''} onChange={(e) => trocarColuna('entrada', e.target.value)}>
                {opcoes}
              </Selecao>
              <Selecao rotulo="Saída" value={mapa.saida ?? ''} onChange={(e) => trocarColuna('saida', e.target.value)}>
                {opcoes}
              </Selecao>
            </>
          )}
        </div>
      </Card>

      <Card titulo="3. Confira a prévia">
        {regras.error || categorias.error ? (
          <ErroAoCarregar erro={regras.error ?? categorias.error} />
        ) : regras.isPending || categorias.isPending ? (
          <Carregando texto="Carregando as regras de classificação..." />
        ) : (
          <>
            <dl className="mb-4 grid grid-cols-3 gap-2 text-center">
              <Contador rotulo="Lidas" valor={boas.length} />
              <Contador rotulo="Recusadas" valor={totalRecusadas} alerta={totalRecusadas > 0} />
              <Contador rotulo="Sem categoria" valor={semCategoria} alerta={semCategoria > 0} />
            </dl>

            {repetida && (
              <Aviso tom="erro" className="mb-3">
                Parece que esta planilha já foi importada: {repetidas} de {boas.length} linhas já estão gravadas iguais (mesma
                data, valor e descrição). Confira em Lançamentos, na lista de importações recentes, antes de confirmar.
              </Aviso>
            )}

            {recusas.length > 0 && (
              <div className="mb-4 rounded-lg border border-linha bg-creme px-3 py-2 text-sm">
                <p className="font-semibold text-tinta">Linhas que não vão entrar</p>
                <ul className="mt-1 flex flex-col gap-0.5 text-tinta-2">
                  {recusas.map((r) => (
                    <li key={r.motivo}>
                      {r.motivo}: {r.linhas.length === 1 ? 'linha' : 'linhas'} {r.linhas.slice(0, RECUSAS_LISTADAS).join(', ')}
                      {r.linhas.length > RECUSAS_LISTADAS && ` e mais ${r.linhas.length - RECUSAS_LISTADAS}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {boas.length === 0 ? (
              <Aviso tom="erro">Nenhuma linha deu para ler com estas colunas. Confira a escolha no passo 2.</Aviso>
            ) : (
              <>
                <p className="mb-2 text-xs text-apagado">
                  {boas.length > LINHAS_NA_PREVIA
                    ? `As ${LINHAS_NA_PREVIA} primeiras de ${boas.length} linhas lidas.`
                    : `Todas as ${boas.length} linhas lidas.`}{' '}
                  A categoria vem das regras; o que ficar sem categoria vai para a fila em Lançamentos.
                </p>
                <Tabela aria-label="Prévia da importação">
                  <thead>
                    <tr>
                      <Th>Linha</Th>
                      <Th>Data</Th>
                      <Th>Descrição</Th>
                      <Th className="text-right">Valor</Th>
                      <Th>Categoria</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {boas.slice(0, LINHAS_NA_PREVIA).map((l) => (
                      <tr key={l.linha}>
                        <Td className="numero text-apagado">{l.linha}</Td>
                        <Td className="numero whitespace-nowrap">{formatarDataCompleta(l.data)}</Td>
                        <Td className="min-w-40">{l.descricao || <span className="text-apagado">(sem descrição)</span>}</Td>
                        <Td className={cn('numero text-right whitespace-nowrap', l.valor > 0 ? 'text-bom' : 'text-tinta')}>
                          {l.valor > 0 ? '+' : '-'} {formatarDinheiro(Math.abs(l.valor))}
                        </Td>
                        <Td>
                          {l.categoria_id ? (
                            <span className="text-tinta-2">{nomeDe.get(l.categoria_id) ?? 'Categoria'}</span>
                          ) : (
                            <Pill tom="atencao">Sem categoria</Pill>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabela>
              </>
            )}
          </>
        )}
      </Card>

      <Card titulo="4. Confirme">
        {faltaColuna && <p className="mb-3 text-sm text-ruim">Falta escolher a coluna da data e a do valor no passo 2.</p>}
        {erroAoGravar && (
          <Aviso tom="erro" className="mb-3">
            {erroAoGravar}
          </Aviso>
        )}
        <Button
          onClick={() => void confirmar()}
          disabled={faltaColuna || boas.length === 0 || importar.isPending || regras.isPending}
        >
          {importar.isPending
            ? 'Gravando...'
            : `Importar ${boas.length} ${boas.length === 1 ? 'lançamento' : 'lançamentos'}`}
        </Button>
        {totalRecusadas > 0 && (
          <p className="mt-2 text-xs text-apagado">
            As {totalRecusadas} linhas recusadas ficam de fora. Se precisar delas, corrija a planilha e importe de novo.
          </p>
        )}
      </Card>
    </>
  )
}

function Contador({ rotulo, valor, alerta = false }: { rotulo: string; valor: number; alerta?: boolean }) {
  return (
    <div className={cn('rounded-lg border border-linha px-2 py-2', alerta ? 'bg-ambar-claro' : 'bg-superficie')}>
      <dt className="text-xs text-apagado font-medium">{rotulo}</dt>
      <dd className={cn('numero text-[22px] font-semibold tracking-tight', alerta ? 'text-ambar-escuro' : 'text-tinta')}>{valor}</dd>
    </div>
  )
}

function ResultadoDaImportacao({ resultado, aoRecomecar }: { resultado: Resultado; aoRecomecar: () => void }) {
  const { gravados, semCategoria, ano } = resultado
  return (
    <Card titulo="Importação concluída">
      <Aviso tom="sucesso" className="mb-4">
        {gravados === 1 ? '1 lançamento gravado' : `${gravados} lançamentos gravados`}.
        {semCategoria > 0
          ? ` ${semCategoria === 1 ? '1 ficou' : `${semCategoria} ficaram`} sem categoria e ${semCategoria === 1 ? 'espera' : 'esperam'} na fila.`
          : ' Todos já entraram com categoria.'}
      </Aviso>
      <div className="flex flex-wrap gap-2">
        <LinkDeAcao para={`/caixa?ano=${ano}`}>Ver o fluxo do ano</LinkDeAcao>
        {semCategoria > 0 && (
          <LinkDeAcao para={`/caixa/lancamentos?ano=${ano}&mes=todos&categoria=${SEM_CATEGORIA}`} variante="secundario">
            Classificar os sem categoria
          </LinkDeAcao>
        )}
        <Button variante="fantasma" onClick={aoRecomecar}>
          Importar outra planilha
        </Button>
      </div>
    </Card>
  )
}
