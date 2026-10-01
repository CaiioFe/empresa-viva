import { moverEtapa, ordenarEtapas, proximaOrdem } from './regras'

const etapas = [
  { id: 'c', nome: 'Sistema', ordem: 3 },
  { id: 'a', nome: 'Boas-vindas', ordem: 1 },
  { id: 'b', nome: 'Segurança', ordem: 2 },
]

test('ordena pela ordem gravada', () => {
  expect(ordenarEtapas(etapas).map((e) => e.id)).toEqual(['a', 'b', 'c'])
})

test('descer troca com a de baixo e grava só as duas', () => {
  expect(moverEtapa(etapas, 'a', 1)).toEqual([
    { id: 'b', ordem: 1 },
    { id: 'a', ordem: 2 },
  ])
})

test('subir a primeira ou descer a última não muda nada', () => {
  expect(moverEtapa(etapas, 'a', -1)).toEqual([])
  expect(moverEtapa(etapas, 'c', 1)).toEqual([])
})

test('ordens repetidas no banco são arrumadas ao mover', () => {
  const repetidas = [
    { id: 'x', nome: 'A', ordem: 0 },
    { id: 'y', nome: 'B', ordem: 0 },
  ]
  expect(moverEtapa(repetidas, 'y', -1)).toEqual([
    { id: 'y', ordem: 1 },
    { id: 'x', ordem: 2 },
  ])
})

test('etapa nova vai para o fim', () => {
  expect(proximaOrdem(etapas)).toBe(4)
  expect(proximaOrdem([])).toBe(1)
})
