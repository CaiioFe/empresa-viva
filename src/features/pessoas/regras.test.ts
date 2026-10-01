import {
  contarConcluidas,
  filtrarPessoas,
  hojeNoFuso,
  iniciais,
  linkDoTesteDisc,
  linkDoWhatsApp,
  marcarFechaAIntegracao,
  mensagemDoConviteDisc,
  numeroDoWhatsApp,
  ordenarJornada,
  resumirPessoas,
  setoresDaLista,
  statusDaIntegracao,
} from './regras'

describe('status da integração', () => {
  test('nenhuma, algumas e todas as etapas', () => {
    expect(statusDaIntegracao(4, 0)).toBe('nao_iniciada')
    expect(statusDaIntegracao(4, 2)).toBe('andamento')
    expect(statusDaIntegracao(4, 4)).toBe('concluida')
  })

  test('empresa sem etapas ativas', () => {
    expect(statusDaIntegracao(0, 0)).toBe('sem_etapas')
  })

  test('etapa desativada não conta como concluída', () => {
    expect(contarConcluidas(['a', 'b'], ['a', 'velha'])).toBe(1)
  })

  test('marcar a última que faltava fecha a integração', () => {
    expect(marcarFechaAIntegracao(['a', 'b', 'c'], ['a', 'b'], 'c')).toBe(true)
    expect(marcarFechaAIntegracao(['a', 'b', 'c'], ['a'], 'c')).toBe(false)
    expect(marcarFechaAIntegracao(['a', 'b'], ['a', 'b'], 'b')).toBe(false)
    expect(marcarFechaAIntegracao(['a'], [], 'fora')).toBe(false)
  })
})

describe('nomes e lista', () => {
  test('iniciais do primeiro e do último nome', () => {
    expect(iniciais('Ana Paula Rocha')).toBe('AR')
    expect(iniciais('  bruno  ')).toBe('B')
    expect(iniciais('')).toBe('?')
  })

  const lista = [
    { nome: 'Cláudia Reis', setor: 'Loja', situacao: 'ativo' as const },
    { nome: 'Marcos Tavares', setor: 'Estoque', situacao: 'ativo' as const },
    { nome: 'Pedro Lins', setor: 'Loja', situacao: 'desligado' as const },
  ]

  test('busca sem acento, filtro por setor e por situação', () => {
    expect(filtrarPessoas(lista, { busca: 'claudia', setor: '', situacao: 'todos' }).map((p) => p.nome)).toEqual(['Cláudia Reis'])
    expect(filtrarPessoas(lista, { busca: '', setor: 'Loja', situacao: 'ativo' }).map((p) => p.nome)).toEqual(['Cláudia Reis'])
    expect(filtrarPessoas(lista, { busca: '', setor: '', situacao: 'desligado' }).map((p) => p.nome)).toEqual(['Pedro Lins'])
  })

  test('setores sem repetir e em ordem', () => {
    expect(setoresDaLista([...lista, { setor: ' ' }])).toEqual(['Estoque', 'Loja'])
  })

  test('números do topo contam só os ativos', () => {
    const resumo = resumirPessoas([
      { situacao: 'ativo', status: 'concluida', letraDisc: 'D' },
      { situacao: 'ativo', status: 'andamento', letraDisc: null },
      { situacao: 'ativo', status: 'nao_iniciada', letraDisc: 'S' },
      { situacao: 'ativo', status: 'sem_etapas', letraDisc: 'I' },
      { situacao: 'desligado', status: 'nao_iniciada', letraDisc: null },
    ])
    expect(resumo).toEqual({ ativos: 4, emIntegracao: 2, discFeito: 0.75, semDisc: 1 })
  })

  test('sem ninguém ativo, o DISC feito fica vazio', () => {
    expect(resumirPessoas([]).discFeito).toBeNull()
  })
})

test('jornada do mais novo para o mais antigo, mantendo a ordem no mesmo dia', () => {
  const eventos = [
    { id: '1', data: '2026-01-10' },
    { id: '2', data: '2026-09-01' },
    { id: '3', data: '2026-01-10' },
  ]
  expect(ordenarJornada(eventos).map((e) => e.id)).toEqual(['2', '1', '3'])
})

test('hoje no fuso de São Paulo', () => {
  // 02h em UTC ainda é o dia anterior em São Paulo
  expect(hojeNoFuso(new Date('2026-09-29T02:00:00Z'))).toBe('2026-09-28')
})

describe('links do DISC e do WhatsApp', () => {
  test('link do teste', () => {
    expect(linkDoTesteDisc('https://app.exemplo.com/', 'abc')).toBe('https://app.exemplo.com/disc/abc')
  })

  test('número com ou sem 55, com máscara', () => {
    expect(numeroDoWhatsApp('(11) 98765-4321')).toBe('5511987654321')
    expect(numeroDoWhatsApp('+55 11 98765-4321')).toBe('5511987654321')
    expect(numeroDoWhatsApp('11 3456-7890')).toBe('551134567890')
    expect(numeroDoWhatsApp('9876')).toBeNull()
    expect(numeroDoWhatsApp(null)).toBeNull()
  })

  test('link do WhatsApp com a mensagem e o link do teste', () => {
    const mensagem = mensagemDoConviteDisc('Ana Paula Rocha', 'https://app.exemplo.com/disc/abc')
    expect(mensagem.startsWith('Olá, Ana!')).toBe(true)
    const link = linkDoWhatsApp('(11) 98765-4321', mensagem)
    expect(link).toMatch(/^https:\/\/wa\.me\/5511987654321\?text=/)
    expect(decodeURIComponent(link!.split('text=')[1]!)).toContain('https://app.exemplo.com/disc/abc')
  })

  test('sem telefone não tem link do WhatsApp', () => {
    expect(linkDoWhatsApp('', 'oi')).toBeNull()
  })
})
