import { render, screen } from '@testing-library/react'
import { Aviso, Button, CabecalhoDaPagina, Campo, Card, Kpi, Pill, Selecao, Tabela, Td, Th, Vazio } from '.'

test('botão é type=button por padrão', () => {
  render(<Button variante="secundario">Salvar</Button>)
  expect(screen.getByRole('button', { name: 'Salvar' })).toHaveAttribute('type', 'button')
})

test('card mostra título e conteúdo', () => {
  render(<Card titulo="Caixa do mês">conteúdo</Card>)
  expect(screen.getByRole('heading', { name: 'Caixa do mês' })).toBeInTheDocument()
  expect(screen.getByText('conteúdo')).toBeInTheDocument()
})

test('kpi mostra rótulo, valor e detalhe; variação vira etiqueta com a cor da tendência', () => {
  render(<Kpi rotulo="Saldo" valor="R$ 10" detalhe="+8,7% contra agosto" tendencia="boa" />)
  expect(screen.getByText('Saldo')).toBeInTheDocument()
  expect(screen.getByText('R$ 10')).toBeInTheDocument()
  expect(screen.getByText('+8,7%')).toHaveClass('text-bom')
  expect(screen.getByText('contra agosto')).toBeInTheDocument()
})

test('campo liga o rótulo ao input e mostra erro', () => {
  render(<Campo rotulo="Nome" erro="Obrigatório" />)
  expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText('Obrigatório')).toBeInTheDocument()
})

test('seleção liga o rótulo ao select', () => {
  render(
    <Selecao rotulo="Papel">
      <option>Dono</option>
    </Selecao>,
  )
  expect(screen.getByLabelText('Papel')).toBeInTheDocument()
})

test('tabela, pill, vazio, aviso e cabeçalho renderizam', () => {
  render(
    <>
      <CabecalhoDaPagina rotulo="Caixa" titulo="Fluxo do ano" />
      <Tabela>
        <thead>
          <tr>
            <Th>Categoria</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>Pessoal</Td>
          </tr>
        </tbody>
      </Tabela>
      <Pill tom="ruim">Crítico</Pill>
      <Vazio titulo="Nada aqui" />
      <Aviso tom="erro">Deu errado</Aviso>
    </>,
  )
  expect(screen.getByRole('heading', { name: 'Fluxo do ano' })).toBeInTheDocument()
  expect(screen.getByRole('table')).toBeInTheDocument()
  expect(screen.getByText('Crítico')).toBeInTheDocument()
  expect(screen.getByRole('alert')).toHaveTextContent('Deu errado')
})
