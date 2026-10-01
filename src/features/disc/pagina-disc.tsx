import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { LetraDisc } from '@/lib/tipos'
import { cn } from '@/lib/utils'
import { Marca } from '@/components/layout/app-shell'
import { useConviteDisc, useResponderDisc } from './api'
import { PerfilDisc } from './perfil'
import { QUESTIONARIO } from './questionario'
import { ehLinkUsado, progresso } from './regras'

/*
  Teste DISC público (/disc/:token): sem login, fora da casca do app, pensado para o celular.
  Boas-vindas, uma pergunta por tela, envio e resultado. Mesmo visual do sistema (ver DESIGN.md).
*/

const TOTAL = QUESTIONARIO.length
const CHAVES = ['A', 'B', 'C', 'D']

function Moldura({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-fundo text-tinta">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-5 pt-6 pb-10">
        <Marca />
        <div className="flex flex-1 flex-col justify-center py-8">{children}</div>
        <p className="text-center text-xs text-apagado font-medium">
          Questionário DISC · Maestria
        </p>
      </div>
    </main>
  )
}

function LinkIndisponivel() {
  return (
    <Moldura>
      <h1 className="text-titulo leading-tight font-semibold tracking-tight">Este link já foi usado ou não existe</h1>
      <p className="mt-3 text-[15px] text-tinta-2">
        Cada link do teste vale para uma resposta só. Se você ainda não respondeu, peça um link novo para quem mandou.
      </p>
    </Moldura>
  )
}

function BotaoGrande({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-8 h-14 w-full rounded-xl bg-grafite text-base font-semibold text-white transition-colors hover:bg-acento disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export function PaginaDisc() {
  const { token = '' } = useParams()
  const convite = useConviteDisc(token)
  const responder = useResponderDisc()
  const [etapa, setEtapa] = useState<'inicio' | 'perguntas'>('inicio')
  const [atual, setAtual] = useState(0)
  const [respostas, setRespostas] = useState<(LetraDisc | undefined)[]>(() => Array<LetraDisc | undefined>(TOTAL).fill(undefined))

  function enviar(lista: (LetraDisc | undefined)[]) {
    const completas = lista.filter((l): l is LetraDisc => l !== undefined)
    if (completas.length !== TOTAL) return
    responder.mutate({ token, respostas: completas })
  }

  function escolher(letra: LetraDisc) {
    const novas = [...respostas]
    novas[atual] = letra
    setRespostas(novas)
    if (atual < TOTAL - 1) setAtual(atual + 1)
    else enviar(novas)
  }

  function voltar() {
    if (atual === 0) setEtapa('inicio')
    else setAtual(atual - 1)
  }

  if (convite.isPending) {
    return (
      <Moldura>
        <p role="status" className="text-center text-sm text-apagado">
          Abrindo o teste...
        </p>
      </Moldura>
    )
  }

  if (convite.isError) {
    return (
      <Moldura>
        <h1 className="text-titulo leading-tight font-semibold tracking-tight">Não deu para abrir o teste</h1>
        <p className="mt-3 text-[15px] text-tinta-2">Confira a internet e tente de novo.</p>
        <BotaoGrande onClick={() => void convite.refetch()}>Tentar de novo</BotaoGrande>
      </Moldura>
    )
  }

  // resultado recém-enviado vem antes de "já respondido": depois de responder, o convite passa a constar como usado
  if (responder.isSuccess) {
    return (
      <Moldura>
        <p className="text-xs text-acento font-medium">Seu perfil</p>
        <div className="mt-3">
          <PerfilDisc resultado={responder.data} grande />
        </div>
        <p className="mt-8 border-t border-dashed border-linha-2 pt-5 text-[15px] font-semibold text-tinta">
          Pronto, o resultado já está na sua ficha.
        </p>
        <p className="mt-1 text-sm text-tinta-2">Pode fechar esta página. Obrigado pelo seu tempo.</p>
      </Moldura>
    )
  }

  if (!convite.data || convite.data.respondido || (responder.isError && ehLinkUsado(responder.error))) {
    return <LinkIndisponivel />
  }

  if (responder.isPending) {
    return (
      <Moldura>
        <p role="status" className="text-center text-sm text-apagado">
          Enviando as suas respostas...
        </p>
      </Moldura>
    )
  }

  if (responder.isError) {
    return (
      <Moldura>
        <h1 className="text-titulo leading-tight font-semibold tracking-tight">Suas respostas não foram enviadas</h1>
        <p className="mt-3 text-[15px] text-tinta-2">
          Elas continuam guardadas aqui. Confira a internet e toque para enviar de novo.
        </p>
        <BotaoGrande onClick={() => enviar(respostas)}>Enviar de novo</BotaoGrande>
      </Moldura>
    )
  }

  if (etapa === 'inicio') {
    return (
      <Moldura>
        <h1 className="text-titulo leading-[1.05] font-semibold tracking-tight">
          {convite.data.primeiroNome ? `Olá, ${convite.data.primeiroNome}` : 'Olá'}
        </h1>
        <p className="mt-4 text-[15.5px] leading-relaxed text-tinta-2">
          Este é um teste rápido sobre o seu jeito de trabalhar. São {TOTAL} situações do dia a dia, cada uma com quatro
          respostas. Escolha a que mais parece com você.
        </p>
        <p className="mt-3 text-[15.5px] leading-relaxed text-tinta-2">
          Não existe resposta certa ou errada. Leva cerca de 5 minutos e você pode voltar para mudar uma resposta.
        </p>
        <BotaoGrande onClick={() => setEtapa('perguntas')}>Começar</BotaoGrande>
      </Moldura>
    )
  }

  const pergunta = QUESTIONARIO[atual]
  if (!pergunta) return <LinkIndisponivel />
  const escolhida = respostas[atual]
  const pct = progresso(atual, TOTAL)

  return (
    <Moldura>
      <div className="flex items-center gap-3">
        <span className="text-xs whitespace-nowrap text-apagado font-medium">
          Pergunta {atual + 1} de {TOTAL}
        </span>
        <span
          role="progressbar"
          aria-label="Progresso do teste"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-areia"
        >
          <span className="absolute inset-y-0 left-0 bg-ambar transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </span>
      </div>

      <h1 key={atual} className="mt-7 text-titulo leading-[1.15] font-semibold tracking-tight">
        {pergunta.texto}
      </h1>

      <div className="mt-6 flex flex-col gap-2.5">
        {pergunta.opcoes.map((opcao, indice) => (
          <button
            key={opcao.letra}
            type="button"
            onClick={() => escolher(opcao.letra)}
            aria-pressed={escolhida === opcao.letra}
            className={cn(
              'flex min-h-14 w-full items-center gap-3.5 rounded-xl border bg-superficie px-4 py-3.5 text-left text-[15px] font-medium text-tinta-2 transition-colors hover:border-acento hover:text-tinta',
              escolhida === opcao.letra ? 'border-ambar text-tinta ring-2 ring-ambar/30' : 'border-linha-2',
            )}
          >
            <span aria-hidden className="w-3.5 shrink-0 text-xs text-apagado font-medium">
              {CHAVES[indice]}
            </span>
            {opcao.texto}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={voltar}
        className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-tinta-2 hover:text-tinta"
      >
        <ArrowLeft size={15} aria-hidden />
        Voltar
      </button>
    </Moldura>
  )
}
