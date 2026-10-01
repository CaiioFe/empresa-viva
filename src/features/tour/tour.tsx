import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { MousePointerClick, X } from 'lucide-react'
import { Button } from '@/components/ui'
import type { Passo } from './passos'

/*
  Tour guiado: escurece a tela, recorta um buraco em volta do alvo e mostra um balão com a
  explicação. Nos passos de clique, o buraco é clicável e o próprio clique leva ao próximo passo.
  Fora do buraco, nada é clicável enquanto o tour está aberto. Esc fecha; setas andam.
*/

const FOLGA = 8
const LARGURA_DO_BALAO = 340
const ESPERA_MAXIMA_MS = 5000

type Caixa = { top: number; left: number; width: number; height: number }

function medir(el: Element): Caixa {
  const r = el.getBoundingClientRect()
  return { top: r.top - FOLGA, left: r.left - FOLGA, width: r.width + FOLGA * 2, height: r.height + FOLGA * 2 }
}

const CHAVE = (usuario: string) => `empresa-viva:tour-visto:${usuario}`

export function tourJaVisto(usuario: string): boolean {
  try {
    return localStorage.getItem(CHAVE(usuario)) !== null
  } catch {
    // sem armazenamento, não abre sozinho (evita abrir toda vez)
    return true
  }
}

export function marcarTourVisto(usuario: string) {
  try {
    localStorage.setItem(CHAVE(usuario), '1')
  } catch {
    // navegador sem armazenamento: o tour pode abrir de novo na próxima visita
  }
}

type Props = { passos: Passo[]; aoFechar: () => void }

export function Tour({ passos, aoFechar }: Props) {
  const [indice, setIndice] = useState(0)
  const [caixa, setCaixa] = useState<Caixa | null>(null)
  const alvoRef = useRef<Element | null>(null)
  const balaoRef = useRef<HTMLDivElement>(null)
  const navegar = useNavigate()
  const local = useLocation()
  const passo = passos[indice]
  const ultimo = indice === passos.length - 1

  const avancar = useCallback(() => {
    if (indice >= passos.length - 1) aoFechar()
    else setIndice((i) => i + 1)
  }, [indice, passos.length, aoFechar])

  const voltar = useCallback(() => setIndice((i) => Math.max(0, i - 1)), [])

  // Leva até a rota do passo, se a pessoa estiver em outra tela.
  useEffect(() => {
    if (passo?.rota && local.pathname !== passo.rota) navegar(passo.rota)
    // só quando o passo muda: depois disso quem manda é a pessoa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice])

  // Procura o alvo (a tela pode ainda estar carregando), rola até ele e acompanha rolagem e tamanho.
  useEffect(() => {
    if (!passo) return
    let cancelado = false
    let quadro = 0
    const inicio = Date.now()
    alvoRef.current = null
    setCaixa(null)

    const procurar = () => {
      if (cancelado) return
      const el = passo.alvo()
      if (el) {
        alvoRef.current = el
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        let ultima: Caixa | null = null
        const acompanhar = () => {
          if (cancelado) return
          if (alvoRef.current?.isConnected) {
            const nova = medir(alvoRef.current)
            // só atualiza quando o alvo se mexe de verdade: reescrever a mesma posição a cada quadro
            // reinicia a animação do recorte e ele nunca chega ao lugar
            const mexeu =
              !ultima ||
              Math.abs(nova.top - ultima.top) > 0.5 ||
              Math.abs(nova.left - ultima.left) > 0.5 ||
              Math.abs(nova.width - ultima.width) > 0.5 ||
              Math.abs(nova.height - ultima.height) > 0.5
            if (mexeu) {
              ultima = nova
              setCaixa(nova)
            }
          }
          quadro = requestAnimationFrame(acompanhar)
        }
        acompanhar()
        return
      }
      if (Date.now() - inicio > ESPERA_MAXIMA_MS) {
        avancar() // alvo não existe nesta tela (ex.: empresa sem dados): segue sem travar
        return
      }
      setTimeout(procurar, 120)
    }
    procurar()
    return () => {
      cancelado = true
      cancelAnimationFrame(quadro)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indice, passo])

  // Nos passos de clique, o clique no alvo leva ao próximo passo.
  useEffect(() => {
    if (!passo?.clique) return
    const el = alvoRef.current
    if (!el || !caixa) return
    const aoClicar = () => setTimeout(avancar, 60)
    el.addEventListener('click', aoClicar)
    return () => el.removeEventListener('click', aoClicar)
  }, [passo, caixa !== null, avancar]) // eslint-disable-line react-hooks/exhaustive-deps

  // Teclado: Esc fecha, setas andam (menos nos passos de clique, que pedem o clique).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar()
      else if (e.key === 'ArrowRight' && !passo?.clique) avancar()
      else if (e.key === 'ArrowLeft') voltar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [passo, avancar, voltar, aoFechar])

  // Foco no balão a cada passo, para o leitor de tela ler a explicação.
  useLayoutEffect(() => {
    balaoRef.current?.focus({ preventScroll: true })
  }, [indice])

  if (!passo) return null

  const vw = typeof window === 'undefined' ? 1280 : window.innerWidth
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  const largura = Math.min(LARGURA_DO_BALAO, vw - 32)
  let topoDoBalao = vh / 2 - 100
  let esquerdaDoBalao = vw / 2 - largura / 2
  if (caixa) {
    const cabeAoLado = caixa.left + caixa.width + 14 + largura < vw - 16 && caixa.width < 320 && caixa.height < 120
    if (cabeAoLado) {
      // alvo estreito à esquerda (item do menu): o balão vai ao lado, sem cobrir os outros itens
      topoDoBalao = Math.min(Math.max(16, caixa.top - 8), vh - 240)
      esquerdaDoBalao = caixa.left + caixa.width + 14
    } else {
      const cabeEmbaixo = caixa.top + caixa.height + 16 + 220 < vh
      topoDoBalao = cabeEmbaixo ? caixa.top + caixa.height + 14 : Math.max(16, caixa.top - 14 - 220)
      esquerdaDoBalao = Math.min(Math.max(16, caixa.left), vw - largura - 16)
    }
  }

  const bloqueios = caixa
    ? [
        { top: 0, left: 0, width: vw, height: Math.max(0, caixa.top) },
        { top: caixa.top + caixa.height, left: 0, width: vw, height: Math.max(0, vh - caixa.top - caixa.height) },
        { top: caixa.top, left: 0, width: Math.max(0, caixa.left), height: caixa.height },
        { top: caixa.top, left: caixa.left + caixa.width, width: Math.max(0, vw - caixa.left - caixa.width), height: caixa.height },
      ]
    : [{ top: 0, left: 0, width: vw, height: vh }]

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50" aria-live="polite">
      {bloqueios.map((b, i) => (
        <div key={i} className="pointer-events-auto fixed" style={b} onClick={(e) => e.stopPropagation()} />
      ))}

      {caixa ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-[20px] ring-2 ring-superficie/80"
          style={{ ...caixa, boxShadow: '0 0 0 9999px oklch(0.18 0.01 70 / 0.55)' }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-[oklch(0.18_0.01_70/0.55)]" />
      )}

      <div
        ref={balaoRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        tabIndex={-1}
        className="pointer-events-auto fixed rounded-caixa bg-superficie p-4 shadow-flutua outline-none"
        style={{ top: topoDoBalao, left: esquerdaDoBalao, width: largura }}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold text-apagado">
            Passo {indice + 1} de {passos.length}
          </span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar o tour"
            className="grid size-7 place-items-center rounded-full text-apagado hover:bg-creme hover:text-tinta"
          >
            <X size={15} aria-hidden />
          </button>
        </div>
        <div className="mt-1 flex gap-1" aria-hidden>
          {passos.map((p, i) => (
            <span key={p.id} className={`h-1 flex-1 rounded-full ${i <= indice ? 'bg-tinta' : 'bg-creme'}`} />
          ))}
        </div>
        <h2 id="tour-titulo" className="mt-3 text-[15px] font-extrabold tracking-tight text-tinta">
          {passo.titulo}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-tinta-2">{passo.texto}</p>
        {passo.clique && (
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-acento-claro px-2.5 py-1 text-[11px] font-bold text-acento">
            <MousePointerClick size={13} aria-hidden />
            Clique no destaque para continuar
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={aoFechar} className="text-xs font-semibold text-apagado hover:text-tinta">
            Pular tour
          </button>
          <div className="flex gap-2">
            {indice > 0 && (
              <Button variante="secundario" tamanho="pequeno" onClick={voltar}>
                Voltar
              </Button>
            )}
            <Button
              tamanho="pequeno"
              onClick={() => {
                if (passo.clique && alvoRef.current instanceof HTMLElement) alvoRef.current.click()
                else avancar()
              }}
            >
              {ultimo ? 'Concluir' : 'Próximo'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
