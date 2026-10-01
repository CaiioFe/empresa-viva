import { calcularPerfil, QUESTIONARIO } from './questionario'

test('são 24 perguntas, cada uma com D, I, S e C uma vez só', () => {
  expect(QUESTIONARIO).toHaveLength(24)
  for (const pergunta of QUESTIONARIO) {
    expect(pergunta.opcoes.map((o) => o.letra).sort()).toEqual(['C', 'D', 'I', 'S'])
  }
})

test('a primeira opção não é sempre a mesma letra', () => {
  const primeiras = new Set(QUESTIONARIO.map((q) => q.opcoes[0]!.letra))
  expect(primeiras.size).toBe(4)
})

test('calcula a porcentagem de cada fator e o predominante', () => {
  const respostas = [...Array(12).fill('S'), ...Array(6).fill('C'), ...Array(4).fill('I'), ...Array(2).fill('D')]
  expect(calcularPerfil(respostas)).toEqual({ d: 8, i: 17, s: 50, c: 25, predominante: 'S' })
})

test('empate no topo segue a ordem D, I, S, C', () => {
  const respostas = [...Array(12).fill('I'), ...Array(12).fill('C')]
  expect(calcularPerfil(respostas).predominante).toBe('I')
})
