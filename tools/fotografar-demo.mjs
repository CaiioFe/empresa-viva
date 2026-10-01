// Fotografa as telas da demonstração para o roteiro em PDF.
// Uso: com o app rodando (npm run dev, porta 5174) e o banco em modo de demonstração:
//   node tools/fotografar-demo.mjs [pasta-de-saida]
// Entra pelos botões da demonstração (usuários inventados, senha pública da demo) e NÃO grava nada:
// não responde DISC, não cria convite, não importa planilha.

import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SAIDA = process.argv[2] ?? 'scratch/prints'
// Endereço do app: o local (padrão) ou o publicado, ex.: node tools/fotografar-demo.mjs pasta https://empresa-viva.vercel.app
const BASE = process.argv[3] ?? 'http://localhost:5174'
// URL e chave PÚBLICA do banco (as mesmas do .env.local), para consultar ids pela sessão do usuário da demo
const ENV = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
)
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
mkdirSync(SAIDA, { recursive: true })

const porta = 9300 + Math.floor(Math.random() * 400)
const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${porta}`, `--user-data-dir=${process.env.TEMP}/ev-cdp-${porta}`, 'about:blank'],
  { stdio: 'ignore' },
)
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

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

const ws = new WebSocket(alvo.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))
let seq = 0
const pendentes = new Map()
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pendentes.has(m.id)) {
    pendentes.get(m.id)(m)
    pendentes.delete(m.id)
  }
}
const cdp = (method, params = {}) =>
  new Promise((res) => {
    const id = ++seq
    pendentes.set(id, res)
    ws.send(JSON.stringify({ id, method, params }))
  })
async function avaliar(expr) {
  const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? 'erro no avaliar')
  return r.result?.result?.value
}

async function tela(largura, altura, celular = false) {
  await cdp('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: 2, mobile: celular })
}
async function ir(caminho, espera = 3500) {
  await cdp('Page.navigate', { url: BASE + caminho })
  await esperar(espera)
}
/** Espera aparecer um texto na página (até 15 s). */
async function aguardarTexto(texto) {
  for (let i = 0; i < 60; i++) {
    if (await avaliar(`document.body.innerText.toLowerCase().includes(${JSON.stringify(texto.toLowerCase())})`)) return
    await esperar(250)
  }
  throw new Error(`Não apareceu: ${texto}`)
}
async function clicarNoTexto(texto, seletor = 'button, a') {
  const ok = await avaliar(`(() => {
    const el = [...document.querySelectorAll(${JSON.stringify(seletor)})].find((e) => e.innerText.trim().startsWith(${JSON.stringify(texto)}))
    if (!el) return false
    el.click()
    return true
  })()`)
  if (!ok) throw new Error(`Não achei para clicar: ${texto}`)
}
/** Rola até o título (h1, h2, h3) que começa com o texto, deixando uma folga em cima. */
async function rolarAte(texto, folga = 24) {
  await avaliar(`(() => {
    const el = [...document.querySelectorAll('h1, h2, h3')].find((e) => e.innerText.trim().toLowerCase().startsWith(${JSON.stringify(texto.toLowerCase())}))
    if (!el) throw new Error('titulo nao achado: ' + ${JSON.stringify(texto)})
    const alvo = el.closest('section') ?? el
    window.scrollTo(0, alvo.getBoundingClientRect().top + window.scrollY - ${folga})
  })()`)
  await esperar(700)
}
async function foto(nome) {
  const r = await cdp('Page.captureScreenshot', { format: 'png' })
  writeFileSync(join(SAIDA, `${nome}.png`), Buffer.from(r.result.data, 'base64'))
  console.log('ok', nome)
}
async function sair() {
  if (!(await avaliar('location.origin')).startsWith('http')) await ir('/entrar', 1500)
  await avaliar('localStorage.clear(); sessionStorage.clear(); true')
  await ir('/entrar')
}
async function entrarComo(papel) {
  await sair()
  await aguardarTexto('Demonstração: entre como')
  await clicarNoTexto(papel, 'button')
  await esperar(4500)
  // o tour guiado abre sozinho na primeira visita: fecha para as fotos saírem limpas
  await avaliar("document.querySelector('[role=dialog]') && window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); true")
  await esperar(300)
}
/** Consulta a API do banco com a sessão do usuário logado no app (a trava de acesso vale igual). */
async function rest(caminho) {
  return avaliar(`(async () => {
    const sessao = JSON.parse(localStorage.getItem('empresa-viva-sessao') ?? '{}')
    const r = await fetch(${JSON.stringify(ENV.VITE_SUPABASE_URL + '/rest/v1/')} + ${JSON.stringify(caminho)}, {
      headers: { apikey: ${JSON.stringify(ENV.VITE_SUPABASE_ANON_KEY)}, Authorization: 'Bearer ' + sessao.access_token, 'Accept-Profile': 'empresa_viva' },
    })
    return r.json()
  })()`)
}

await cdp('Page.enable')
await cdp('Runtime.enable')
await tela(1440, 900)

try {
  await sair()
  await aguardarTexto('Demonstração: entre como')
  await foto('01-entrar')

  // Dono
  await entrarComo('Dono')
  await aguardarTexto('O que mais subiu')
  await foto('02-painel-dono')
  await rolarAte('Pessoas')
  await foto('03-painel-dono-pessoas')

  await ir('/caixa', 5000)
  await aguardarTexto('Margem de caixa mês a mês')
  await foto('04-caixa-topo')
  await rolarAte('Fluxo de caixa de')
  await foto('05-caixa-tabela')
  await rolarAte('Comparar mês')
  await foto('06-caixa-comparar')
  await rolarAte('Curva 80/20')
  await foto('07-caixa-curva')

  await ir('/caixa/lancamentos?ano=2026&mes=todos&categoria=sem', 5000)
  await foto('08-fila-sem-categoria')
  await ir('/caixa/importar')
  await foto('09-importar')

  await ir('/pessoas', 4500)
  await aguardarTexto('Marcos Tavares')
  await foto('10-pessoas')

  const colaboradores = await rest('colaboradores?select=id,nome&nome=in.(%22Marcos%20Tavares%22,%22Cl%C3%A1udia%20Reis%22,%22Pedro%20Lins%22)')
  const ids = Object.fromEntries(colaboradores.map((c) => [c.nome, c.id]))
  const convites = await rest(`disc_convites?select=token&respondido_em=is.null&colaborador_id=eq.${ids['Marcos Tavares']}`)
  const token = convites[0]?.token ?? null

  await ir(`/pessoas/${ids['Marcos Tavares']}`, 4500)
  await foto('11-ficha-marcos')
  await ir(`/pessoas/${ids['Cláudia Reis']}`, 4500)
  await foto('12-ficha-claudia')
  await rolarAte('Perfil DISC', 80)
  await foto('13-ficha-claudia-disc')
  await ir(`/pessoas/${ids['Pedro Lins']}`, 4500)
  await foto('14-ficha-pedro')

  // DISC no celular (só abre, não responde)
  if (token) {
    await tela(390, 844, true)
    await ir(`/disc/${token}`, 4000)
    await foto('15-disc-celular-inicio')
    await clicarNoTexto('Começar', 'button')
    await esperar(800)
    await foto('16-disc-celular-pergunta')
    await tela(1440, 900)
  }

  // Financeiro e RH
  await entrarComo('Financeiro')
  await aguardarTexto('O que mais subiu')
  await foto('17-painel-financeiro')
  await entrarComo('RH')
  await aguardarTexto('Pede atenção')
  await foto('18-painel-rh')

  // Consultora
  await entrarComo('Consultora')
  await aguardarTexto('Qual empresa agora?')
  await foto('19-consultora-empresas')
  await clicarNoTexto('Log Bandeirante', 'button')
  await esperar(4500)
  await ir('/caixa', 5000)
  await aguardarTexto('Comparar mês')
  await rolarAte('Comparar mês')
  await foto('20-bandeirante-comparar')

  // Celular: painel do dono
  await entrarComo('Dono')
  await tela(390, 844, true)
  await ir('/', 4500)
  await foto('21-celular-painel')
} finally {
  await sair().catch(() => {})
  ws.close()
  chrome.kill()
}
