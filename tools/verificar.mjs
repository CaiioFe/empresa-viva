// Conferência de fim de lote da Empresa Viva.
// Uso: npm run verificar (dentro de sistema/). Cole a saída inteira no relatório de fim de lote.
//
// Roda tudo mesmo quando uma etapa falha, pra mostrar o quadro completo de uma vez, e fecha com um
// veredito em português. Testes de banco (pgTAP) não entram aqui: eles pedem o Supabase local e
// rodam no GitHub a cada push (job "banco" do checagens.yml).

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/**
 * Linha de base: falhas que já existiam antes de um lote e ainda não foram resolvidas. Em 28/09/2026
 * não havia nenhuma. Item aqui só sai; incluir falha nova pra
 * "passar" é proibido. Cada item é um trecho do nome do arquivo de teste que falha.
 */
const FALHAS_CONHECIDAS = []

/** Arquivos gerados por ferramenta que trazem o travessão longo e não são nossos. */
const TRAVESSAO_PERMITIDO_EM = new Set(['supabase/config.toml'])

const TRAVESSAO = String.fromCharCode(0x2014)
const BINARIOS = /\.(png|jpe?g|gif|ico|svg|webp|avif|woff2?|ttf|otf|eot|pdf|zip|xlsx|xls)$/i
const semCor = (texto) => texto.replace(new RegExp(String.fromCharCode(27) + '[[][0-9;]*m', 'g'), '')

function rodar(rotulo, comando) {
  process.stdout.write(`\n> ${rotulo}...\n`)
  const inicio = Date.now()
  const r = spawnSync(comando, { shell: true, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return {
    saida: semCor(`${r.stdout ?? ''}${r.stderr ?? ''}`),
    segundos: Math.round((Date.now() - inicio) / 1000),
    ok: r.status === 0,
  }
}

const numero = (texto, padrao) => {
  const achou = texto.match(padrao)
  return achou ? Number(achou[1]) : 0
}

const resumo = []
let bloqueia = false

// 1. Tipos: tem que passar limpo.
const tipos = rodar('Conferindo os tipos (tsc -b)', 'npm run typecheck --silent')
if (tipos.ok) {
  resumo.push(`Tipos: OK, sem erro (${tipos.segundos}s)`)
} else {
  const erros = tipos.saida.split('\n').filter((l) => l.includes('error TS'))
  resumo.push(`Tipos: FALHOU com ${erros.length} erro(s).`)
  console.log(erros.slice(0, 15).join('\n'))
  bloqueia = true
}

// 2. Testes do app: nenhuma falha nova.
const testes = rodar('Rodando os testes do app (vitest)', 'npx vitest run')
const falhos = [...new Set([...testes.saida.matchAll(/FAIL\s+(\S+\.(?:ts|tsx))/g)].map((m) => m[1]))]
const novos = falhos.filter((arquivo) => !FALHAS_CONHECIDAS.some((conhecida) => arquivo.includes(conhecida)))
const passaram = numero(testes.saida, /Tests\s+(?:\d+\s+failed\s+\|\s+)?(\d+)\s+passed/)
const falharam = numero(testes.saida, /Tests\s+(\d+)\s+failed/)
if (testes.ok && falhos.length === 0) {
  resumo.push(`Testes do app: OK, ${passaram} passando (${testes.segundos}s)`)
} else if (falhos.length > 0 && novos.length === 0) {
  resumo.push(`Testes do app: ${falharam} falha(s), todas da linha de base. Nada novo quebrou.`)
} else {
  resumo.push(
    novos.length > 0
      ? `Testes do app: FALHOU. ${falharam} teste(s) com falha, em: ${novos.join(', ')}`
      : 'Testes do app: FALHOU antes de rodar os testes (veja a saída acima).',
  )
  if (novos.length === 0) console.log(testes.saida.split('\n').slice(-25).join('\n'))
  bloqueia = true
}

// 3. Build de produção.
const build = rodar('Montando o build de produção (vite build)', 'npm run build --silent')
if (build.ok) {
  resumo.push(`Build: OK (${build.segundos}s)`)
} else {
  resumo.push('Build: FALHOU.')
  console.log(build.saida.split('\n').slice(-25).join('\n'))
  bloqueia = true
}

// 4 e 5. Varredura dos arquivos do repositório (os versionados e os novos que ainda vão pro commit):
// travessão longo e segredo. O que o .gitignore ignora fica de fora.
const versionados = spawnSync('git ls-files --cached --others --exclude-standard', { shell: true, encoding: 'utf8' })
  .stdout.split(/\r?\n/)
  .filter(Boolean)
  .map((arquivo) => arquivo.replace(/\\/g, '/'))

const comTravessao = []
const comSegredo = []

for (const arquivo of versionados) {
  if (/(^|\/)\.env(\.|$)/.test(arquivo) && !arquivo.endsWith('.env.example')) {
    comSegredo.push(`${arquivo} (arquivo .env versionado)`)
  }
  if (BINARIOS.test(arquivo) || arquivo === 'package-lock.json') continue
  let texto
  try {
    texto = readFileSync(arquivo, 'utf8')
  } catch {
    continue
  }
  const linhas = texto.split(/\r?\n/)
  linhas.forEach((linha, i) => {
    if (linha.includes(TRAVESSAO) && !TRAVESSAO_PERMITIDO_EM.has(arquivo)) {
      comTravessao.push(`${arquivo}:${i + 1}`)
    }
    // Chave secreta nova do Supabase, ou chave JWT com papel service_role. Só aponta o lugar, nunca o valor.
    if (/sb_secret_[A-Za-z0-9_-]{8,}/.test(linha)) comSegredo.push(`${arquivo}:${i + 1} (chave sb_secret)`)
    for (const jwt of linha.match(/eyJ[\w-]{10,}\.(eyJ[\w-]{10,})\.[\w-]{10,}/g) ?? []) {
      try {
        const corpo = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString('utf8'))
        if (corpo.role === 'service_role') comSegredo.push(`${arquivo}:${i + 1} (chave service_role)`)
      } catch {
        // não era JWT de verdade
      }
    }
  })
}

if (comTravessao.length === 0) {
  resumo.push('Travessão longo: OK, nenhum nos arquivos versionados')
} else {
  resumo.push(`Travessão longo: FALHOU em ${comTravessao.length} lugar(es): ${comTravessao.slice(0, 10).join(', ')}`)
  bloqueia = true
}

if (comSegredo.length === 0) {
  resumo.push('Segredo em arquivo: OK, nenhum encontrado')
} else {
  resumo.push(`Segredo em arquivo: FALHOU em ${comSegredo.join(', ')}. Tire do arquivo e troque a chave.`)
  bloqueia = true
}

console.log('\n==============================')
console.log('CONFERÊNCIA DE FIM DE LOTE')
console.log('==============================')
for (const linha of resumo) console.log(`- ${linha}`)
console.log(`- Linha de base: ${FALHAS_CONHECIDAS.length === 0 ? 'zero falhas conhecidas' : FALHAS_CONHECIDAS.join(', ')}`)
console.log('\nFalta conferir na mão (o script não sabe):')
console.log('- Mudou o banco? Migration nova tem teste pgTAP, e o job "banco" do GitHub ficou verde depois do push autorizado?')
console.log('- Cada item do lote ganhou teste cobrindo o critério de aceite?')
console.log('- A tela foi vista em 375px e no computador?')
console.log('- docs/como-testar-*.md e tasks/BACKLOG.md atualizados?')
console.log('- Publicou (só com autorização)? O site no ar usa o mesmo assets/index-*.js do build?')
console.log(bloqueia ? '\nVEREDITO: NÃO PODE ENTREGAR ASSIM.\n' : '\nVEREDITO: pode seguir pro relatório e pro pedido de push.\n')
process.exit(bloqueia ? 1 : 0)
