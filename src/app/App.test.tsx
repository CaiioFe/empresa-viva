import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { App } from './App'

// Sem sessão e em modo de demonstração: o app tem que cair na tela de entrada com os botões da demo.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ maybeSingle: () => Promise.resolve({ data: { modo: 'demonstracao' }, error: null }) }),
    }),
  },
}))

test('sem sessão, abre a tela de entrada com a entrada rápida da demonstração', async () => {
  window.history.pushState({}, '', '/')
  render(<App />)
  expect(await screen.findByRole('heading', { name: 'Bem-vindo de volta' })).toBeInTheDocument()
  expect(await screen.findByText(/demonstração: entre como/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /consultora/i })).toBeInTheDocument()
})
