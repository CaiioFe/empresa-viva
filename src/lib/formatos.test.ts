import { describe, expect, it } from 'vitest'
import {
  formatarData,
  formatarDataCompleta,
  formatarDinheiro,
  formatarDinheiroCurto,
  formatarNumero,
  formatarPercentual,
  variacaoPercentual,
} from './formatos'

describe('formatarNumero', () => {
  it('usa ponto de milhar', () => {
    expect(formatarNumero(1284)).toBe('1.284')
    expect(formatarNumero(0)).toBe('0')
    expect(formatarNumero(-1284)).toBe('-1.284')
  })

  it('fixa casas decimais quando pedido', () => {
    expect(formatarNumero(3.5, 1)).toBe('3,5')
    expect(formatarNumero(-0.4, 0)).toBe('0')
  })

  it('mostra "-" pra valor inválido', () => {
    expect(formatarNumero(Number.NaN)).toBe('-')
  })
})

describe('formatarDinheiro', () => {
  it('mostra o valor completo com espaço comum depois do R$', () => {
    expect(formatarDinheiro(512340)).toBe('R$ 512.340,00')
    expect(formatarDinheiro(-512340)).toBe('-R$ 512.340,00')
  })
})

describe('formatarDinheiroCurto', () => {
  it('encurta em mil, mi e bi (CT-002-03)', () => {
    expect(formatarDinheiroCurto(5712400)).toBe('R$ 5,7 mi')
    expect(formatarDinheiroCurto(512340)).toBe('R$ 512 mil')
    expect(formatarDinheiroCurto(1_230_000_000)).toBe('R$ 1,2 bi')
    expect(formatarDinheiroCurto(108_200_000)).toBe('R$ 108 mi')
    expect(formatarDinheiroCurto(1500)).toBe('R$ 1,5 mil')
  })

  it('não encurta abaixo de mil', () => {
    expect(formatarDinheiroCurto(950)).toBe('R$ 950')
    expect(formatarDinheiroCurto(0)).toBe('R$ 0')
  })

  it('sobe de escala quando o arredondamento chega a mil', () => {
    expect(formatarDinheiroCurto(999_960)).toBe('R$ 1 mi')
    expect(formatarDinheiroCurto(999.6)).toBe('R$ 1 mil')
  })

  it('mantém o sinal de negativo', () => {
    expect(formatarDinheiroCurto(-5712400)).toBe('-R$ 5,7 mi')
  })
})

describe('formatarPercentual', () => {
  it('recebe fração', () => {
    expect(formatarPercentual(0.44)).toBe('44%')
    expect(formatarPercentual(1.2)).toBe('120%')
    expect(formatarPercentual(0.4456, 1)).toBe('44,6%')
  })
})

describe('variacaoPercentual', () => {
  it('diz quanto subiu ou desceu', () => {
    expect(variacaoPercentual(112, 100)).toEqual({ texto: '+12%', direcao: 'sobe' })
    expect(variacaoPercentual(96, 100)).toEqual({ texto: '-4%', direcao: 'desce' })
  })

  it('trata igual e período anterior zerado', () => {
    expect(variacaoPercentual(100, 100)).toEqual({ texto: 'igual', direcao: 'igual' })
    expect(variacaoPercentual(1001, 1000)).toEqual({ texto: 'igual', direcao: 'igual' })
    expect(variacaoPercentual(7, 0)).toEqual({ texto: 'novo', direcao: 'sobe' })
    expect(variacaoPercentual(0, 0)).toEqual({ texto: 'igual', direcao: 'igual' })
  })
})

describe('datas', () => {
  it('formata data de calendário sem mudar o dia', () => {
    expect(formatarData('2026-09-15')).toBe('15/09')
    expect(formatarDataCompleta('2026-09-15')).toBe('15/09/2026')
  })

  it('usa o fuso de São Paulo pra data com hora', () => {
    expect(formatarData(new Date('2026-09-15T12:00:00Z'))).toBe('15/09')
    // 02h em UTC ainda é 23h do dia anterior em São Paulo
    expect(formatarDataCompleta('2026-09-16T02:00:00Z')).toBe('15/09/2026')
  })

  it('mostra "-" pra data inválida', () => {
    expect(formatarData('2026-02-31')).toBe('-')
    expect(formatarDataCompleta('ontem')).toBe('-')
  })
})
