import { passosDoPapel } from './passos'

const ids = (p: Parameters<typeof passosDoPapel>[0]) => passosDoPapel(p).map((x) => x.id)

test('dono passa por caixa e pessoas e termina no botão do tour', () => {
  const d = ids('dono')
  expect(d).toContain('menu-caixa')
  expect(d).toContain('menu-pessoas')
  expect(d.at(-1)).toBe('fim')
})

test('financeiro não passa por pessoas', () => {
  expect(ids('financeiro').some((i) => ['atencao', 'menu-pessoas', 'time'].includes(i))).toBe(false)
})

test('rh não passa pelo caixa', () => {
  expect(ids('rh').some((i) => ['saldo', 'menu-caixa', 'comparar', 'importar'].includes(i))).toBe(false)
  expect(ids('rh')).toContain('menu-pessoas')
})

test('todo passo de clique aponta para algo que navega', () => {
  for (const p of passosDoPapel('dono').filter((x) => x.clique)) expect(p.id).toMatch(/menu|aba/)
})
