import { podeVerCaixa, podeVerPessoas } from '@/lib/permissoes'
import type { Papel } from '@/lib/tipos'

/*
  Os passos do tour guiado. Cada passo aponta para um pedaço da tela (o "alvo") e explica o que
  ele faz. Nos passos de "clique", a pessoa clica no destaque para seguir (é o próprio clique que
  navega). O alvo é achado por função, sem depender de marcação espalhada pelas telas.
*/

export type Passo = {
  id: string
  /** Rota onde o alvo mora. Se a pessoa estiver em outra, o tour leva até lá. */
  rota?: string
  alvo: () => Element | null
  titulo: string
  texto: string
  /** A pessoa precisa clicar no destaque para continuar. */
  clique?: boolean
  precisa?: 'caixa' | 'pessoas'
}

const visivel = (el: Element) => {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

/** Primeiro elemento visível com data-tour igual ao nome (o menu existe no computador e no celular). */
export const porMarca = (nome: string) => () =>
  [...document.querySelectorAll(`[data-tour="${nome}"]`)].find(visivel) ?? null

/** O painel (Card) cujo título é exatamente o texto. */
export const painelComTitulo = (titulo: string) => () => {
  const h = [...document.querySelectorAll('main h2')].find((e) => e.textContent?.trim() === titulo)
  return h?.closest('section') ?? null
}

/** O painel cujo título começa com o texto (títulos que levam o mês ou o ano). */
export const painelQueComeca = (inicio: string) => () => {
  const h = [...document.querySelectorAll('main h2')].find((e) => e.textContent?.trim().startsWith(inicio))
  return h?.closest('section') ?? null
}

/** Link visível dentro do conteúdo cujo texto é exatamente o dado (abas do caixa). */
export const linkComTexto = (texto: string) => () =>
  [...document.querySelectorAll('main a')].find((e) => e.textContent?.trim() === texto && visivel(e)) ?? null

export const PASSOS: Passo[] = [
  {
    id: 'saldo',
    rota: '/',
    alvo: porMarca('saldo'),
    titulo: 'O saldo do mês',
    texto: 'O bloco escuro é sempre o número mais importante: quanto sobrou no caixa no fim do mês. Ao lado, o que entrou, o que saiu e a margem.',
    precisa: 'caixa',
  },
  {
    id: 'entradas',
    rota: '/',
    alvo: painelComTitulo('Entradas e saídas'),
    titulo: 'Entradas e saídas do ano',
    texto: 'Mês a mês, o que entrou (verde) e o que saiu (vermelho). Passe o mouse no gráfico para ver os valores.',
    precisa: 'caixa',
  },
  {
    id: 'subiu',
    rota: '/',
    alvo: painelComTitulo('O que mais subiu'),
    titulo: 'O que mais subiu',
    texto: 'Os gastos que passaram de 12% contra o mês anterior. É a primeira coisa a olhar quando o mês fecha.',
    precisa: 'caixa',
  },
  {
    id: 'atencao',
    rota: '/',
    alvo: painelComTitulo('Pede atenção'),
    titulo: 'Quem pede atenção',
    texto: 'Pessoas com integração pela metade ou que ainda não responderam o DISC. Clicar leva para a ficha.',
    precisa: 'pessoas',
  },
  {
    id: 'menu-caixa',
    alvo: porMarca('menu-caixa'),
    titulo: 'Agora, o caixa',
    texto: 'Clique em Caixa para ver o fluxo do ano inteiro.',
    clique: true,
    precisa: 'caixa',
  },
  {
    id: 'comparar',
    rota: '/caixa',
    alvo: painelComTitulo('Comparar mês'),
    titulo: 'Compare qualquer mês',
    texto: 'Escolha o mês e veja cada categoria com quanto pesa no que entrou e quanto mudou. Vermelho é pagamento que subiu mais de 12%.',
    precisa: 'caixa',
  },
  {
    id: 'aba-importar',
    rota: '/caixa',
    alvo: linkComTexto('Importar'),
    titulo: 'A planilha da empresa',
    texto: 'Clique em Importar: é por aqui que entra a planilha exportada do sistema que a empresa já usa.',
    clique: true,
    precisa: 'caixa',
  },
  {
    id: 'importar',
    rota: '/caixa/importar',
    alvo: painelQueComeca('1.'),
    titulo: 'Subir a planilha',
    texto: 'Escolha o arquivo em Excel ou CSV. O sistema acha as colunas, mostra uma prévia e classifica cada linha pelas regras. Na dúvida, baixe a planilha modelo.',
    precisa: 'caixa',
  },
  {
    id: 'menu-pessoas',
    alvo: porMarca('menu-pessoas'),
    titulo: 'Agora, as pessoas',
    texto: 'Clique em Pessoas para ver o time.',
    clique: true,
    precisa: 'pessoas',
  },
  {
    id: 'time',
    rota: '/pessoas',
    alvo: () => document.querySelector('main table')?.closest('section') ?? document.querySelector('main table'),
    titulo: 'O time inteiro',
    texto: 'Cada pessoa com a integração e o perfil DISC. Clique em alguém para abrir a ficha com a jornada, as etapas e o botão de mandar o DISC pelo WhatsApp.',
    precisa: 'pessoas',
  },
  {
    id: 'fim',
    alvo: porMarca('botao-tour'),
    titulo: 'Pronto',
    texto: 'Para rever este tour quando quiser, é só clicar aqui.',
  },
]

/** Os passos que fazem sentido para o papel (o Financeiro não vê Pessoas, o RH não vê Caixa). */
export function passosDoPapel(papel: Papel): Passo[] {
  return PASSOS.filter((p) => {
    if (p.precisa === 'caixa') return podeVerCaixa(papel)
    if (p.precisa === 'pessoas') return podeVerPessoas(papel)
    return true
  })
}
