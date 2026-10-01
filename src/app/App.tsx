import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { SessaoProvider } from '@/app/sessao'
import { Rotas } from '@/app/rotas'

const clienteDeConsultas = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

export function App() {
  return (
    <QueryClientProvider client={clienteDeConsultas}>
      <BrowserRouter>
        <SessaoProvider>
          <Rotas />
        </SessaoProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
