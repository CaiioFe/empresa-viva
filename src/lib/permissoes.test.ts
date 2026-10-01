import { itensDoMenu, podeEditarCaixa, podeRegistrarNaJornada, podeVerCaixa, podeVerPessoas } from './permissoes'

const rotas = (p: Parameters<typeof itensDoMenu>[0]) => itensDoMenu(p).map((i) => i.rota)

test('dono vê tudo', () => {
  expect(rotas('dono')).toEqual(['/', '/caixa', '/pessoas', '/configuracoes'])
})

test('financeiro não vê pessoas nem configurações', () => {
  expect(rotas('financeiro')).toEqual(['/', '/caixa'])
  expect(podeVerPessoas('financeiro')).toBe(false)
})

test('rh não vê caixa', () => {
  expect(rotas('rh')).toEqual(['/', '/pessoas'])
  expect(podeVerCaixa('rh')).toBe(false)
})

test('consultora vê caixa e pessoas, só lê o caixa e registra na jornada', () => {
  expect(rotas('consultora')).toEqual(['/', '/caixa', '/pessoas'])
  expect(podeEditarCaixa('consultora')).toBe(false)
  expect(podeRegistrarNaJornada('consultora')).toBe(true)
})
