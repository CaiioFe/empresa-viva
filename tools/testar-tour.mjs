// Testa o tour guiado clicando passo a passo. Uso: node tools/testar-tour.mjs <pasta> <endereço> <papel>
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
const PAPEL = process.argv[4] ?? 'Dono'
await tela(1440, 900)
try {
  await sair()
  await aguardarTexto('Demonstração: entre como')
  await avaliar("Object.keys(localStorage).filter(k=>k.startsWith('empresa-viva:tour')).forEach(k=>localStorage.removeItem(k)); true")
  await clicarNoTexto(PAPEL, 'button')
  for (let i = 0; i < 40; i++) {
    if (await avaliar("!!document.querySelector('[role=dialog]')")) break
    await esperar(250)
  }
  let n = 0
  for (let passo = 1; passo <= 20; passo++) {
    await esperar(1400)
    const info = await avaliar(`(() => {
      const d = document.querySelector('[role=dialog]')
      if (!d) return null
      const s = [...document.querySelectorAll('div')].find((x) => x.style.boxShadow && x.style.boxShadow.includes('9999'))
      return { titulo: d.querySelector('h2')?.textContent, contador: d.querySelector('span')?.textContent, clique: d.textContent.includes('Clique no destaque'), temRecorte: !!s, rota: location.pathname }
    })()`)
    if (!info) { console.log('tour fechou no passo', passo); break }
    n++
    console.log(passo, info.rota, '|', info.contador, '|', info.titulo, info.clique ? '(clique)' : '', info.temRecorte ? '' : 'SEM RECORTE')
    await foto(`tour-${String(passo).padStart(2, '0')}`)
    if (info.clique) {
      // clica no próprio alvo, como a pessoa faria
      await avaliar(`(() => { const s = [...document.querySelectorAll('div')].find((x) => x.style.boxShadow && x.style.boxShadow.includes('9999')); const r = s.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); (el.closest('a,button') ?? el).click(); return true })()`)
    } else {
      const ok = await avaliar(`(() => { const b = [...document.querySelectorAll('[role=dialog] button')].find((x) => /Próximo|Concluir/.test(x.textContent)); if (!b) return false; b.click(); return true })()`)
      if (!ok) break
    }
  }
  const aberto = await avaliar("!!document.querySelector('[role=dialog]')")
  const visto = await avaliar("Object.keys(localStorage).some(k=>k.startsWith('empresa-viva:tour-visto'))")
  console.log('passos vistos:', n, '| dialogo aberto no fim:', aberto, '| marcado como visto:', visto)
  // o botão do alto reabre
  await avaliar(`(() => { const b = [...document.querySelectorAll('[data-tour=botao-tour]')].find((e) => e.getBoundingClientRect().width > 0); b.click(); return true })()`)
  await esperar(1500)
  console.log('reabriu pelo botão:', await avaliar("!!document.querySelector('[role=dialog]')"))
} finally {
  await sair().catch(() => {})
  ws.close()
  chrome.kill()
}
