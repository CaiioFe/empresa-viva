import type { Papel } from './tipos'

/*
  O que cada papel pode ver e fazer, do lado da tela. A trava de verdade está no banco (RLS);
  isto aqui só esconde o que a pessoa não pode usar, para a tela não oferecer o que o banco vai recusar.
*/

export const NOME_DO_PAPEL: Record<Papel, string> = {
  dono: 'Dono',
  financeiro: 'Financeiro',
  rh: 'RH',
  consultora: 'Consultora',
}

export const podeVerCaixa = (p: Papel) => p === 'dono' || p === 'financeiro' || p === 'consultora'
export const podeEditarCaixa = (p: Papel) => p === 'dono' || p === 'financeiro'
export const podeVerPessoas = (p: Papel) => p === 'dono' || p === 'rh' || p === 'consultora'
export const podeEditarPessoas = (p: Papel) => p === 'dono' || p === 'rh'
export const podeRegistrarNaJornada = (p: Papel) => podeEditarPessoas(p) || p === 'consultora'
export const podeConfigurar = (p: Papel) => p === 'dono'

export type ItemDoMenu = { rota: string; rotulo: string; icone: 'painel' | 'caixa' | 'pessoas' | 'config' }

/** Itens do menu na ordem em que aparecem, só os que o papel pode abrir. */
export function itensDoMenu(p: Papel): ItemDoMenu[] {
  const itens: ItemDoMenu[] = [{ rota: '/', rotulo: 'Painel', icone: 'painel' }]
  if (podeVerCaixa(p)) itens.push({ rota: '/caixa', rotulo: 'Caixa', icone: 'caixa' })
  if (podeVerPessoas(p)) itens.push({ rota: '/pessoas', rotulo: 'Pessoas', icone: 'pessoas' })
  if (podeConfigurar(p)) itens.push({ rota: '/configuracoes', rotulo: 'Configurações', icone: 'config' })
  return itens
}
