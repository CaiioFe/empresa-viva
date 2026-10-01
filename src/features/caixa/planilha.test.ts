import { classificar, contarRepetidas, decodificarTexto, lerData, lerLinhas, lerValor, sugerirMapeamento, type Celula } from './planilha'

test('lê CSV em UTF-8 e também no formato do Excel do Windows', () => {
  const utf8 = new TextEncoder().encode('﻿Descrição;Valor').buffer as ArrayBuffer
  expect(decodificarTexto(utf8)).toBe('Descrição;Valor')
  // "Descrição" em windows-1252: ç = 0xE7, ã = 0xE3
  const ansi = new Uint8Array([0x44, 0x65, 0x73, 0x63, 0x72, 0x69, 0xe7, 0xe3, 0x6f]).buffer
  expect(decodificarTexto(ansi)).toBe('Descrição')
})

test('lê data brasileira, ISO, curta e número de série do Excel', () => {
  expect(lerData('15/03/2026')).toBe('2026-03-15')
  expect(lerData('5/3/26')).toBe('2026-03-05')
  expect(lerData('2026-03-15')).toBe('2026-03-15')
  expect(lerData(46096)).toBe('2026-03-15')
  expect(lerData(new Date(2026, 2, 15))).toBe('2026-03-15')
  expect(lerData('31/02/2026')).toBeNull()
  expect(lerData('amanhã')).toBeNull()
})

test('lê valor com vírgula, milhar, parênteses, R$, sinal no fim e D de débito', () => {
  expect(lerValor('1.234,56')).toBe(1234.56)
  expect(lerValor('-1.234,56')).toBe(-1234.56)
  expect(lerValor('(1.234,56)')).toBe(-1234.56)
  expect(lerValor('R$ 1.234,56')).toBe(1234.56)
  expect(lerValor('1234.56')).toBe(1234.56)
  expect(lerValor('1,234.56')).toBe(1234.56)
  expect(lerValor('1.500')).toBe(1500)
  expect(lerValor('350,00-')).toBe(-350)
  expect(lerValor('89,90 D')).toBe(-89.9)
  expect(lerValor(-42.5)).toBe(-42.5)
  expect(lerValor('abc')).toBeNull()
})

test('sugere as colunas pelo nome do cabeçalho, pulando linhas de título', () => {
  const linhas: Celula[][] = [
    ['Extrato de setembro', null, null],
    ['Data', 'Histórico', 'Valor (R$)'],
    ['01/09/2026', 'Venda balcão', '1.200,00'],
  ]
  expect(sugerirMapeamento(linhas)).toEqual({ cabecalho: 1, data: 0, descricao: 1, valor: 2, entrada: null, saida: null })
})

test('entende planilha com entrada e saída separadas', () => {
  const linhas: Celula[][] = [
    ['Dt. Movimento', 'Descrição', 'Entrada', 'Saída'],
    ['02/09/2026', 'Recebimento cliente', '500,00', ''],
    ['03/09/2026', 'Conta de luz', '', '180,00'],
  ]
  const mapa = sugerirMapeamento(linhas)
  expect(mapa).toMatchObject({ data: 0, descricao: 1, valor: null, entrada: 2, saida: 3 })
  const lidas = lerLinhas(linhas, mapa)
  expect(lidas).toEqual([
    { ok: true, linha: 2, data: '2026-09-02', descricao: 'Recebimento cliente', valor: 500 },
    { ok: true, linha: 3, data: '2026-09-03', descricao: 'Conta de luz', valor: -180 },
  ])
})

test('recusa linha sem data ou sem valor com o motivo e pula linha vazia', () => {
  const linhas: Celula[][] = [
    ['Data', 'Descrição', 'Valor'],
    ['sem data', 'x', '10,00'],
    [null, '', ''],
    ['04/09/2026', 'y', 'dez reais'],
    ['05/09/2026', 'z', '0,00'],
  ]
  const lidas = lerLinhas(linhas, sugerirMapeamento(linhas))
  expect(lidas).toEqual([
    { ok: false, linha: 2, motivo: 'Data que não deu para ler' },
    { ok: false, linha: 4, motivo: 'Valor que não deu para ler' },
    { ok: false, linha: 5, motivo: 'Valor zerado' },
  ])
})

test('classifica sem ligar para acento e maiúscula; o trecho mais longo vence', () => {
  const regras = [
    { contem: 'energia', categoria_id: 'instalacoes' },
    { contem: 'energia solar', categoria_id: 'investimentos' },
    { contem: 'FOLHA', categoria_id: 'pessoal' },
  ]
  expect(classificar('Pagamento Folha de Setembro', regras)).toBe('pessoal')
  expect(classificar('ENERGIA SOLAR parcela 3', regras)).toBe('investimentos')
  expect(classificar('Conta de energia', regras)).toBe('instalacoes')
  expect(classificar('Padaria', regras)).toBeNull()
})

test('conta linhas repetidas pela data, valor e descrição', () => {
  const existentes = [{ data: '2026-09-01', valor: -180, descricao: 'Conta de Luz' }]
  const novas = [
    { data: '2026-09-01', valor: -180, descricao: 'conta de luz' },
    { data: '2026-09-02', valor: -180, descricao: 'conta de luz' },
  ]
  expect(contarRepetidas(novas, existentes)).toBe(1)
})
