import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import type { Papel } from '@/lib/tipos'
import { PaginaPainel } from './painel'

let papel: Papel = 'dono'
vi.mock('@/app/sessao', () => ({
  useEmpresaAtiva: () => ({ papel, empresa: { id: 'e1', nome: 'Comercial Aurora', perfil: 'comercio', ano_inicio: 2026 } }),
}))

const cat = (id: string, grupo: string) => ({ id, empresa_id: 'e1', nome: id, grupo, ordem: 0, ativa: true })

vi.mock('./api', () => ({
  useCaixaDoPainel: () => ({
    isPending: false,
    isError: false,
    data: {
      ano: 2026,
      saldoInicial: 1000,
      categorias: [cat('Vendas', 'recebimentos'), cat('Pessoal', 'pagamentos_operacionais')],
      lancamentos: [
        { data: '2026-08-05', valor: 10000, categoria_id: 'Vendas' },
        { data: '2026-08-10', valor: -4000, categoria_id: 'Pessoal' },
        { data: '2026-09-05', valor: 12000, categoria_id: 'Vendas' },
        { data: '2026-09-10', valor: -6000, categoria_id: 'Pessoal' },
      ],
    },
  }),
  usePessoasDoPainel: () => ({
    isPending: false,
    isError: false,
    data: {
      totalDeEtapas: 4,
      pessoas: [
        { id: 'p1', nome: 'Juliana Prado', funcao: 'Vendedora', data_entrada: '2026-02-01', etapasConcluidas: 4, temDisc: true },
        { id: 'p2', nome: 'Pedro Lins', funcao: 'Vendedor', data_entrada: '2026-09-01', etapasConcluidas: 1, temDisc: false },
      ],
      eventosDaSemana: [],
    },
  }),
}))

function abrir(p: Papel) {
  papel = p
  render(
    <MemoryRouter>
      <PaginaPainel />
    </MemoryRouter>,
  )
}

test('dono vê o caixa do último mês e as pessoas', () => {
  abrir('dono')
  expect(screen.getByRole('heading', { name: 'Caixa de setembro' })).toBeInTheDocument()
  expect(screen.getByText('R$ 12.000,00')).toBeInTheDocument()
  // pessoal subiu de 4.000 para 6.000: +50%
  // aparece no resumo (pagamentos) e na lista do que mais subiu
  expect(screen.getAllByText('+50,0%').length).toBeGreaterThanOrEqual(2)
  expect(screen.getByRole('heading', { name: 'Pessoas' })).toBeInTheDocument()
  expect(screen.getByText('Pedro Lins')).toBeInTheDocument()
  expect(screen.getByText('Integração 1/4')).toBeInTheDocument()
})

test('financeiro não vê o bloco de pessoas', () => {
  abrir('financeiro')
  expect(screen.getByRole('heading', { name: 'Caixa de setembro' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Pessoas' })).not.toBeInTheDocument()
})

test('rh não vê o bloco do caixa', () => {
  abrir('rh')
  expect(screen.queryByRole('heading', { name: /caixa de/i })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Pessoas' })).toBeInTheDocument()
})
