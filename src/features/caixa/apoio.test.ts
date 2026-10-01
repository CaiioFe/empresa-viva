import type { Categoria } from '@/lib/tipos'
import {
  agruparRecusas,
  anoPadrao,
  anosDoSeletor,
  emBlocos,
  filtrarLancamentos,
  intervaloDeDatas,
  lerMapeamentoSalvo,
  mesPadrao,
  mesmoCabecalho,
  mover,
  nomesDoCabecalho,
  pareceRepetida,
  pendentesQueBatem,
  proximaOrdem,
  salvarMapeamento,
  SEM_CATEGORIA,
  textoDaVariacao,
  TODAS,
  valorComSinal,
} from './apoio'

test('quebra a lista em blocos do tamanho pedido', () => {
  expect(emBlocos([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
  expect(emBlocos([], 500)).toEqual([])
  expect(() => emBlocos([1], 0)).toThrow()
})

test('ano padrão: o atual, ou o último com dado quando o atual está vazio', () => {
  expect(anoPadrao(null, null, 2026)).toBe(2026)
  expect(anoPadrao('2024-01-10', '2025-12-20', 2026)).toBe(2025)
  expect(anoPadrao('2025-01-10', '2026-03-01', 2026)).toBe(2026)
  expect(anoPadrao('2027-01-10', '2027-03-01', 2026)).toBe(2027)
})

test('anos do seletor vão do mais novo ao mais velho', () => {
  expect(anosDoSeletor('2024-05-01', '2025-02-01', 2023, 2026)).toEqual([2026, 2025, 2024, 2023])
  expect(anosDoSeletor(null, null, null, 2026)).toEqual([2026])
})

test('mês padrão: o da última data quando é do ano; senão dezembro ou o mês de hoje', () => {
  const hoje = new Date(2026, 8, 28)
  expect(mesPadrao('2026-07-15', 2026, hoje)).toBe(6)
  expect(mesPadrao('2026-07-15', 2025, hoje)).toBe(11)
  expect(mesPadrao(null, 2026, hoje)).toBe(8)
})

const lanc = (id: string, data: string, descricao: string, categoria_id: string | null) => ({ id, data, descricao, categoria_id })

test('filtra por mês, categoria, sem categoria e busca sem acento', () => {
  const lista = [
    lanc('a', '2026-03-02', 'Conta de energia', 'luz'),
    lanc('b', '2026-03-10', 'Pix Joao', null),
    lanc('c', '2026-04-01', 'Aluguel', 'aluguel'),
  ]
  expect(filtrarLancamentos(lista, { mes: 2, categoria: TODAS, busca: '' }).map((l) => l.id)).toEqual(['b', 'a'])
  expect(filtrarLancamentos(lista, { mes: null, categoria: SEM_CATEGORIA, busca: '' }).map((l) => l.id)).toEqual(['b'])
  expect(filtrarLancamentos(lista, { mes: null, categoria: 'aluguel', busca: '' }).map((l) => l.id)).toEqual(['c'])
  expect(filtrarLancamentos(lista, { mes: null, categoria: TODAS, busca: 'ENERGÍA' }).map((l) => l.id)).toEqual(['a'])
})

test('pendentes que uma regra nova pegaria: só os sem categoria', () => {
  const lista = [lanc('a', '2026-03-02', 'PIX FORNECEDOR X', null), lanc('b', '2026-03-02', 'Pix fornecedor y', 'x'), lanc('c', '2026-03-02', 'Boleto', null)]
  expect(pendentesQueBatem(lista, 'pix fornecedor')).toEqual(['a'])
  expect(pendentesQueBatem(lista, '  ')).toEqual([])
})

const cat = (id: string, ordem: number, grupo: Categoria['grupo'] = 'pagamentos_operacionais'): Categoria => ({
  id,
  empresa_id: 'e1',
  nome: id,
  grupo,
  ordem,
  ativa: true,
})

test('próxima ordem vem depois da última do grupo', () => {
  expect(proximaOrdem([cat('a', 1), cat('b', 4), cat('v', 9, 'recebimentos')], 'pagamentos_operacionais')).toBe(5)
  expect(proximaOrdem([], 'investimentos')).toBe(1)
})

test('mover troca a categoria com a vizinha e devolve só o que mudou', () => {
  const lista = [cat('a', 1), cat('b', 2), cat('c', 3)]
  expect(mover(lista, 'c', 'subir')).toEqual([
    { id: 'c', ordem: 2 },
    { id: 'b', ordem: 3 },
  ])
  expect(mover(lista, 'a', 'subir')).toEqual([])
  expect(mover(lista, 'c', 'descer')).toEqual([])
  // ordem repetida no banco se resolve renumerando
  expect(mover([cat('a', 0), cat('b', 0)], 'a', 'descer')).toEqual([
    { id: 'b', ordem: 1 },
    { id: 'a', ordem: 2 },
  ])
})

test('agrupa as recusas pelo motivo', () => {
  expect(
    agruparRecusas([
      { ok: false, linha: 2, motivo: 'Data que não deu para ler' },
      { ok: true, linha: 3, data: '2026-01-01', descricao: 'x', valor: 1 },
      { ok: false, linha: 4, motivo: 'Valor zerado' },
      { ok: false, linha: 5, motivo: 'Data que não deu para ler' },
    ]),
  ).toEqual([
    { motivo: 'Data que não deu para ler', linhas: [2, 5] },
    { motivo: 'Valor zerado', linhas: [4] },
  ])
})

test('intervalo de datas e aviso de repetida acima de 30%', () => {
  expect(intervaloDeDatas([{ data: '2026-03-05' }, { data: '2026-01-02' }, { data: '2026-02-01' }])).toEqual({
    inicio: '2026-01-02',
    fim: '2026-03-05',
  })
  expect(intervaloDeDatas([])).toBeNull()
  expect(pareceRepetida(3, 10)).toBe(false)
  expect(pareceRepetida(4, 10)).toBe(true)
  expect(pareceRepetida(0, 0)).toBe(false)
})

test('cabeçalho igual ignora acento, maiúscula e espaço', () => {
  const nomes = nomesDoCabecalho([['Extrato'], [' Data ', 'Descrição', 'Valor', null]], 1)
  expect(nomes).toEqual(['Data', 'Descrição', 'Valor', ''])
  expect(mesmoCabecalho(nomes, ['data', 'DESCRICAO', 'valor', ''])).toBe(true)
  expect(mesmoCabecalho(nomes, ['data', 'descricao'])).toBe(false)
  expect(mesmoCabecalho([], [])).toBe(false)
})

test('guarda e lê o último mapeamento por empresa', () => {
  const mapa = { cabecalho: 0, data: 0, descricao: 1, valor: 2, entrada: null, saida: null }
  salvarMapeamento('e1', { cabecalho: ['Data', 'Descrição', 'Valor'], mapa })
  expect(lerMapeamentoSalvo('e1')).toEqual({ cabecalho: ['Data', 'Descrição', 'Valor'], mapa })
  expect(lerMapeamentoSalvo('e2')).toBeNull()
  localStorage.setItem('empresa-viva:mapeamento:e3', 'não é json')
  expect(lerMapeamentoSalvo('e3')).toBeNull()
})

test('valor do lançamento manual ganha o sinal pelo tipo', () => {
  expect(valorComSinal(150.456, 'entrada')).toBe(150.46)
  expect(valorComSinal(-80, 'saida')).toBe(-80)
  expect(valorComSinal(80, 'saida')).toBe(-80)
})

test('texto da variação', () => {
  expect(textoDaVariacao(15.2)).toBe('+15,2%')
  expect(textoDaVariacao(-3)).toBe('-3%')
  expect(textoDaVariacao(0)).toBe('0%')
  expect(textoDaVariacao(null)).toBe('sem base')
})
