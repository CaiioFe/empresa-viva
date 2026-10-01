import type { LetraDisc } from '@/lib/tipos'

/*
  Questionário DISC próprio da Maestria: 24 situações de trabalho, 4 respostas cada, uma por fator.
  A ordem das letras muda de pergunta para pergunta para ninguém cair num padrão.
  Antes do uso real, a Cíntia calibra perguntas e textos (ver ARQUITETURA, riscos).
  O banco (disc_responder) recalcula o resultado; o cálculo daqui é o mesmo, para a tela mostrar na hora.
*/

export type Pergunta = { texto: string; opcoes: { letra: LetraDisc; texto: string }[] }

const p = (texto: string, ...opcoes: [LetraDisc, string][]): Pergunta => ({
  texto,
  opcoes: opcoes.map(([letra, t]) => ({ letra, texto: t })),
})

export const QUESTIONARIO: Pergunta[] = [
  p('Quando aparece um problema no trabalho, eu costumo...', ['D', 'Resolver na hora, mesmo sem perguntar a ninguém'], ['I', 'Chamar as pessoas e conversar sobre isso'], ['S', 'Seguir o combinado e esperar a orientação'], ['C', 'Entender a causa antes de mexer em qualquer coisa']),
  p('Numa reunião, eu geralmente...', ['I', 'Falo bastante e animo o grupo'], ['C', 'Faço perguntas de detalhe'], ['D', 'Vou direto ao ponto e quero uma decisão'], ['S', 'Escuto mais do que falo']),
  p('O que mais me incomoda é...', ['S', 'Mudança de última hora e clima pesado'], ['D', 'Perder tempo e ser muito controlado'], ['C', 'Erro, bagunça e falta de critério'], ['I', 'Ser ignorado ou trabalhar sozinho']),
  p('Sob pressão, eu tendo a...', ['C', 'Travar procurando a resposta perfeita'], ['S', 'Ficar quieto e aguentar'], ['I', 'Me dispersar e falar demais'], ['D', 'Ficar impaciente e mandar']),
  p('O que mais me motiva é...', ['D', 'Desafio e resultado'], ['S', 'Segurança e uma equipe unida'], ['I', 'Reconhecimento e um ambiente bom'], ['C', 'Fazer bem feito e ser respeitado pelo que sei']),
  p('Quem me conhece diria que eu sou...', ['I', 'Comunicativo'], ['D', 'Decidido'], ['C', 'Cuidadoso'], ['S', 'Confiável']),
  p('Quando recebo uma tarefa nova, primeiro eu...', ['C', 'Leio tudo e entendo as regras'], ['D', 'Começo logo e ajusto no caminho'], ['S', 'Pergunto como costuma ser feito'], ['I', 'Comento com os colegas e troco ideias']),
  p('Num conflito com um colega, eu...', ['D', 'Falo o que penso, na lata'], ['I', 'Tento quebrar o gelo e conversar'], ['C', 'Mostro os fatos para provar o meu ponto'], ['S', 'Evito a briga e deixo esfriar']),
  p('O ambiente de trabalho ideal para mim tem...', ['S', 'Rotina clara e gente que se ajuda'], ['C', 'Processo organizado e regras bem definidas'], ['D', 'Liberdade e metas desafiadoras'], ['I', 'Gente animada e muita troca']),
  p('Quando o chefe muda uma decisão de repente, eu...', ['I', 'Pergunto o motivo e já comento com o time'], ['S', 'Fico desconfortável, mas me adapto aos poucos'], ['D', 'Quero saber o que muda no resultado e sigo'], ['C', 'Quero entender a lógica antes de aceitar']),
  p('Eu me sinto bem quando...', ['C', 'Entrego sem nenhum erro'], ['I', 'As pessoas gostam do que fiz'], ['S', 'O dia corre em paz e todo mundo se entende'], ['D', 'Bato a meta antes do prazo']),
  p('Ao tomar uma decisão importante, eu...', ['D', 'Decido rápido e assumo o risco'], ['C', 'Pesquiso e comparo tudo antes'], ['I', 'Ouço o que as pessoas acham'], ['S', 'Penso em como vai afetar a equipe']),
  p('Se um colega está com dificuldade, eu...', ['S', 'Ofereço ajuda e fico junto até resolver'], ['D', 'Mostro o caminho mais rápido'], ['I', 'Dou uma força e levanto o ânimo dele'], ['C', 'Explico o passo a passo certinho']),
  p('O que me tira do sério é...', ['C', 'Retrabalho por falta de atenção'], ['S', 'Grito e grosseria'], ['D', 'Lentidão e enrolação'], ['I', 'Gente fechada e sem papo']),
  p('No meu trabalho, eu me destaco por...', ['I', 'Convencer e envolver as pessoas'], ['D', 'Fazer acontecer'], ['S', 'Ser constante e leal'], ['C', 'Ser preciso e organizado']),
  p('Quando erro, eu...', ['D', 'Corrijo e sigo em frente sem drama'], ['C', 'Fico remoendo e quero entender o que falhou'], ['S', 'Fico chateado e peço desculpas'], ['I', 'Levo na leveza e conto para alguém']),
  p('Em um projeto em grupo, eu prefiro...', ['S', 'Cuidar de uma parte e fazer bem feito'], ['I', 'Apresentar e falar com as pessoas'], ['C', 'Planejar e conferir os detalhes'], ['D', 'Liderar e dividir as tarefas']),
  p('Mudanças no trabalho, para mim, são...', ['I', 'Uma novidade animadora'], ['C', 'Aceitáveis, se forem bem explicadas'], ['D', 'Uma oportunidade de fazer melhor'], ['S', 'Difíceis, preciso de tempo']),
  p('Eu prefiro receber instruções...', ['C', 'Por escrito, bem detalhadas'], ['D', 'Curtas, só o objetivo'], ['I', 'Numa conversa, olho no olho'], ['S', 'Com calma e com exemplo de como fazer']),
  p('No fim de um dia bom, o que ficou foi...', ['D', 'Tudo que eu resolvi'], ['S', 'A tranquilidade de ter feito a minha parte'], ['C', 'Um trabalho bem feito, sem pendência'], ['I', 'As conversas e as risadas']),
  p('Quando alguém me critica, eu...', ['S', 'Fico magoado, mas não falo nada'], ['I', 'Explico o meu lado conversando'], ['D', 'Rebato se achar que não tem razão'], ['C', 'Peço exemplos concretos']),
  p('Com prazo apertado, eu...', ['I', 'Chamo reforço e divido o trabalho'], ['D', 'Acelero e cobro o time'], ['C', 'Priorizo o essencial para não errar'], ['S', 'Faço hora extra sem reclamar']),
  p('O elogio de que eu mais gosto é...', ['C', '"Isso aqui está impecável"'], ['S', '"Posso sempre contar com você"'], ['D', '"Você resolveu o que ninguém resolvia"'], ['I', '"Todo mundo adora trabalhar com você"']),
  p('Se eu pudesse escolher, o meu trabalho seria...', ['D', 'Comandar e crescer rápido'], ['I', 'Lidar com gente o dia todo'], ['S', 'Estável, com uma equipe de confiança'], ['C', 'Técnico, com espaço para me aprofundar']),
]

export const NOME_DO_FATOR: Record<LetraDisc, string> = {
  D: 'Dominância',
  I: 'Influência',
  S: 'Estabilidade',
  C: 'Conformidade',
}

export const TEXTO_DO_PERFIL: Record<LetraDisc, string> = {
  D: 'Vai direto ao resultado e decide rápido. Rende mais com meta clara e autonomia. Sob pressão, tende a mandar mais e ouvir menos.',
  I: 'Move as pessoas e cria clima. Rende mais com contato e reconhecimento. Sob pressão, tende a se dispersar e prometer mais do que dá conta.',
  S: 'É o chão da equipe: constante, leal e cuidadoso com as pessoas. Rende mais com rotina e mudança avisada com antecedência. Sob pressão, tende a se calar e aguentar demais.',
  C: 'Analítico e caprichoso com o detalhe. Rende mais com processo claro e critério definido. Sob pressão, tende a travar procurando a resposta perfeita.',
}

export type ResultadoCalculado = { d: number; i: number; s: number; c: number; predominante: LetraDisc }

/** Porcentagem de cada fator nas respostas. Empate no topo segue a ordem D, I, S, C (igual ao banco). */
export function calcularPerfil(respostas: LetraDisc[]): ResultadoCalculado {
  const conta: Record<LetraDisc, number> = { D: 0, I: 0, S: 0, C: 0 }
  for (const r of respostas) conta[r]++
  const total = respostas.length || 1
  const pct = (l: LetraDisc) => Math.round((conta[l] / total) * 100)
  const ordem: LetraDisc[] = ['D', 'I', 'S', 'C']
  const predominante = ordem.reduce((melhor, l) => (conta[l] > conta[melhor] ? l : melhor), 'D' as LetraDisc)
  return { d: pct('D'), i: pct('I'), s: pct('S'), c: pct('C'), predominante }
}
