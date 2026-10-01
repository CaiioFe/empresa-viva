// Testa de ponta a ponta os fluxos do sistema, pela tela, contra o banco de DEMONSTRAÇÃO.
// Uso: com o app rodando (npm run dev, porta 5174) e o banco em modo de demonstração:
//   node tools/testar-fluxos.mjs [pasta-dos-prints] [endereco-do-app]
// Entra pelos botões da demonstração (usuários inventados, senha pública da demo). Tudo o que cria,
// apaga no fim (pela própria tela ou pela API com a sessão do usuário da demo, com a trava de acesso valendo).
// Imprime "OK <fluxo>" ou "FALHOU <fluxo>: motivo" e, no fim, confere que a demonstração voltou ao estado de antes.

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const SAIDA = process.argv[2] ?? 'scratch/fluxos'
const BASE = process.argv[3] ?? 'http://localhost:5174'
const ENV = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
)
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PLANILHA = resolve('public/planilha-modelo.csv')
const NOME_DE_TESTE = 'Teste Fluxo Automático'
const DESCRICAO_MANUAL = 'Teste fluxo automático manual'
const TRECHO_DA_REGRA = 'Transferência enviada'
const CATEGORIA_DA_REGRA = 'Outras entradas e saídas'
const ETAPA_NOVA = 'Etapa de teste automático'
const ETAPA_RENOMEADA = 'Etapa de teste renomeada'
mkdirSync(SAIDA, { recursive: true })

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- Chrome e CDP

const porta = 9300 + Math.floor(Math.random() * 400)
const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${porta}`, `--user-data-dir=${process.env.TEMP}/ev-fluxos-${porta}`, 'about:blank'],
  { stdio: 'ignore' },
)

/** Ajudantes que vivem dentro da página (injetados em toda navegação). */
const AJUDANTES = `
window.__t = {
  norm: (s) => (s ?? '').replace(/\\s+/g, ' ').trim(),
  secao(titulo) {
    if (!titulo) return document
    const h = [...document.querySelectorAll('section h2, section h3')].find((e) => __t.norm(e.innerText).startsWith(titulo))
    return h ? h.closest('section') : null
  },
  campo(rotulo, escopo = document) {
    const l = [...escopo.querySelectorAll('label')].find((e) => __t.norm(e.innerText) === rotulo)
    return l ? document.getElementById(l.htmlFor) : null
  },
  setar(el, valor) {
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, valor)
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  },
  botao(texto, escopo = document, seletor = 'button, a') {
    return [...escopo.querySelectorAll(seletor)].find((e) => __t.norm(e.innerText).startsWith(texto) || e.getAttribute('aria-label') === texto) ?? null
  },
  clicar(texto, escopo = document, seletor = 'button, a') {
    const el = __t.botao(texto, escopo, seletor)
    if (!el) return 'nao achei: ' + texto
    if (el.disabled) return 'desabilitado: ' + texto
    el.click()
    return 'ok'
  },
  num(s) {
    const t = __t.norm(s).replace(/[^0-9,.-]/g, '')
    if (t === '' || t === '-') return 0
    return Number(t.replace(/\\./g, '').replace(',', '.'))
  },
}
`

class Pagina {
  constructor(ws) {
    this.ws = ws
    this.seq = 0
    this.pendentes = new Map()
    this.ouvintes = []
    this.errosDoConsole = []
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data)
      if (m.id && this.pendentes.has(m.id)) {
        this.pendentes.get(m.id)(m)
        this.pendentes.delete(m.id)
      } else if (m.method) {
        for (const f of this.ouvintes) f(m)
      }
    }
    this.ouvintes.push((m) => {
      if (m.method === 'Page.javascriptDialogOpening') {
        this.ultimoDialogo = m.params.message
        void this.cdp('Page.handleJavaScriptDialog', { accept: true })
      }
      if (m.method === 'Runtime.exceptionThrown') this.errosDoConsole.push(m.params.exceptionDetails?.exception?.description ?? m.params.exceptionDetails?.text)
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
        this.errosDoConsole.push(m.params.args.map((a) => a.value ?? a.description ?? '').join(' '))
      }
    })
  }
  static async abrir(wsUrl) {
    const ws = new WebSocket(wsUrl)
    await new Promise((r, f) => {
      ws.onopen = r
      ws.onerror = f
    })
    const p = new Pagina(ws)
    await p.cdp('Page.enable')
    await p.cdp('Runtime.enable')
    await p.cdp('DOM.enable')
    await p.cdp('Page.addScriptToEvaluateOnNewDocument', { source: AJUDANTES })
    await p.tela(1440, 900)
    return p
  }
  cdp(method, params = {}) {
    return new Promise((res) => {
      const id = ++this.seq
      this.pendentes.set(id, res)
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }
  async avaliar(expr) {
    const r = await this.cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.error) throw new Error(r.error.message)
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'erro no avaliar')
    return r.result?.result?.value
  }
  async tela(largura, altura, celular = false) {
    await this.cdp('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: 1, mobile: celular })
  }
  async ir(caminho, espera = 2500) {
    await this.cdp('Page.navigate', { url: BASE + caminho })
    await esperar(espera)
    await this.garantirAjudantes()
  }
  async garantirAjudantes() {
    const tem = await this.avaliar('typeof window.__t === "object"').catch(() => false)
    if (!tem) await this.avaliar(AJUDANTES)
  }
  /** Espera uma expressão ficar verdadeira (até `ms`). Devolve o valor. */
  async aguardar(expr, descricao, ms = 20000) {
    const fim = Date.now() + ms
    let ultimo
    while (Date.now() < fim) {
      try {
        ultimo = await this.avaliar(expr)
        if (ultimo) return ultimo
      } catch {
        // página trocando
      }
      await esperar(250)
    }
    throw new Error(`não aconteceu: ${descricao}`)
  }
  aguardarTexto(texto, ms) {
    return this.aguardar(`document.body.innerText.toLowerCase().includes(${JSON.stringify(texto.toLowerCase())})`, `aparecer "${texto}"`, ms)
  }
  async temTexto(texto) {
    return this.avaliar(`document.body.innerText.toLowerCase().includes(${JSON.stringify(texto.toLowerCase())})`)
  }
  async clicar(texto, escopo = null, seletor = 'button, a') {
    await this.garantirAjudantes()
    const r = await this.avaliar(`__t.clicar(${JSON.stringify(texto)}, ${escopo ? `__t.secao(${JSON.stringify(escopo)}) ?? document` : 'document'}, ${JSON.stringify(seletor)})`)
    if (r !== 'ok') throw new Error(r)
    await esperar(300)
  }
  /** Preenche um campo pelo rótulo, dentro do card com o título dado. */
  async preencher(rotulo, valor, escopo = null) {
    await this.garantirAjudantes()
    const r = await this.avaliar(`(() => {
      const el = __t.campo(${JSON.stringify(rotulo)}, ${escopo ? `__t.secao(${JSON.stringify(escopo)}) ?? document` : 'document'})
      if (!el) return 'campo nao achado: ' + ${JSON.stringify(rotulo)}
      __t.setar(el, ${JSON.stringify(valor)})
      return 'ok'
    })()`)
    if (r !== 'ok') throw new Error(r)
    await esperar(200)
  }
  /** Escolhe numa seleção a opção cujo texto começa com `texto`. Devolve o value. */
  async escolher(rotulo, texto, escopo = null) {
    const r = await this.avaliar(`(() => {
      const el = __t.campo(${JSON.stringify(rotulo)}, ${escopo ? `__t.secao(${JSON.stringify(escopo)}) ?? document` : 'document'})
      if (!el) return { erro: 'seleção não achada: ' + ${JSON.stringify(rotulo)} }
      const op = [...el.options].find((o) => __t.norm(o.textContent).startsWith(${JSON.stringify(texto)}))
      if (!op) return { erro: 'opção não achada: ' + ${JSON.stringify(texto)} + ' em ' + [...el.options].map((o) => o.textContent).join(' | ') }
      __t.setar(el, op.value)
      return { valor: op.value }
    })()`)
    if (r.erro) throw new Error(r.erro)
    await esperar(300)
    return r.valor
  }
  async foto(nome) {
    const r = await this.cdp('Page.captureScreenshot', { format: 'png' })
    writeFileSync(join(SAIDA, `${nome}.png`), Buffer.from(r.result.data, 'base64'))
  }
  async caminho() {
    return this.avaliar('location.pathname')
  }
  async sair() {
    if (!String(await this.avaliar('location.origin')).startsWith('http')) await this.ir('/entrar', 1500)
    await this.avaliar('localStorage.clear(); sessionStorage.clear(); true')
    await this.ir('/entrar', 2000)
  }
  async entrarComo(papel) {
    await this.sair()
    await this.aguardarTexto('Demonstração: entre como')
    await this.clicar(papel, null, 'button')
    await this.aguardar(`location.pathname !== '/entrar' && !!localStorage.getItem('empresa-viva-sessao')`, `entrar como ${papel}`)
    await esperar(2500)
    this.papel = papel
  }
  /** API do banco com a sessão do usuário logado (a trava de acesso vale igual). */
  async rest(caminho, { metodo = 'GET', corpo, contar = false } = {}) {
    const r = await this.avaliar(`(async () => {
      const sessao = JSON.parse(localStorage.getItem('empresa-viva-sessao') ?? '{}')
      const cab = {
        apikey: ${JSON.stringify(ENV.VITE_SUPABASE_ANON_KEY)},
        Authorization: 'Bearer ' + sessao.access_token,
        'Accept-Profile': 'empresa_viva',
        'Content-Profile': 'empresa_viva',
        'Content-Type': 'application/json',
        Prefer: ${contar ? "'count=exact'" : "'return=representation'"},
      }
      if (${contar}) cab.Range = '0-0'
      const r = await fetch(${JSON.stringify(ENV.VITE_SUPABASE_URL + '/rest/v1/')} + ${JSON.stringify(caminho)}, {
        method: ${JSON.stringify(metodo)},
        headers: cab,
        body: ${corpo === undefined ? 'undefined' : JSON.stringify(JSON.stringify(corpo))},
      })
      const texto = await r.text()
      return { status: r.status, faixa: r.headers.get('content-range'), dados: texto ? JSON.parse(texto) : null }
    })()`)
    if (r.status >= 400) throw new Error(`API ${metodo} ${caminho}: ${r.status} ${JSON.stringify(r.dados)}`)
    if (contar) return Number((r.faixa ?? '').split('/')[1])
    return r.dados
  }
  fechar() {
    this.ws.close()
  }
}

let alvo
for (let i = 0; i < 60 && !alvo; i++) {
  try {
    alvo = (await (await fetch(`http://127.0.0.1:${porta}/json`)).json()).find((t) => t.type === 'page')
  } catch {
    // o Chrome ainda está subindo
  }
  if (!alvo) await esperar(250)
}
if (!alvo) throw new Error('O Chrome não subiu')
const navegador = await Pagina.abrir(alvo.webSocketDebuggerUrl)
const versao = await (await fetch(`http://127.0.0.1:${porta}/json/version`)).json()

/** Abre uma aba num contexto separado (sem nada no localStorage), como um celular de outra pessoa. */
async function abaSemSessao() {
  const bws = new WebSocket(versao.webSocketDebuggerUrl)
  await new Promise((r) => (bws.onopen = r))
  let n = 0
  const pedir = (method, params = {}) =>
    new Promise((res) => {
      const id = ++n
      bws.addEventListener('message', function ouvir(ev) {
        const m = JSON.parse(ev.data)
        if (m.id === id) {
          bws.removeEventListener('message', ouvir)
          res(m.result)
        }
      })
      bws.send(JSON.stringify({ id, method, params }))
    })
  const { browserContextId } = await pedir('Target.createBrowserContext')
  const { targetId } = await pedir('Target.createTarget', { url: 'about:blank', browserContextId })
  const p = await Pagina.abrir(`ws://127.0.0.1:${porta}/devtools/page/${targetId}`)
  p.fecharContexto = async () => {
    p.fechar()
    await pedir('Target.disposeBrowserContext', { browserContextId })
    bws.close()
  }
  return p
}

// ---------------------------------------------------------------- relatório

const resultados = []
const pendenciasDeLimpeza = []
function ok(nome, detalhe = '') {
  resultados.push({ nome, ok: true, detalhe })
  console.log(`OK ${nome}${detalhe ? ` (${detalhe})` : ''}`)
}
function falhou(nome, motivo) {
  resultados.push({ nome, ok: false, motivo })
  console.log(`FALHOU ${nome}: ${motivo}`)
}
async function fluxo(nome, corpo) {
  navegador.errosDoConsole = []
  try {
    const detalhe = await corpo()
    const erros = navegador.errosDoConsole.filter((e) => e && !/Download the React DevTools|favicon/i.test(e))
    if (erros.length > 0) throw new Error(`erro no console: ${erros.slice(0, 2).join(' || ').slice(0, 300)}`)
    ok(nome, detalhe)
  } catch (e) {
    falhou(nome, e.message)
    await navegador.foto(`erro-${nome.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`).catch(() => {})
  }
}
/** Limpa agora; se falhar, guarda para tentar de novo no fim com o papel indicado. */
async function limpar(descricao, papel, acao) {
  try {
    await acao(navegador)
  } catch (e) {
    console.log(`  (limpeza adiada: ${descricao}: ${e.message})`)
    pendenciasDeLimpeza.push({ descricao, papel, acao })
  }
}

const p = navegador
const enc = encodeURIComponent

// ---------------------------------------------------------------- estado da demonstração

/** Fotografia do banco pela consultora (vê as 3 empresas) e pelo dono (vê os membros). */
async function estadoDaDemo() {
  await p.entrarComo('Consultora')
  const empresas = await p.rest('empresas?select=id,nome&order=nome')
  const porEmpresa = {}
  for (const e of empresas) {
    const f = `empresa_id=eq.${e.id}`
    const c = async (t, extra = '') => p.rest(`${t}?select=id&${f}${extra}`, { contar: true })
    const semCategoria = await p.rest(`lancamentos?select=id&${f}&categoria_id=is.null&order=id`)
    porEmpresa[e.nome] = {
      colaboradores: await c('colaboradores'),
      ativos: await c('colaboradores', '&situacao=eq.ativo'),
      lancamentos: await c('lancamentos'),
      semCategoria: semCategoria.map((l) => l.id).join(','),
      qtdSemCategoria: semCategoria.length,
      cargas: (await p.rest(`cargas?select=arquivo,linhas&${f}&order=arquivo`)).map((x) => `${x.arquivo}:${x.linhas}`).join(','),
      regras: (await p.rest(`regras_classificacao?select=contem,categoria_id&${f}&order=contem`)).map((x) => x.contem).join('|'),
      categorias: (await p.rest(`categorias?select=nome,ordem,ativa&${f}&order=nome`)).map((x) => `${x.nome}:${x.ordem}:${x.ativa}`).join('|'),
      etapas: (await p.rest(`etapas_integracao?select=nome,ordem,ativa&${f}&order=ordem`)).map((x) => `${x.nome}:${x.ordem}:${x.ativa}`).join('|'),
      eventos: await c('eventos'),
      progresso: await p.rest(`integracao_progresso?select=colaborador_id&${f}`, { contar: true }),
      convites: await c('disc_convites'),
      resultadosDisc: await c('disc_resultados'),
      saldos: (await p.rest(`saldos_iniciais?select=ano,valor&${f}&order=ano`)).map((x) => `${x.ano}:${x.valor}`).join(','),
    }
  }
  await p.entrarComo('Dono')
  const membros = (await p.rest('membros?select=id,papel,ativo,nome&order=nome')).map((m) => `${m.nome}:${m.papel}:${m.ativo}`).join('|')
  return { empresas: empresas.map((e) => e.nome), porEmpresa, membros }
}

function compararEstados(antes, depois) {
  const diferencas = []
  const a = JSON.parse(JSON.stringify(antes))
  const d = JSON.parse(JSON.stringify(depois))
  if (a.empresas.join() !== d.empresas.join()) diferencas.push(`empresas: ${a.empresas} -> ${d.empresas}`)
  if (a.membros !== d.membros) diferencas.push(`membros: ${a.membros} -> ${d.membros}`)
  for (const [nome, v] of Object.entries(a.porEmpresa)) {
    for (const [k, x] of Object.entries(v)) {
      const y = d.porEmpresa[nome]?.[k]
      if (String(x) !== String(y)) diferencas.push(`${nome}.${k}: ${String(x).slice(0, 120)} -> ${String(y).slice(0, 120)}`)
    }
  }
  return diferencas
}

// ---------------------------------------------------------------- fluxos

const contexto = {}

try {
  const antes = await estadoDaDemo()
  const totalColab = Object.values(antes.porEmpresa).reduce((s, e) => s + e.colaboradores, 0)
  console.log(
    `Estado inicial: ${antes.empresas.length} empresas, ${totalColab} colaboradores, sem categoria por empresa: ${Object.entries(antes.porEmpresa)
      .map(([n, e]) => `${n}=${e.qtdSemCategoria}`)
      .join(', ')}`,
  )

  // Já está como Dono (o estadoDaDemo termina no Dono)
  const empresaDoDono = (await p.rest('empresas?select=id,nome'))[0]
  contexto.empresaDoDono = empresaDoDono

  // a. Importar planilha
  await fluxo('a. Dono · Caixa · Importar e desfazer', async () => {
    const cargasAntes = await p.rest(`cargas?select=id,arquivo&empresa_id=eq.${empresaDoDono.id}`)
    await p.ir('/caixa/importar')
    await p.aguardarTexto('1. Escolha o arquivo')
    const doc = await p.cdp('DOM.getDocument', { depth: -1 })
    const no = await p.cdp('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: 'input[type=file]' })
    await p.cdp('DOM.setFileInputFiles', { nodeId: no.result.nodeId, files: [PLANILHA] })
    await p.aguardarTexto('2. Confira as colunas')
    const mapa = await p.avaliar(`(() => {
      const s = __t.secao('2. Confira as colunas')
      const lido = (r) => { const el = __t.campo(r, s); return el ? __t.norm(el.options[el.selectedIndex]?.textContent) : null }
      return { data: lido('Data'), descricao: lido('Descrição'), modo: lido('Como vem o valor'), valor: lido('Valor') }
    })()`)
    if (!/Data$/.test(mapa.data ?? '') || !/Descrição$/.test(mapa.descricao ?? '') || !/Valor$/.test(mapa.valor ?? '') || !/único/.test(mapa.modo ?? ''))
      throw new Error(`mapeamento sugerido errado: ${JSON.stringify(mapa)}`)
    await p.aguardar(`!!__t.botao('Importar 6', __t.secao('4. Confirme'))`, 'botão Importar 6 lançamentos')
    const previa = await p.avaliar(`(() => {
      const s = __t.secao('3. Confira a prévia')
      const n = (r) => { const dt = [...s.querySelectorAll('dt')].find((d) => __t.norm(d.innerText) === r); return dt ? Number(__t.norm(dt.nextElementSibling.innerText)) : null }
      return { lidas: n('Lidas'), recusadas: n('Recusadas'), linhas: s.querySelectorAll('tbody tr').length, repetida: s.innerText.includes('já foi importada') }
    })()`)
    if (previa.lidas !== 6 || previa.recusadas !== 0 || previa.linhas !== 6) throw new Error(`prévia inesperada: ${JSON.stringify(previa)}`)
    if (previa.repetida) throw new Error('a prévia acusou planilha repetida antes de importar')
    await p.foto('a1-importar-previa')
    await p.clicar('Importar 6', '4. Confirme')
    await p.aguardarTexto('Importação concluída')
    await p.aguardarTexto('6 lançamentos gravados')
    await p.foto('a2-importar-concluida')
    const nova = (await p.rest(`cargas?select=id,arquivo,linhas&empresa_id=eq.${empresaDoDono.id}`)).filter((c) => !cargasAntes.some((x) => x.id === c.id))
    if (nova.length !== 1 || nova[0].linhas !== 6) throw new Error(`carga nova no banco: ${JSON.stringify(nova)}`)
    contexto.cargaNova = nova[0].id
    try {
      await p.ir('/caixa/lancamentos')
      await p.aguardar(`__t.secao('Importações recentes')?.innerText.includes('planilha-modelo.csv')`, 'importação na lista de recentes')
      await p.avaliar(`__t.secao('Importações recentes').scrollIntoView()`)
      await p.foto('a3-importacoes-recentes')
      const r = await p.avaliar(`(() => {
        const li = [...__t.secao('Importações recentes').querySelectorAll('li')].find((l) => l.innerText.includes('planilha-modelo.csv'))
        const b = li && __t.botao('Desfazer esta importação', li)
        if (!b) return 'botão desfazer não achado'
        b.click()
        return 'ok'
      })()`)
      if (r !== 'ok') throw new Error(r)
      await p.aguardarTexto('Importação "planilha-modelo.csv" desfeita.')
      await p.aguardar(`![...__t.secao('Importações recentes').querySelectorAll('li')].some((l) => l.innerText.includes('planilha-modelo.csv'))`, 'sumir da lista de recentes')
      const resta = await p.rest(`cargas?select=id&id=eq.${contexto.cargaNova}`)
      const lanc = await p.rest(`lancamentos?select=id&carga_id=eq.${contexto.cargaNova}`)
      if (resta.length || lanc.length) throw new Error('a carga ou os lançamentos continuaram no banco depois de desfazer')
      if (!/Desfazer a importação "planilha-modelo.csv"/.test(p.ultimoDialogo ?? '')) throw new Error(`pergunta de confirmação inesperada: ${p.ultimoDialogo}`)
      contexto.cargaNova = null
    } finally {
      if (contexto.cargaNova) await limpar('carga de teste', 'Dono', (q) => q.rest(`cargas?id=eq.${contexto.cargaNova}`, { metodo: 'DELETE' }))
    }
    return 'mapeamento, prévia com 6 linhas, gravou e desfez'
  })

  // b. Lançamento manual
  await fluxo('b. Dono · Lançamento manual', async () => {
    const ultima = (await p.rest(`lancamentos?select=data&empresa_id=eq.${empresaDoDono.id}&order=data.desc&limit=1`))[0].data
    const [ano, mesTxt] = ultima.split('-')
    const mes = Number(mesTxt) - 1
    const cats = await p.rest(`categorias?select=id,nome,grupo,ativa,ordem&empresa_id=eq.${empresaDoDono.id}&grupo=eq.pagamentos_operacionais&ativa=is.true&order=ordem`)
    const cat = cats[0]
    const celulaDoFluxo = `(() => { const tr = document.querySelector('tr[data-linha="c-${cat.id}"]'); return tr ? __t.num(tr.querySelectorAll('td')[${mes + 1}].innerText) : 0 })()`
    await p.ir(`/caixa?ano=${ano}`)
    await p.aguardarTexto(`Fluxo de caixa de ${ano}`)
    const antesNoFluxo = await p.avaliar(celulaDoFluxo)

    await p.ir(`/caixa/lancamentos?ano=${ano}&mes=${mes}`)
    await p.clicar('Novo lançamento')
    await p.aguardar(`!!__t.secao('Novo lançamento')`, 'formulário do novo lançamento')
    await p.preencher('Data', ultima, 'Novo lançamento')
    await p.preencher('Descrição', DESCRICAO_MANUAL, 'Novo lançamento')
    await p.preencher('Valor (R$)', '1.234,56', 'Novo lançamento')
    await p.escolher('Tipo', 'Saída', 'Novo lançamento')
    await p.escolher('Categoria', cat.nome, 'Novo lançamento')
    await p.foto('b1-novo-lancamento')
    await p.clicar('Salvar lançamento', 'Novo lançamento')
    await p.aguardarTexto('Lançamento salvo.')
    const gravado = await p.rest(`lancamentos?select=id,valor,categoria_id,origem,data&empresa_id=eq.${empresaDoDono.id}&descricao=eq.${enc(DESCRICAO_MANUAL)}`)
    try {
      if (gravado.length !== 1) throw new Error(`esperava 1 lançamento gravado, veio ${gravado.length}`)
      const g = gravado[0]
      if (Number(g.valor) !== -1234.56 || g.categoria_id !== cat.id || g.origem !== 'manual' || g.data !== ultima)
        throw new Error(`gravado diferente do digitado: ${JSON.stringify(g)}`)
      await p.ir(`/caixa/lancamentos?ano=${ano}&mes=${mes}&busca=${enc('fluxo automático')}`)
      await p.aguardar(`(() => { const tr = [...document.querySelectorAll('tbody tr')].find((t) => t.innerText.includes(${JSON.stringify(DESCRICAO_MANUAL)})); return tr && tr.innerText.includes('manual') && tr.innerText.includes(${JSON.stringify(cat.nome)}) && tr.innerText.includes('1.234,56') })()`, 'lançamento na lista com categoria e valor')
      await p.foto('b2-lista-com-manual')

      await p.ir(`/caixa?ano=${ano}`)
      await p.aguardarTexto(`Fluxo de caixa de ${ano}`)
      await p.aguardar(`Math.abs(${celulaDoFluxo} - ${antesNoFluxo} - 1234.56) < 0.005`, `fluxo do mês somar 1.234,56 em ${cat.nome}`)

      await p.ir(`/caixa/lancamentos?ano=${ano}&mes=${mes}&busca=${enc('fluxo automático')}`)
      await p.aguardarTexto(DESCRICAO_MANUAL)
      const r = await p.avaliar(`(() => {
        const tr = [...document.querySelectorAll('tbody tr')].find((t) => t.innerText.includes(${JSON.stringify(DESCRICAO_MANUAL)}))
        const b = tr && __t.botao('Excluir', tr)
        if (!b) return 'botão Excluir não achado'
        b.click()
        return 'ok'
      })()`)
      if (r !== 'ok') throw new Error(r)
      await p.aguardarTexto('Lançamento excluído.')
      await p.aguardar(`![...document.querySelectorAll('tbody tr')].some((t) => t.innerText.includes(${JSON.stringify(DESCRICAO_MANUAL)}))`, 'sumir da lista')
      const resta = await p.rest(`lancamentos?select=id&empresa_id=eq.${empresaDoDono.id}&descricao=eq.${enc(DESCRICAO_MANUAL)}`)
      if (resta.length) throw new Error('continuou no banco depois de excluir')
      await p.ir(`/caixa?ano=${ano}`)
      await p.aguardarTexto(`Fluxo de caixa de ${ano}`)
      await p.aguardar(`Math.abs(${celulaDoFluxo} - ${antesNoFluxo}) < 0.005`, 'fluxo do mês voltar ao valor de antes')
    } finally {
      await limpar('lançamento manual', 'Dono', (q) => q.rest(`lancamentos?empresa_id=eq.${empresaDoDono.id}&descricao=eq.${enc(DESCRICAO_MANUAL)}`, { metodo: 'DELETE' }))
    }
    return `saída de 1.234,56 em ${cat.nome}, ${mes + 1}/${ano}`
  })

  // c. Fila sem categoria
  await fluxo('c. Dono · Fila sem categoria', async () => {
    const fila = await p.rest(`lancamentos?select=id,data,descricao&empresa_id=eq.${empresaDoDono.id}&categoria_id=is.null&order=data`)
    if (fila.length === 0) throw new Error('a fila está vazia na demonstração')
    const alvoDaFila = fila[0]
    const ano = alvoDaFila.data.slice(0, 4)
    await p.ir(`/caixa/lancamentos?ano=${ano}&mes=todos&categoria=sem`)
    await p.aguardarTexto('Fila sem categoria')
    const seletor = `select[aria-label=${JSON.stringify(`Categoria de ${alvoDaFila.descricao}`)}]`
    await p.aguardar(`!!document.querySelector(${JSON.stringify(seletor)})`, 'linha do lançamento na fila')
    const antes = await p.avaliar(`document.querySelectorAll('select[aria-label^="Categoria de"]').length`)
    await p.foto('c1-fila')
    const escolhida = await p.avaliar(`(() => {
      const el = document.querySelector(${JSON.stringify(seletor)})
      const op = [...el.options].find((o) => o.value)
      __t.setar(el, op.value)
      return { id: op.value, nome: __t.norm(op.textContent) }
    })()`)
    try {
      await p.aguardar(`document.querySelectorAll('select[aria-label^="Categoria de"]').length === ${antes - 1}`, 'sair da fila')
      const g = (await p.rest(`lancamentos?select=categoria_id&id=eq.${alvoDaFila.id}`))[0]
      if (g.categoria_id !== escolhida.id) throw new Error(`no banco ficou ${g.categoria_id}, esperava ${escolhida.id}`)
      await p.foto('c2-fila-depois')
    } finally {
      await limpar('volta da categoria da fila', 'Dono', (q) => q.rest(`lancamentos?id=eq.${alvoDaFila.id}`, { metodo: 'PATCH', corpo: { categoria_id: null } }))
    }
    const depois = await p.rest(`lancamentos?select=id&empresa_id=eq.${empresaDoDono.id}&categoria_id=is.null`)
    if (depois.length !== fila.length) throw new Error(`depois da limpeza a fila ficou com ${depois.length}, esperava ${fila.length}`)
    return `"${alvoDaFila.descricao}" em ${escolhida.nome}`
  })

  // d. Regras
  await fluxo('d. Dono · Categorias e regra', async () => {
    const pendentesAntes = await p.rest(`lancamentos?select=id,descricao&empresa_id=eq.${empresaDoDono.id}&categoria_id=is.null`)
    const regrasAntes = await p.rest(`regras_classificacao?select=id&empresa_id=eq.${empresaDoDono.id}`)
    await p.ir('/caixa/categorias')
    await p.aguardarTexto('Regras de classificação')
    await p.preencher('Se a descrição contém', TRECHO_DA_REGRA, 'Regras de classificação')
    const catId = await p.escolher('Vai para', CATEGORIA_DA_REGRA, 'Regras de classificação')
    const previa = await p.aguardar(
      `(() => { const t = __t.secao('Regras de classificação').innerText; const m = t.match(/classificaria agora (\\d+)/); return m ? Number(m[1]) : (t.includes('Nenhum lançamento sem categoria tem esse trecho') ? -1 : 0) })()`,
      'prévia de quantos a regra classifica',
    )
    await p.foto('d1-regra-previa')
    const esperado = previa === -1 ? 0 : previa
    await p.clicar('Criar regra', 'Regras de classificação')
    let regraNova = null
    try {
      await p.aguardarTexto('Regra criada.')
      const msg = await p.avaliar(`__t.secao('Regras de classificação').innerText.match(/Regra criada\\.[^\\n]*/)?.[0]`)
      await p.foto('d2-regra-criada')
      const regras = await p.rest(`regras_classificacao?select=id,contem,categoria_id&empresa_id=eq.${empresaDoDono.id}`)
      regraNova = regras.find((r) => !regrasAntes.some((x) => x.id === r.id)) ?? null
      if (!regraNova || regraNova.contem !== TRECHO_DA_REGRA || regraNova.categoria_id !== catId) throw new Error(`regra no banco: ${JSON.stringify(regraNova)}`)
      const numeroNaMensagem = /Nenhum lançamento/.test(msg) ? 0 : Number(msg.match(/(\d+) lançamentos? sem categoria/)?.[1] ?? NaN)
      const agora = await p.rest(`lancamentos?select=id&empresa_id=eq.${empresaDoDono.id}&categoria_id=is.null`)
      contexto.classificadosPelaRegra = pendentesAntes.filter((l) => !agora.some((x) => x.id === l.id)).map((l) => l.id)
      if (numeroNaMensagem !== esperado || contexto.classificadosPelaRegra.length !== esperado)
        throw new Error(`prévia ${esperado}, mensagem "${msg}", no banco ${contexto.classificadosPelaRegra.length}`)
      if (!(await p.avaliar(`[...document.querySelectorAll('ul[aria-label="Regras"] li')].some((li) => li.innerText.includes(${JSON.stringify(TRECHO_DA_REGRA)}))`)))
        throw new Error('a regra não apareceu na lista')
      return `classificou ${esperado} (${msg})`
    } finally {
      const ids = contexto.classificadosPelaRegra ?? []
      await limpar('regra de teste', 'Dono', (q) =>
        q.rest(`regras_classificacao?empresa_id=eq.${empresaDoDono.id}&contem=eq.${enc(TRECHO_DA_REGRA)}`, { metodo: 'DELETE' }),
      )
      if (ids.length)
        await limpar('lançamentos classificados pela regra', 'Dono', (q) =>
          q.rest(`lancamentos?id=in.(${ids.join(',')})`, { metodo: 'PATCH', corpo: { categoria_id: null } }),
        )
    }
  })

  // e. Fluxo do ano
  await fluxo('e. Dono · Fluxo do ano', async () => {
    await p.ir('/caixa')
    await p.aguardarTexto('Comparar mês')
    const anoAtual = await p.avaliar(`__t.campo('Ano').value`)
    const tabelaAntes = await p.avaliar(`document.querySelector('table[aria-label^="Fluxo de caixa de"]').innerText`)
    // A demonstração só tem um ano de dados: o seletor mostra só ele. Um ano sem dado entra pela URL
    // (como num link salvo) e aparece no seletor; dali se troca de volta pela tela.
    let anos = await p.avaliar(`[...__t.campo('Ano').options].map((o) => o.value)`)
    let outro = anos.find((a) => a !== anoAtual)
    if (!outro) {
      outro = String(Number(anoAtual) - 1)
      await p.ir(`/caixa?ano=${outro}`)
    } else {
      await p.escolher('Ano', outro)
    }
    await p.aguardarTexto(`${outro}`)
    await p.aguardar(`__t.campo('Ano')?.value === ${JSON.stringify(outro)}`, 'ano novo no seletor')
    const temTabela = await p.avaliar(`!!document.querySelector('table[aria-label="Fluxo de caixa de ${outro}"]')`)
    const vazio = await p.temTexto(`Nenhum lançamento em ${outro}`)
    if (!temTabela && !vazio) throw new Error(`ao trocar para ${outro} não apareceu tabela nem aviso de ano vazio`)
    if (temTabela) {
      const tabelaDepois = await p.avaliar(`document.querySelector('table[aria-label^="Fluxo de caixa de"]').innerText`)
      if (tabelaDepois === tabelaAntes) throw new Error('a tabela não mudou ao trocar o ano')
    }
    if (await p.temTexto('Não foi possível carregar')) throw new Error('erro ao carregar')
    await p.foto('e1-outro-ano')
    anos = await p.avaliar(`[...__t.campo('Ano').options].map((o) => o.value)`)
    if (!anos.includes(anoAtual)) throw new Error(`o seletor perdeu o ano ${anoAtual}: ${anos}`)
    // volta para o ano com mais dado e troca o mês de comparação
    await p.escolher('Ano', anoAtual)
    await p.aguardarTexto(`Fluxo de caixa de ${anoAtual}`)
    await p.aguardarTexto('Comparar mês')
    const mesAntes = await p.avaliar(`__t.campo('Mês', __t.secao('Comparar mês')).value`)
    const curvaAntes = await p.avaliar(`__t.secao('Curva 80/20').innerText`)
    const compAntes = await p.avaliar(`document.querySelector('table[aria-label="Comparação do mês"]').innerText`)
    const novoMes = String(Math.max(Number(mesAntes) - 1, 0) === Number(mesAntes) ? 1 : Number(mesAntes) - 1)
    const nomeDoMes = await p.avaliar(`__t.campo('Mês', __t.secao('Comparar mês')).options[${novoMes}].textContent.toLowerCase()`)
    await p.avaliar(`__t.setar(__t.campo('Mês', __t.secao('Comparar mês')), ${JSON.stringify(novoMes)})`)
    await p.aguardarTexto(`Curva 80/20 de ${nomeDoMes}`)
    const curvaDepois = await p.avaliar(`__t.secao('Curva 80/20').innerText`)
    const compDepois = await p.avaliar(`document.querySelector('table[aria-label="Comparação do mês"]').innerText`)
    if (curvaDepois === curvaAntes) throw new Error('a curva 80/20 não mudou ao trocar o mês')
    if (compDepois === compAntes) throw new Error('a comparação não mudou ao trocar o mês')
    await p.avaliar(`__t.secao('Comparar mês').scrollIntoView()`)
    await p.foto('e2-comparar-e-curva')
    return `ano ${anoAtual} -> ${outro}${vazio ? ' (vazio)' : ''}; mês ${Number(mesAntes) + 1} -> ${Number(novoMes) + 1}`
  })

  // i. Configurações
  await fluxo('i. Dono · Configurações (etapas e papéis)', async () => {
    const etapasAntes = await p.rest(`etapas_integracao?select=id,nome,ordem,ativa&empresa_id=eq.${empresaDoDono.id}&order=ordem`)
    await p.ir('/configuracoes')
    await p.aguardarTexto('Etapas da integração')
    await p.preencher('Nova etapa', ETAPA_NOVA, 'Etapas da integração')
    await p.clicar('Adicionar', 'Etapas da integração')
    const linha = (nome) => `[...__t.secao('Etapas da integração').querySelectorAll('li')].find((li) => li.querySelector('input')?.value === ${JSON.stringify(nome)})`
    let etapaId = null
    const detalhes = []
    try {
      await p.aguardar(`!!${linha(ETAPA_NOVA)}`, 'etapa nova na lista')
      etapaId = (await p.rest(`etapas_integracao?select=id&empresa_id=eq.${empresaDoDono.id}&nome=eq.${enc(ETAPA_NOVA)}`))[0]?.id
      if (!etapaId) throw new Error('etapa não gravada no banco')
      // renomear
      await p.avaliar(`__t.setar(${linha(ETAPA_NOVA)}.querySelector('input'), ${JSON.stringify(ETAPA_RENOMEADA)})`)
      await esperar(300)
      const r1 = await p.avaliar(`__t.clicar('Salvar nome', ${linha(ETAPA_RENOMEADA)})`)
      if (r1 !== 'ok') throw new Error(`renomear: ${r1}`)
      await p.aguardar(`(() => { const li = ${linha(ETAPA_RENOMEADA)}; return li && !__t.botao('Salvar nome', li) })()`, 'nome salvo')
      const g1 = (await p.rest(`etapas_integracao?select=nome,ordem&id=eq.${etapaId}`))[0]
      if (g1.nome !== ETAPA_RENOMEADA) throw new Error(`nome no banco: ${g1.nome}`)
      // reordenar: sobe uma posição
      const posAntes = await p.avaliar(`[...__t.secao('Etapas da integração').querySelectorAll('li')].indexOf(${linha(ETAPA_RENOMEADA)})`)
      const r2 = await p.avaliar(`__t.clicar(${JSON.stringify(`Subir ${ETAPA_RENOMEADA}`)}, ${linha(ETAPA_RENOMEADA)})`)
      if (r2 !== 'ok') throw new Error(`subir: ${r2}`)
      await p.aguardar(`[...__t.secao('Etapas da integração').querySelectorAll('li')].indexOf(${linha(ETAPA_RENOMEADA)}) === ${posAntes - 1}`, 'etapa subir uma posição')
      const ordemBanco = await p.rest(`etapas_integracao?select=id,ordem&empresa_id=eq.${empresaDoDono.id}&order=ordem,nome`)
      if (ordemBanco.findIndex((e) => e.id === etapaId) !== posAntes - 1) throw new Error(`ordem no banco não mudou: ${JSON.stringify(ordemBanco)}`)
      detalhes.push('criou, renomeou, subiu')
      // desativar
      const r3 = await p.avaliar(`__t.clicar('Desativar', ${linha(ETAPA_RENOMEADA)})`)
      if (r3 !== 'ok') throw new Error(`desativar: ${r3}`)
      await p.aguardar(`(${linha(ETAPA_RENOMEADA)})?.innerText.includes('Desativada')`, 'etiqueta Desativada')
      const g3 = (await p.rest(`etapas_integracao?select=ativa&id=eq.${etapaId}`))[0]
      if (g3.ativa !== false) throw new Error('no banco a etapa continuou ativa')
      detalhes.push('desativou')
      await p.foto('i1-etapas')
    } finally {
      if (etapaId) await limpar('etapa de teste', 'Dono', (q) => q.rest(`etapas_integracao?id=eq.${etapaId}`, { metodo: 'DELETE' }))
      else await limpar('etapa de teste', 'Dono', (q) => q.rest(`etapas_integracao?empresa_id=eq.${empresaDoDono.id}&nome=in.(${enc(`"${ETAPA_NOVA}"`)},${enc(`"${ETAPA_RENOMEADA}"`)})`, { metodo: 'DELETE' }))
      for (const e of etapasAntes)
        await limpar(`ordem da etapa ${e.nome}`, 'Dono', (q) => q.rest(`etapas_integracao?id=eq.${e.id}`, { metodo: 'PATCH', corpo: { ordem: e.ordem, nome: e.nome, ativa: e.ativa } }))
    }

    // papéis
    const membros = await p.rest(`membros?select=id,usuario_id,papel,nome&empresa_id=eq.${empresaDoDono.id}`)
    const eu = await p.avaliar(`JSON.parse(localStorage.getItem('empresa-viva-sessao')).user.id`)
    const outro = membros.find((m) => m.usuario_id !== eu)
    if (!outro) {
      detalhes.push('não há outro membro para testar o papel')
      return detalhes.join(', ')
    }
    const novoPapel = outro.papel === 'rh' ? 'financeiro' : 'rh'
    const NOMES = { dono: 'Dono', financeiro: 'Financeiro', rh: 'RH', consultora: 'Consultora' }
    const selDoMembro = `[...__t.secao('Usuários da empresa').querySelectorAll('li')].find((li) => __t.norm(li.querySelector('p')?.innerText) === ${JSON.stringify(outro.nome || 'Sem nome')})?.querySelector('select')`
    try {
      await p.aguardar(`!!${selDoMembro}`, `seleção de papel de ${outro.nome}`)
      await p.avaliar(`__t.setar(${selDoMembro}, ${JSON.stringify(novoPapel)})`)
      await esperar(1500)
      const g = (await p.rest(`membros?select=papel&id=eq.${outro.id}`))[0]
      if (g.papel !== novoPapel) throw new Error(`papel no banco: ${g.papel}, esperava ${novoPapel}`)
      await p.aguardar(`${selDoMembro}.value === ${JSON.stringify(novoPapel)} && !${selDoMembro}.disabled`, 'tela com o papel novo')
      await p.foto('i2-papel-trocado')
      await p.avaliar(`__t.setar(${selDoMembro}, ${JSON.stringify(outro.papel)})`)
      await esperar(1500)
      const v = (await p.rest(`membros?select=papel&id=eq.${outro.id}`))[0]
      if (v.papel !== outro.papel) throw new Error(`não voltou o papel: ${v.papel}`)
      detalhes.push(`${outro.nome}: ${NOMES[outro.papel]} -> ${NOMES[novoPapel]} -> ${NOMES[outro.papel]}`)
    } finally {
      await limpar('papel do membro', 'Dono', (q) => q.rest(`membros?id=eq.${outro.id}`, { metodo: 'PATCH', corpo: { papel: outro.papel } }))
    }
    return detalhes.join(', ')
  })

  // k. Celular
  await fluxo('k. Celular · painel do Dono e menu inferior', async () => {
    await p.tela(390, 844, true)
    try {
      await p.ir('/', 3500)
      await p.aguardarTexto('O que mais subiu')
      await esperar(1000)
      const medidas = await p.avaliar(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bsw: document.body.scrollWidth })`)
      await p.foto('k1-celular-painel')
      if (medidas.sw > medidas.cw || medidas.bsw > medidas.cw) throw new Error(`rolagem lateral no painel: ${JSON.stringify(medidas)}`)
      const menu = `document.querySelector('nav[aria-label="Menu do celular"]')`
      const visivel = await p.avaliar(`(() => { const r = ${menu}?.getBoundingClientRect(); return !!r && r.height > 0 && r.bottom <= innerHeight + 1 })()`)
      if (!visivel) throw new Error('menu inferior não aparece')
      const vistos = []
      for (const [rotulo, rota] of [['Caixa', '/caixa'], ['Pessoas', '/pessoas'], ['Configurações', '/configuracoes'], ['Painel', '/']]) {
        const r = await p.avaliar(`(() => { const a = ${menu}.querySelector('a[aria-label=${JSON.stringify(rotulo)}]'); if (!a) return 'sem ' + ${JSON.stringify(rotulo)}; a.click(); return 'ok' })()`)
        if (r !== 'ok') throw new Error(r)
        await p.aguardar(`location.pathname === ${JSON.stringify(rota)}`, `ir para ${rota}`)
        await p.aguardar(`${menu}.querySelector('a[aria-current="page"]')?.getAttribute('aria-label') === ${JSON.stringify(rotulo)}`, `${rotulo} marcado no menu`)
        await esperar(1200)
        const m = await p.avaliar(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`)
        if (m.sw > m.cw) throw new Error(`rolagem lateral em ${rota}: ${JSON.stringify(m)}`)
        vistos.push(rotulo)
      }
      await p.ir('/caixa', 3000)
      await p.aguardarTexto('Comparar mês')
      await p.foto('k2-celular-caixa')
      const umaPessoa = (await p.rest(`colaboradores?select=id&empresa_id=eq.${empresaDoDono.id}&limit=1`))[0].id
      await p.ir(`/pessoas/${umaPessoa}`, 3000)
      await p.aguardarTexto('Jornada na empresa')
      await esperar(800)
      const mf = await p.avaliar(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`)
      if (mf.sw > mf.cw) throw new Error(`rolagem lateral na ficha: ${JSON.stringify(mf)}`)
      await p.foto('k3-celular-ficha')
      return `sem rolagem lateral; menu: ${vistos.join(', ')}`
    } finally {
      await p.tela(1440, 900)
    }
  })

  // f. RH · Pessoas
  await p.entrarComo('RH')
  await fluxo('f. RH · Pessoas (cadastro, jornada, integração, edição, convite DISC)', async () => {
    const velhos = await p.rest(`colaboradores?select=id&nome=eq.${enc(NOME_DE_TESTE)}`)
    for (const v of velhos) await p.rest(`colaboradores?id=eq.${v.id}`, { metodo: 'DELETE' })
    await p.ir('/pessoas')
    await p.aguardarTexto('Colaboradores')
    await p.clicar('Novo colaborador')
    await p.aguardar(`!!__t.secao('Novo colaborador')`, 'formulário de cadastro')
    await p.preencher('Nome', NOME_DE_TESTE, 'Novo colaborador')
    await p.preencher('Função', 'Auxiliar de teste', 'Novo colaborador')
    await p.preencher('Setor', 'Teste', 'Novo colaborador')
    await p.foto('f1-novo-colaborador')
    await p.clicar('Cadastrar', 'Novo colaborador')
    const id = await p.aguardar(`location.pathname.match(/^\\/pessoas\\/([0-9a-f-]{36})$/)?.[1]`, 'abrir a ficha')
    contexto.colaboradorId = id
    contexto.empresaDoRh = (await p.rest(`colaboradores?select=empresa_id&id=eq.${id}`))[0].empresa_id
    await p.aguardarTexto(NOME_DE_TESTE)
    await p.aguardar(`document.querySelector('ol[aria-label="Jornada"]')?.innerText.includes('Contratado')`, 'jornada com "Contratado"')
    const jornadaInicial = await p.avaliar(`__t.norm(document.querySelector('ol[aria-label="Jornada"]').innerText)`)

    // registrar evento
    await p.clicar('Registrar na jornada', 'Jornada na empresa')
    await p.escolher('Tipo', 'Treinamento', 'Jornada na empresa')
    await p.preencher('O que aconteceu', 'Treinamento de teste automático', 'Jornada na empresa')
    await p.clicar('Registrar', 'Jornada na empresa', 'button[type=submit]')
    await p.aguardar(`document.querySelector('ol[aria-label="Jornada"]')?.innerText.includes('Treinamento de teste automático')`, 'evento na jornada')

    // integração: marca tudo (fecha a integração) e desmarca tudo
    const caixas = `[...__t.secao('Integração').querySelectorAll('input[type=checkbox]')]`
    const total = await p.avaliar(`${caixas}.length`)
    if (total === 0) throw new Error('a empresa não tem etapas de integração para marcar')
    for (let i = 0; i < total; i++) {
      await p.aguardar(`${caixas}.every((c) => !c.disabled)`, 'caixas liberadas')
      await p.avaliar(`${caixas}[${i}].click()`)
      await p.aguardar(`__t.secao('Integração').innerText.includes('${i + 1} de ${total}')`, `${i + 1} de ${total} etapas`)
    }
    await p.aguardar(`__t.secao('Integração').innerText.includes('Concluída')`, 'integração concluída')
    await p.aguardar(`document.querySelector('ol[aria-label="Jornada"]')?.innerText.includes('Integração concluída')`, 'evento "Integração concluída"')
    await p.foto('f2-ficha-integracao-completa')
    for (let i = 0; i < total; i++) {
      await p.aguardar(`${caixas}.every((c) => !c.disabled)`, 'caixas liberadas')
      await p.avaliar(`${caixas}[${i}].click()`)
      await p.aguardar(`__t.secao('Integração').innerText.includes('${total - i - 1} de ${total}')`, `${total - i - 1} de ${total} etapas`)
    }
    const progresso = await p.rest(`integracao_progresso?select=etapa_id&colaborador_id=eq.${id}`)
    if (progresso.length) throw new Error('progresso continuou no banco depois de desmarcar')

    // editar dados
    await p.clicar('Editar dados')
    await p.aguardar(`!!__t.secao('Editar dados')`, 'formulário de edição')
    await p.preencher('Função', 'Auxiliar de teste editado', 'Editar dados')
    await p.preencher('Telefone', '(11) 90000-0000', 'Editar dados')
    await p.clicar('Salvar', 'Editar dados', 'button[type=submit]')
    await p.aguardar(`!__t.secao('Editar dados') && document.body.innerText.includes('Auxiliar de teste editado')`, 'dados editados na ficha')
    const g = (await p.rest(`colaboradores?select=funcao,telefone&id=eq.${id}`))[0]
    if (g.funcao !== 'Auxiliar de teste editado' || g.telefone !== '(11) 90000-0000') throw new Error(`edição no banco: ${JSON.stringify(g)}`)

    // convite DISC
    await p.clicar('Enviar teste DISC', 'Perfil DISC')
    const link = await p.aguardar(`document.querySelector('input[aria-label="Link do teste DISC"]')?.value`, 'link do teste DISC')
    if (!/\/disc\/[A-Za-z0-9_-]{16,}$/.test(link)) throw new Error(`link com formato estranho: ${link}`)
    const whats = await p.avaliar(`__t.botao('Enviar no WhatsApp')?.href ?? ''`)
    if (!whats.startsWith('https://wa.me/5511900000000')) throw new Error(`link do WhatsApp inesperado: ${whats}`)
    contexto.linkDisc = link
    await p.foto('f3-ficha-convite-disc')
    return `ficha aberta, jornada inicial: "${jornadaInicial.slice(0, 60)}", ${total} etapas marcadas e desmarcadas`
  })

  // g. DISC público
  await fluxo('g. DISC público (responder, ficha, link usado)', async () => {
    if (!contexto.linkDisc) throw new Error('sem link (o fluxo f falhou)')
    const caminho = new URL(contexto.linkDisc).pathname
    const aba = await abaSemSessao()
    try {
      await aba.tela(390, 844, true)
      await aba.ir(caminho, 3000)
      const sessao = await aba.avaliar(`localStorage.getItem('empresa-viva-sessao')`)
      if (sessao) throw new Error('a aba do DISC tinha sessão')
      await aba.aguardarTexto('Olá, Teste')
      await aba.foto('g1-disc-inicio')
      await aba.clicar('Começar', null, 'button')
      for (let i = 0; i < 24; i++) {
        await aba.aguardarTexto(`Pergunta ${i + 1} de 24`)
        // varia a letra escolhida para não dar um perfil trivial
        const ordem = [0, 0, 1, 2, 0, 3][i % 6]
        const r = await aba.avaliar(`(() => { const bs = [...document.querySelectorAll('main button[aria-pressed]')]; if (bs.length !== 4) return 'opções: ' + bs.length; bs[${ordem}].click(); return 'ok' })()`)
        if (r !== 'ok') throw new Error(`pergunta ${i + 1}: ${r}`)
        if (i === 11) {
          await aba.foto('g2-disc-pergunta')
          const m = await aba.avaliar(`({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth })`)
          if (m.sw > m.cw) throw new Error(`rolagem lateral no DISC: ${JSON.stringify(m)}`)
        }
        await esperar(150)
      }
      await aba.aguardarTexto('Seu perfil')
      await aba.aguardarTexto('Pronto, o resultado já está na sua ficha.')
      await aba.foto('g3-disc-resultado')

      // ficha do RH
      await p.ir(`/pessoas/${contexto.colaboradorId}`)
      await p.aguardar(`__t.secao('Perfil DISC')?.innerText.includes('respondido em')`, 'perfil DISC na ficha')
      await p.aguardar(`document.querySelector('ol[aria-label="Jornada"]')?.innerText.includes('DISC respondido')`, 'evento "DISC respondido" na jornada')
      await p.foto('g4-ficha-com-disc')
      const res = await p.rest(`disc_resultados?select=predominante,d,i,s,c&colaborador_id=eq.${contexto.colaboradorId}`)
      if (res.length !== 1) throw new Error(`resultados no banco: ${res.length}`)

      // o mesmo link de novo
      await aba.ir(caminho, 3000)
      await aba.aguardarTexto('Este link já foi usado ou não existe')
      await aba.foto('g5-disc-link-usado')
      return `perfil ${res[0].predominante} (D ${res[0].d}, I ${res[0].i}, S ${res[0].s}, C ${res[0].c})`
    } finally {
      await aba.fecharContexto()
    }
  })

  // h. Desligar
  await fluxo('h. RH · Desligar colaborador', async () => {
    if (!contexto.colaboradorId) throw new Error('sem colaborador de teste (o fluxo f falhou)')
    try {
      await p.ir(`/pessoas/${contexto.colaboradorId}`)
      await p.aguardarTexto(NOME_DE_TESTE)
      await p.clicar('Desligar')
      await p.aguardar(`!!__t.secao('Desligar colaborador')`, 'formulário de desligamento')
      await p.preencher('Motivo ou observação', 'Desligamento de teste automático', 'Desligar colaborador')
      await p.clicar('Confirmar desligamento', 'Desligar colaborador')
      await p.aguardar(`!__t.secao('Desligar colaborador') && /Desligado em/.test(document.body.innerText)`, 'etiqueta "Desligado em"')
      await p.aguardar(`document.querySelector('ol[aria-label="Jornada"]')?.innerText.includes('Desligamento de teste automático')`, 'evento de desligamento na jornada')
      if (await p.avaliar(`!!__t.botao('Desligar')`)) throw new Error('o botão Desligar continuou aparecendo')
      if (await p.avaliar(`!!__t.botao('Enviar teste DISC')`)) throw new Error('desligado ainda oferece enviar DISC')
      await p.foto('h1-desligado')
      const g = (await p.rest(`colaboradores?select=situacao,data_saida&id=eq.${contexto.colaboradorId}`))[0]
      if (g.situacao !== 'desligado' || !g.data_saida) throw new Error(`no banco: ${JSON.stringify(g)}`)
      // lista: não aparece entre os ativos, aparece entre os desligados
      await p.ir('/pessoas')
      await p.aguardarTexto('Colaboradores')
      await p.aguardar(`!!document.querySelector('tbody')`, 'lista')
      if (await p.temTexto(NOME_DE_TESTE)) throw new Error('desligado apareceu na lista de ativos')
      await p.escolher('Situação', 'Desligados')
      await p.aguardarTexto(NOME_DE_TESTE)
      return `situação desligado em ${g.data_saida}`
    } finally {
      await limpar('colaborador de teste', 'RH', async (q) => {
        const apagados = await q.rest(`colaboradores?id=eq.${contexto.colaboradorId}`, { metodo: 'DELETE' })
        if (!apagados?.length) throw new Error('nada apagado (trava de acesso?)')
        for (const t of ['eventos', 'integracao_progresso', 'disc_convites', 'disc_resultados']) {
          const sobra = await q.rest(`${t}?select=colaborador_id&colaborador_id=eq.${contexto.colaboradorId}`)
          if (sobra.length) throw new Error(`sobrou ${t}`)
        }
      })
    }
  })

  // j. Permissões
  await fluxo('j. Permissões por papel', async () => {
    const detalhes = []
    await p.entrarComo('Financeiro')
    await p.ir('/pessoas', 3000)
    await p.aguardar(`location.pathname === '/'`, 'Financeiro ser mandado para o painel ao abrir /pessoas')
    if (await p.avaliar(`!!document.querySelector('nav a[href="/pessoas"]')`)) throw new Error('Financeiro vê Pessoas no menu')
    detalhes.push('Financeiro barrado em /pessoas')

    await p.entrarComo('RH')
    await p.ir('/caixa', 3000)
    await p.aguardar(`location.pathname === '/'`, 'RH ser mandado para o painel ao abrir /caixa')
    if (await p.avaliar(`!!document.querySelector('nav a[href="/caixa"]')`)) throw new Error('RH vê Caixa no menu')
    detalhes.push('RH barrado em /caixa')

    await p.entrarComo('Consultora')
    await p.aguardarTexto('Qual empresa agora?')
    const empresas = await p.avaliar(`[...document.querySelectorAll('main ul li button')].map((b) => __t.norm(b.querySelector('span span')?.innerText))`)
    if (empresas.length !== 3) throw new Error(`consultora vê ${empresas.length} empresas: ${empresas}`)
    await p.foto('j1-consultora-empresas')
    await p.clicar('Log Bandeirante', null, 'button')
    await p.aguardar(`location.pathname === '/'`, 'entrar na Log Bandeirante')
    await esperar(1500)
    await p.ir('/caixa/lancamentos', 3500)
    await p.aguardarTexto('Importações recentes')
    if (await p.avaliar(`!!__t.botao('Novo lançamento', document, 'button')`)) throw new Error('consultora vê "Novo lançamento"')
    if (await p.avaliar(`!!__t.botao('Desfazer esta importação', document, 'button')`)) throw new Error('consultora vê "Desfazer esta importação"')
    await p.ir('/pessoas', 3500)
    await p.aguardar(`!!document.querySelector('tbody tr')`, 'lista de pessoas da consultora')
    if (await p.avaliar(`!!__t.botao('Novo colaborador', document, 'button')`)) throw new Error('consultora vê "Novo colaborador"')
    const primeira = await p.avaliar(`document.querySelector('tbody tr a[href^="/pessoas/"]').getAttribute('href')`)
    await p.ir(primeira, 3500)
    await p.aguardarTexto('Jornada na empresa')
    if (!(await p.avaliar(`!!__t.botao('Registrar na jornada', document, 'button')`))) throw new Error('consultora não vê "Registrar na jornada"')
    if (await p.avaliar(`!!__t.botao('Editar dados', document, 'button') || !!__t.botao('Enviar teste DISC', document, 'button')`)) throw new Error('consultora vê botões de edição da ficha')
    await p.foto('j2-consultora-ficha')
    detalhes.push(`consultora: ${empresas.length} empresas, só leitura no caixa e nas pessoas, registra na jornada`)
    return detalhes.join('; ')
  })

  // ------------------------------------------------------------ limpezas adiadas e conferência final
  for (const papel of ['Dono', 'RH', 'Financeiro', 'Consultora']) {
    const minhas = pendenciasDeLimpeza.filter((x) => x.papel === papel)
    if (minhas.length === 0) continue
    await p.entrarComo(papel)
    for (const x of minhas) {
      try {
        await x.acao(p)
        console.log(`  limpeza feita no fim: ${x.descricao}`)
      } catch (e) {
        console.log(`  LIMPEZA FALHOU: ${x.descricao}: ${e.message}`)
      }
    }
  }

  const depois = await estadoDaDemo()
  const diferencas = compararEstados(antes, depois)
  const colabDepois = Object.values(depois.porEmpresa).reduce((s, e) => s + e.colaboradores, 0)
  console.log(
    `Estado final: ${depois.empresas.length} empresas, ${colabDepois} colaboradores, sem categoria por empresa: ${Object.entries(depois.porEmpresa)
      .map(([n, e]) => `${n}=${e.qtdSemCategoria}`)
      .join(', ')}, cargas: ${Object.entries(depois.porEmpresa)
      .map(([n, e]) => `${n}=[${e.cargas}]`)
      .join(' ')}`,
  )
  if (diferencas.length) falhou('Demonstração de volta ao estado original', diferencas.join('; '))
  else ok('Demonstração de volta ao estado original')
  writeFileSync(join(SAIDA, 'estado.json'), JSON.stringify({ antes, depois }, null, 2))
} catch (e) {
  console.log(`ERRO GERAL: ${e.stack ?? e.message}`)
  process.exitCode = 1
} finally {
  await navegador.sair().catch(() => {})
  navegador.fechar()
  chrome.kill()
  const falhas = resultados.filter((r) => !r.ok)
  console.log(`\n${resultados.length - falhas.length} de ${resultados.length} passaram.`)
  if (falhas.length) process.exitCode = 1
}
