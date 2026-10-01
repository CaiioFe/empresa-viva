import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { consulta, consultaCarregando, mutacao } from '@/features/pessoas/dubles-de-teste'
import { useConviteDisc, useResponderDisc } from './api'
import { PaginaDisc } from './pagina-disc'
import { NOME_DO_FATOR, QUESTIONARIO } from './questionario'

vi.mock('./api', () => ({ useConviteDisc: vi.fn(), useResponderDisc: vi.fn() }))

const TOKEN = '3f2a8c1e-4b5d-4e6f-9a7b-1c2d3e4f5a6b'

function abrir() {
  return render(
    <MemoryRouter initialEntries={[`/disc/${TOKEN}`]}>
      <Routes>
        <Route path="/disc/:token" element={<PaginaDisc />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(useConviteDisc).mockReturnValue(consulta({ primeiroNome: 'Ana', respondido: false }))
  vi.mocked(useResponderDisc).mockReturnValue(mutacao() as never)
})

test('boas-vindas com o primeiro nome', () => {
  abrir()
  expect(screen.getByRole('heading', { name: 'Olá, Ana' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Começar' })).toBeInTheDocument()
})

test('percorre as 24 perguntas e manda as 24 letras', async () => {
  const responder = mutacao()
  vi.mocked(useResponderDisc).mockReturnValue(responder as never)
  abrir()
  await userEvent.click(screen.getByRole('button', { name: 'Começar' }))

  const esperadas: string[] = []
  for (const [indice, pergunta] of QUESTIONARIO.entries()) {
    expect(screen.getByText(`Pergunta ${indice + 1} de 24`)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: pergunta.texto })).toBeInTheDocument()
    // escolhe a opção de índice variado, para as letras não saírem todas iguais
    const opcao = pergunta.opcoes[indice % 4]!
    esperadas.push(opcao.letra)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(escapar(opcao.texto)) }))
  }

  expect(responder.mutate).toHaveBeenCalledTimes(1)
  const [{ token, respostas }] = responder.mutate.mock.calls[0] as [{ token: string; respostas: string[] }]
  expect(token).toBe(TOKEN)
  expect(respostas).toHaveLength(24)
  expect(respostas).toEqual(esperadas)
  expect(respostas.every((l) => ['D', 'I', 'S', 'C'].includes(l))).toBe(true)
})

test('voltar deixa trocar a resposta anterior', async () => {
  abrir()
  await userEvent.click(screen.getByRole('button', { name: 'Começar' }))
  const primeira = QUESTIONARIO[0]!
  await userEvent.click(screen.getByRole('button', { name: new RegExp(escapar(primeira.opcoes[0]!.texto)) }))
  expect(screen.getByText('Pergunta 2 de 24')).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
  expect(screen.getByText('Pergunta 1 de 24')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: new RegExp(escapar(primeira.opcoes[0]!.texto)) })).toHaveAttribute('aria-pressed', 'true')
})

test('mostra o resultado depois de enviar', () => {
  vi.mocked(useResponderDisc).mockReturnValue(
    mutacao({ isSuccess: true, data: { d: 20, i: 50, s: 21, c: 9, predominante: 'I' } }) as never,
  )
  abrir()
  expect(screen.getByText(NOME_DO_FATOR.I)).toBeInTheDocument()
  expect(screen.getByText('Pronto, o resultado já está na sua ficha.')).toBeInTheDocument()
})

test('link já usado mostra a mensagem', () => {
  vi.mocked(useConviteDisc).mockReturnValue(consulta({ primeiroNome: 'Ana', respondido: true }))
  abrir()
  expect(screen.getByRole('heading', { name: /este link já foi usado ou não existe/i })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Começar' })).not.toBeInTheDocument()
})

test('link que não existe mostra a mesma mensagem', () => {
  vi.mocked(useConviteDisc).mockReturnValue(consulta(null))
  abrir()
  expect(screen.getByRole('heading', { name: /este link já foi usado ou não existe/i })).toBeInTheDocument()
})

test('banco recusa na hora de enviar (link usado em outro aparelho)', () => {
  vi.mocked(useResponderDisc).mockReturnValue(
    mutacao({ isError: true, error: new Error('Este link já foi usado ou não existe.') }) as never,
  )
  abrir()
  expect(screen.getByRole('heading', { name: /este link já foi usado ou não existe/i })).toBeInTheDocument()
})

test('carregando', () => {
  vi.mocked(useConviteDisc).mockReturnValue(consultaCarregando())
  abrir()
  expect(screen.getByRole('status')).toHaveTextContent('Abrindo o teste...')
})

function escapar(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
