/*
  Regras da tela de Configurações que dá para testar sem banco.
*/

type EtapaOrdenavel = { id: string; ordem: number; nome: string }

/** Etapas na ordem da tela: pela ordem gravada e, no empate, pelo nome. */
export function ordenarEtapas<T extends EtapaOrdenavel>(etapas: T[]): T[] {
  return [...etapas].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'))
}

/**
 * Sobe (-1) ou desce (+1) uma etapa. Devolve só as etapas cuja ordem muda, já numeradas de 1 em diante,
 * para a tela gravar o mínimo. Assim a lista se arruma mesmo se o banco tiver ordens repetidas.
 */
export function moverEtapa(etapas: EtapaOrdenavel[], id: string, direcao: -1 | 1): { id: string; ordem: number }[] {
  const lista = ordenarEtapas(etapas)
  const de = lista.findIndex((e) => e.id === id)
  const para = de + direcao
  if (de < 0 || para < 0 || para >= lista.length) return []
  const movida = lista[de]
  const vizinha = lista[para]
  if (!movida || !vizinha) return []
  lista[de] = vizinha
  lista[para] = movida
  return lista.flatMap((e, indice) => (e.ordem === indice + 1 ? [] : [{ id: e.id, ordem: indice + 1 }]))
}

/** Ordem de uma etapa nova: vai para o fim da lista. */
export function proximaOrdem(etapas: { ordem: number }[]): number {
  return etapas.reduce((maior, e) => Math.max(maior, e.ordem), 0) + 1
}
