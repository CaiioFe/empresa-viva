// Gera supabase/demonstracao.sql: as três empresas INVENTADAS da demonstração, com caixa de janeiro a
// setembro de 2026, regras de classificação, pessoas, jornadas, integração e DISC.
// Uso: node tools/gerar-demonstracao.mjs  (sempre gera o mesmo arquivo: o sorteio tem semente fixa)
//
// Nada aqui é dado real. Nomes de pessoas e empresas são fictícios, e os valores foram escolhidos
// para o semáforo acender onde a demonstração precisa (os mesmos exemplos da proposta).

import { writeFileSync } from 'node:fs'

let semente = 20260928
function sorteio() {
  semente = (semente + 0x6d2b79f5) | 0
  let t = Math.imul(semente ^ (semente >>> 15), 1 | semente)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const entre = (a, b) => a + sorteio() * (b - a)
const escolher = (lista) => lista[Math.floor(sorteio() * lista.length)]
const q = (t) => `'${String(t).replace(/'/g, "''")}'`
const dia = (mes, d) => `2026-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const redondo = (v) => Math.round(v * 100) / 100

const EMPRESAS = [
  { id: '00000000-0000-4000-a000-000000000001', nome: 'Comercial Aurora', perfil: 'comercio', saldo: 42000 },
  { id: '00000000-0000-4000-a000-000000000002', nome: 'Log Bandeirante', perfil: 'frota', saldo: 88000 },
  { id: '00000000-0000-4000-a000-000000000003', nome: 'Clínica Sollus', perfil: 'clinica', saldo: 35000 },
]

/*
  Cada linha do plano: categoria, valor base por mês (positivo entra, negativo sai), como o valor se
  divide em lançamentos (descrições) e os meses com valor diferente (ajustes). Meses de 1 a 9.
*/
const PLANOS = {
  comercio: [
    ['Vendas e serviços', 372000, ['Vendas cartão de crédito', 'Vendas cartão de débito', 'Vendas PIX', 'Depósito vendas em dinheiro'], { 9: 419000, 4: 331000 }, 0.05],
    ['Outros recebimentos', 2400, ['Rendimento aplicação'], {}, 0.2],
    ['Fornecedores e insumos', -224000, ['Fornecedor Distribuidora Horizonte NF', 'Fornecedor Atacado Serra Azul NF', 'Frete de entrada'], { 9: -236400, 8: -225300 }, 0.04],
    ['Pessoal', -44600, ['Folha de pagamento', 'Vale-transporte', 'Vale-alimentação'], { 8: -44886, 9: -57866 }, 0.02],
    ['Impostos e tributos', -18600, ['Simples Nacional DAS', 'ICMS antecipado'], { 8: -18657, 9: -4157 }, 0.06],
    ['Administrativo', -8500, ['Contabilidade mensalidade', 'Sistema de gestão mensalidade', 'Material de escritório'], { 8: -14502, 9: -8642 }, 0.05],
    ['Instalações', -15400, ['Aluguel da loja', 'Conta de energia', 'Conta de água', 'Internet e telefone'], { 8: -15579, 9: -18219 }, 0.03],
    ['Veículos e equipamentos', -2800, ['Combustível entregas', 'Manutenção utilitário'], { 8: -4807, 9: -1747 }, 0.1],
    ['Serviços de terceiros', -3900, ['Limpeza terceirizada', 'Manutenção do ar-condicionado'], {}, 0.08],
    ['Marketing', -7600, ['Impulsionamento redes sociais', 'Material de ponto de venda'], { 8: -7980, 9: -11387 }, 0.08],
    ['Bancários', -1750, ['Tarifa bancária', 'Taxa das maquininhas'], {}, 0.1],
    ['Pró-labore e retiradas', -20000, ['Pró-labore sócio'], {}, 0],
    ['Parcelas de empréstimos', -6200, ['Parcela capital de giro'], {}, 0],
    ['Máquinas e equipamentos', 0, ['Compra de balcão refrigerado'], { 3: -15800 }, 0],
  ],
  frota: [
    ['Vendas e serviços', 498000, ['Fretes recebidos', 'Contrato de distribuição mensal', 'Fretes avulsos PIX'], { 9: 512800, 5: 471000 }, 0.04],
    ['Pessoal', -159000, ['Folha de pagamento', 'Horas extras motoristas', 'Vale-alimentação'], { 8: -161620, 9: -168420 }, 0.02],
    ['Combustível', -101000, ['Posto Estrela Diesel', 'Posto Rodovia Diesel', 'Arla 32'], { 8: -102750, 9: -121650 }, 0.04],
    ['Veículos e equipamentos', -27000, ['Manutenção de frota', 'Pneus', 'Oficina mecânica'], { 8: -29340, 9: -47380 }, 0.08],
    ['Impostos e tributos', -59800, ['Impostos sobre faturamento', 'IPVA e licenciamento'], { 8: -60862, 9: -62140 }, 0.03],
    ['Instalações', -29500, ['Aluguel do galpão', 'Conta de energia', 'Conta de água'], { 8: -31500, 9: -28900 }, 0.03],
    ['Administrativo', -17200, ['Rastreamento de veículos', 'Contabilidade mensalidade', 'Seguro da frota'], { 8: -17750, 9: -19820 }, 0.03],
    ['Serviços de terceiros', -11800, ['Terceirizados de carga e descarga'], {}, 0.08],
    ['Marketing', -2900, ['Site e anúncios'], {}, 0.1],
    ['Bancários', -3400, ['Tarifa bancária', 'Juros de antecipação'], {}, 0.1],
    ['Pró-labore e retiradas', -30000, ['Pró-labore sócios'], {}, 0],
    ['Parcelas de empréstimos', -21800, ['Parcela financiamento caminhões'], {}, 0],
    ['Empréstimos recebidos', 0, ['Financiamento de caminhão liberado'], { 7: 150000 }, 0],
    ['Máquinas e equipamentos', 0, ['Compra de caminhão'], { 7: -182000 }, 0],
  ],
  clinica: [
    ['Vendas e serviços', 236000, ['Atendimentos convênios', 'Atendimentos particulares cartão', 'Atendimentos particulares PIX'], { 7: 262000, 8: 266700, 9: 287400 }, 0.03],
    ['Pessoal', -88400, ['Folha de pagamento', 'Plantões extras', 'Vale-transporte'], { 8: -90170, 9: -98640 }, 0.02],
    ['Fornecedores e insumos', -52000, ['Insumos médicos', 'Material descartável', 'Medicamentos'], { 8: -53600, 9: -61200 }, 0.04],
    ['Impostos e tributos', -31000, ['Impostos sobre faturamento'], { 8: -31700, 9: -34180 }, 0.03],
    ['Instalações', -20800, ['Aluguel da clínica', 'Conta de energia', 'Conta de água'], { 8: -20815, 9: -21460 }, 0.02],
    ['Veículos e equipamentos', -9600, ['Manutenção preventiva equipamentos'], { 8: -9700, 9: -9840 }, 0.05],
    ['Serviços de terceiros', -7200, ['Laboratório parceiro', 'Limpeza terceirizada'], {}, 0.06],
    ['Marketing', -4600, ['Campanha de captação', 'Impulsionamento redes sociais'], { 8: -4680, 9: -5830 }, 0.08],
    ['Bancários', -1200, ['Tarifa bancária', 'Taxa das maquininhas'], {}, 0.1],
    ['Pró-labore e retiradas', -25000, ['Pró-labore sócios'], {}, 0],
    ['Máquinas e equipamentos', 0, ['Compra de equipamento de ultrassom'], { 8: -38000 }, 0],
  ],
}

const REGRAS = {
  comum: [
    ['folha', 'Pessoal'],
    ['vale-', 'Pessoal'],
    ['ferias', 'Pessoal'],
    ['simples nacional', 'Impostos e tributos'],
    ['imposto', 'Impostos e tributos'],
    ['aluguel', 'Instalações'],
    ['energia', 'Instalações'],
    ['conta de agua', 'Instalações'],
    ['contabilidade', 'Administrativo'],
    ['tarifa bancaria', 'Bancários'],
    ['maquininha', 'Bancários'],
    ['pro-labore', 'Pró-labore e retiradas'],
    ['impulsionamento', 'Marketing'],
  ],
  comercio: [
    ['vendas', 'Vendas e serviços'],
    ['fornecedor', 'Fornecedores e insumos'],
    ['frete de entrada', 'Fornecedores e insumos'],
    ['combustivel', 'Veículos e equipamentos'],
    ['capital de giro', 'Parcelas de empréstimos'],
  ],
  frota: [
    ['frete', 'Vendas e serviços'],
    ['posto', 'Combustível'],
    ['diesel', 'Combustível'],
    ['manutencao de frota', 'Veículos e equipamentos'],
    ['pneus', 'Veículos e equipamentos'],
    ['horas extras', 'Pessoal'],
    ['rastreamento', 'Administrativo'],
    ['financiamento caminh', 'Parcelas de empréstimos'],
  ],
  clinica: [
    ['atendimentos', 'Vendas e serviços'],
    ['insumos', 'Fornecedores e insumos'],
    ['medicamentos', 'Fornecedores e insumos'],
    ['plantoes', 'Pessoal'],
    ['laboratorio', 'Serviços de terceiros'],
  ],
}

const SEM_CATEGORIA = [
  [9, 12, 'PIX recebido 00482', 1840],
  [9, 18, 'Pagamento boleto diverso', -612.4],
  [9, 22, 'Transferência enviada 7731', -1350],
]

/*
  Pessoas inventadas. entrada: data fixa ('2024-03-10') ou dias atrás (número).
  etapas: quantas das 4 etapas de integração já foram concluídas. disc: letra, 'convite' (pendente) ou null.
  ev: eventos extras [dias atrás ou data, tipo, texto].
*/
const PESSOAS = {
  comercio: [
    { nome: 'Cláudia Reis', funcao: 'Gerente de loja', setor: 'Gerência', entrada: '2021-03-08', etapas: 4, disc: 'D', ev: [['2023-08-01', 'mudanca_funcao', 'Promovida de vendedora a gerente de loja'], ['2026-06-12', 'treinamento', 'Treinamento de liderança concluído']] },
    { nome: 'Juliana Prado', funcao: 'Vendedora', setor: 'Vendas', entrada: '2026-02-02', etapas: 4, disc: 'I', ev: [['2026-05-04', 'avaliacao', 'Avaliação de 90 dias: acima do esperado']] },
    { nome: 'Marcos Tavares', funcao: 'Estoquista', setor: 'Estoque', entrada: 70, etapas: 2, disc: 'convite', ev: [] },
    { nome: 'Renata Alves', funcao: 'Operadora de caixa', setor: 'Caixa', entrada: '2023-10-16', etapas: 4, disc: 'S', ev: [['2025-01-06', 'mudanca_funcao', 'Mudou do estoque para o caixa'], [3, 'ferias', 'Férias de 15 dias marcadas para outubro']] },
    { nome: 'Pedro Lins', funcao: 'Vendedor', setor: 'Vendas', entrada: 12, etapas: 0, disc: null, ev: [] },
    { nome: 'Sandra Queiroz', funcao: 'Vendedora', setor: 'Vendas', entrada: '2022-07-11', etapas: 4, disc: 'I', ev: [[5, 'anotacao', 'Pediu para mudar para o turno da manhã']] },
    { nome: 'Thiago Barros', funcao: 'Auxiliar de estoque', setor: 'Estoque', entrada: '2025-04-14', etapas: 4, disc: 'S', ev: [] },
    { nome: 'Vânia Moreira', funcao: 'Auxiliar administrativa', setor: 'Administrativo', entrada: '2024-02-19', etapas: 4, disc: 'C', ev: [[2, 'treinamento', 'Curso de atendimento ao cliente']] },
  ],
  frota: [
    { nome: 'Luciana Brito', funcao: 'Coordenadora financeira', setor: 'Financeiro', entrada: '2019-05-06', etapas: 4, disc: 'C', ev: [['2024-02-01', 'mudanca_funcao', 'Assumiu a coordenação financeira']] },
    { nome: 'Sérgio Motta', funcao: 'Motorista', setor: 'Operação', entrada: '2022-04-04', etapas: 4, disc: 'S', ev: [['2026-08-25', 'anotacao', 'Cobriu rota de férias por 3 semanas'], [4, 'treinamento', 'Reciclagem de direção defensiva']] },
    { nome: 'Diego Ferraz', funcao: 'Motorista', setor: 'Operação', entrada: 45, etapas: 3, disc: 'convite', ev: [] },
    { nome: 'Ana Paula Rocha', funcao: 'Analista de logística', setor: 'Logística', entrada: '2025-01-13', etapas: 4, disc: 'C', ev: [['2026-07-20', 'treinamento', 'Curso de roteirização concluído']] },
    { nome: 'Tiago Neves', funcao: 'Ajudante', setor: 'Operação', entrada: 8, etapas: 1, disc: null, ev: [] },
    { nome: 'Márcio Lopes', funcao: 'Motorista', setor: 'Operação', entrada: '2020-09-14', etapas: 4, disc: 'D', ev: [[6, 'avaliacao', 'Avaliação anual: pontualidade exemplar']] },
    { nome: 'Rogério Sales', funcao: 'Mecânico', setor: 'Manutenção', entrada: '2023-03-20', etapas: 4, disc: 'S', ev: [] },
    { nome: 'Patrícia Nogueira', funcao: 'Assistente de RH', setor: 'Administrativo', entrada: '2024-08-05', etapas: 4, disc: 'I', ev: [] },
  ],
  clinica: [
    { nome: 'Helena Dias', funcao: 'Médica responsável', setor: 'Corpo clínico', entrada: '2018-06-04', etapas: 4, disc: 'C', ev: [['2022-03-01', 'mudanca_funcao', 'Assumiu a responsabilidade técnica']] },
    { nome: 'Fernanda Luz', funcao: 'Enfermeira', setor: 'Enfermagem', entrada: 40, etapas: 3, disc: 'S', ev: [] },
    { nome: 'Patrícia Gomes', funcao: 'Técnica de enfermagem', setor: 'Enfermagem', entrada: 38, etapas: 2, disc: 'convite', ev: [] },
    { nome: 'Bruno Castro', funcao: 'Recepcionista', setor: 'Recepção', entrada: 5, etapas: 0, disc: null, ev: [] },
    { nome: 'Otávio Pires', funcao: 'Auxiliar administrativo', setor: 'Administrativo', entrada: '2024-02-05', etapas: 4, disc: 'S', ev: [['2025-11-03', 'mudanca_funcao', 'Mudou da recepção para o administrativo']] },
    { nome: 'Camila Freitas', funcao: 'Recepcionista', setor: 'Recepção', entrada: '2025-06-09', etapas: 4, disc: 'I', ev: [[1, 'anotacao', 'Conversa sobre conflito com a enfermagem']] },
    { nome: 'Rafaela Martins', funcao: 'Enfermeira', setor: 'Enfermagem', entrada: '2021-10-18', etapas: 4, disc: 'S', ev: [] },
  ],
}

const FATORES = {
  D: [58, 18, 12, 12],
  I: [17, 54, 17, 12],
  S: [8, 17, 54, 21],
  C: [12, 8, 25, 55],
}

const ETAPAS = ['Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias']

const linhasSql = []
const push = (s) => linhasSql.push(s)

push('-- Dados INVENTADOS da demonstração da Empresa Viva. Gerado por tools/gerar-demonstracao.mjs; não edite à mão.')
push('-- Rodar como postgres, depois da migration da TASK-003. Pode rodar de novo: apaga e recria as três empresas.')
push('begin;')
push('')
push(`delete from empresa_viva.empresas where id in (${EMPRESAS.map((e) => q(e.id)).join(', ')});`)
push("update empresa_viva.ambiente set modo = 'demonstracao';")
push('')

for (const [n, empresa] of EMPRESAS.entries()) {
  const e = q(empresa.id)
  const carga = q(`00000000-0000-4000-b000-00000000000${n + 1}`)
  push(`-- ${empresa.nome}`)
  push(`insert into empresa_viva.empresas (id, nome, perfil, ano_inicio) values (${e}, ${q(empresa.nome)}, ${q(empresa.perfil)}, 2026);`)
  if (empresa.perfil === 'frota') {
    push(`insert into empresa_viva.categorias (empresa_id, nome, grupo, ordem) values (${e}, 'Combustível', 'pagamentos_operacionais', 2);`)
  }
  push(`insert into empresa_viva.saldos_iniciais (empresa_id, ano, valor) values (${e}, 2026, ${empresa.saldo});`)

  const regras = [...REGRAS.comum, ...REGRAS[empresa.perfil]]
  push('insert into empresa_viva.regras_classificacao (empresa_id, contem, categoria_id)')
  push(`select ${e}, r.contem, c.id from (values ${regras.map(([t, c]) => `(${q(t)}, ${q(c)})`).join(', ')}) as r(contem, categoria)`)
  push(`join empresa_viva.categorias c on c.empresa_id = ${e} and c.nome = r.categoria;`)

  push(`insert into empresa_viva.cargas (id, empresa_id, arquivo, linhas, mapeamento) values (${carga}, ${e}, 'extrato-janeiro-a-setembro-2026.xlsx', 0, '{"cabecalho":0,"data":0,"descricao":1,"valor":2}');`)

  const lancs = []
  for (const [categoria, base, descricoes, ajustes, ruido] of PLANOS[empresa.perfil]) {
    for (let mes = 1; mes <= 9; mes++) {
      const alvo = ajustes[mes] ?? redondo(base * (1 + entre(-ruido, ruido)))
      if (!alvo) continue
      const partes = descricoes.length
      const pesos = descricoes.map(() => entre(0.6, 1.4))
      const soma = pesos.reduce((a, b) => a + b, 0)
      let acumulado = 0
      descricoes.forEach((desc, i) => {
        const valor = i === partes - 1 ? redondo(alvo - acumulado) : redondo((alvo * pesos[i]) / soma)
        acumulado = redondo(acumulado + valor)
        if (valor === 0) return
        const d = Math.min(28, Math.max(1, Math.round(entre(2, 28))))
        const nf = /NF$/.test(desc) ? ` ${Math.round(entre(1000, 9999))}` : ''
        lancs.push([dia(mes, d), desc + nf, valor, categoria])
      })
    }
  }
  for (const [mes, d, desc, valor] of SEM_CATEGORIA) lancs.push([dia(mes, d), desc, valor, null])

  for (let i = 0; i < lancs.length; i += 200) {
    const bloco = lancs.slice(i, i + 200)
    push('insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem, carga_id)')
    push(`select ${e}, x.data::date, x.descricao, x.valor, c.id, 'planilha', ${carga} from (values`)
    push(bloco.map(([d, desc, v, cat]) => `  (${q(d)}, ${q(desc)}, ${v.toFixed(2)}, ${cat === null ? 'null::text' : q(cat)})`).join(',\n'))
    push(`) as x(data, descricao, valor, categoria) left join empresa_viva.categorias c on c.empresa_id = ${e} and c.nome = x.categoria;`)
  }
  push(`update empresa_viva.cargas set linhas = ${lancs.length} where id = ${carga};`)

  const pessoas = PESSOAS[empresa.perfil]
  for (const [k, p] of pessoas.entries()) {
    const id = q(`00000000-0000-4000-c00${n + 1}-${String(k + 1).padStart(12, '0')}`)
    const entrada = typeof p.entrada === 'number' ? `current_date - ${p.entrada}` : `${q(p.entrada)}::date`
    const tel = `'629${String(Math.round(entre(10000000, 99999999)))}'`
    push(
      `insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values (${id}, ${e}, ${q(p.nome)}, ${q(p.funcao)}, ${q(p.setor)}, ${entrada}, ${tel});`,
    )
    if (p.etapas > 0) {
      push('insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)')
      push(`select ${id}, t.id, ${e}, (${entrada}) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = ${e} and t.nome in (${ETAPAS.slice(0, p.etapas).map(q).join(', ')});`)
    }
    if (p.etapas === 4 && typeof p.entrada === 'number') {
      push(`insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values (${e}, ${id}, ${entrada} + 30, 'integracao', 'Integração concluída');`)
    }
    for (const [quando, tipo, texto] of p.ev) {
      const data = typeof quando === 'number' ? `current_date - ${quando}` : `${q(quando)}::date`
      push(`insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values (${e}, ${id}, ${data}, ${q(tipo)}, ${q(texto)});`)
    }
    if (p.disc === 'convite') {
      push(`insert into empresa_viva.disc_convites (empresa_id, colaborador_id, criado_em) values (${e}, ${id}, now() - interval '2 days');`)
    } else if (p.disc) {
      const [d, i2, s, c] = FATORES[p.disc]
      const quando = typeof p.entrada === 'number' ? `(${entrada} + 3) + time '12:00'` : `${q('2026-03-10 12:00:00-03')}::timestamptz`
      push(`insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values (${e}, ${id}, ${d}, ${i2}, ${s}, ${c}, ${q(p.disc)}, '[]'::jsonb, ${quando});`)
      push(`insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values (${e}, ${id}, (${quando})::date, 'disc', ${q(`DISC respondido pelo celular: perfil ${p.disc}`)});`)
    }
  }
  push('')
}

push('-- Religa os usuários da demonstração (apagar as empresas acima desfaz os vínculos). Sem os usuários criados, devolve 0.')
push('select empresa_viva.ligar_usuarios_demonstracao() as usuarios_ligados;')
push('commit;')
writeFileSync(new URL('../supabase/demonstracao.sql', import.meta.url), linhasSql.join('\n') + '\n')
console.log(`supabase/demonstracao.sql gerado (${linhasSql.length} linhas).`)
