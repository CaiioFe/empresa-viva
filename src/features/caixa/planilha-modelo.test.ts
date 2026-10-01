import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Papa from 'papaparse'
import { lerLinhas, sugerirMapeamento } from './planilha'

// A planilha modelo que a tela oferece para baixar tem que importar certo, sem ajuste nenhum.
test('a planilha modelo lê as 6 linhas com as colunas sugeridas', () => {
  const texto = readFileSync(resolve(__dirname, '../../../public/planilha-modelo.csv'), 'utf8')
  const linhas = Papa.parse<string[]>(texto, { skipEmptyLines: true }).data
  const mapa = sugerirMapeamento(linhas)
  expect(mapa).toEqual({ cabecalho: 0, data: 0, descricao: 1, valor: 2, entrada: null, saida: null })
  const lidas = lerLinhas(linhas, mapa)
  expect(lidas).toHaveLength(6)
  expect(lidas.every((l) => l.ok)).toBe(true)
  expect(lidas[0]).toEqual({ ok: true, linha: 2, data: '2026-09-01', descricao: 'Venda no cartão de débito', valor: 1850 })
  expect(lidas[5]).toMatchObject({ valor: -29.9 })
})
