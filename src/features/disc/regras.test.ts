import { ehLinkUsado, pareceToken, progresso } from './regras'

test('só uuid parece token', () => {
  expect(pareceToken('3f2a8c1e-4b5d-4e6f-9a7b-1c2d3e4f5a6b')).toBe(true)
  expect(pareceToken('abc')).toBe(false)
  expect(pareceToken('')).toBe(false)
})

test('reconhece o aviso de link usado que vem do banco', () => {
  expect(ehLinkUsado(new Error('Este link já foi usado ou não existe.'))).toBe(true)
  expect(ehLinkUsado(new Error('Failed to fetch'))).toBe(false)
  expect(ehLinkUsado(null)).toBe(false)
})

test('progresso em porcentagem', () => {
  expect(progresso(0, 24)).toBe(0)
  expect(progresso(12, 24)).toBe(50)
  expect(progresso(30, 24)).toBe(100)
  expect(progresso(1, 0)).toBe(0)
})
