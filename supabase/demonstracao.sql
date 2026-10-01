-- Dados INVENTADOS da demonstração da Empresa Viva. Gerado por tools/gerar-demonstracao.mjs; não edite à mão.
-- Rodar como postgres, depois da migration da TASK-003. Pode rodar de novo: apaga e recria as três empresas.
begin;

delete from empresa_viva.empresas where id in ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000003');
update empresa_viva.ambiente set modo = 'demonstracao';

-- Comercial Aurora
insert into empresa_viva.empresas (id, nome, perfil, ano_inicio) values ('00000000-0000-4000-a000-000000000001', 'Comercial Aurora', 'comercio', 2026);
insert into empresa_viva.saldos_iniciais (empresa_id, ano, valor) values ('00000000-0000-4000-a000-000000000001', 2026, 42000);
insert into empresa_viva.regras_classificacao (empresa_id, contem, categoria_id)
select '00000000-0000-4000-a000-000000000001', r.contem, c.id from (values ('folha', 'Pessoal'), ('vale-', 'Pessoal'), ('ferias', 'Pessoal'), ('simples nacional', 'Impostos e tributos'), ('imposto', 'Impostos e tributos'), ('aluguel', 'Instalações'), ('energia', 'Instalações'), ('conta de agua', 'Instalações'), ('contabilidade', 'Administrativo'), ('tarifa bancaria', 'Bancários'), ('maquininha', 'Bancários'), ('pro-labore', 'Pró-labore e retiradas'), ('impulsionamento', 'Marketing'), ('vendas', 'Vendas e serviços'), ('fornecedor', 'Fornecedores e insumos'), ('frete de entrada', 'Fornecedores e insumos'), ('combustivel', 'Veículos e equipamentos'), ('capital de giro', 'Parcelas de empréstimos')) as r(contem, categoria)
join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000001' and c.nome = r.categoria;
insert into empresa_viva.cargas (id, empresa_id, arquivo, linhas, mapeamento) values ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'extrato-janeiro-a-setembro-2026.xlsx', 0, '{"cabecalho":0,"data":0,"descricao":1,"valor":2}');
insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem, carga_id)
select '00000000-0000-4000-a000-000000000001', x.data::date, x.descricao, x.valor, c.id, 'planilha', '00000000-0000-4000-b000-000000000001' from (values
  ('2026-01-11', 'Vendas cartão de crédito', 82183.77, 'Vendas e serviços'),
  ('2026-01-27', 'Vendas cartão de débito', 121301.02, 'Vendas e serviços'),
  ('2026-01-17', 'Vendas PIX', 94800.78, 'Vendas e serviços'),
  ('2026-01-20', 'Depósito vendas em dinheiro', 90121.77, 'Vendas e serviços'),
  ('2026-02-04', 'Vendas cartão de crédito', 74337.07, 'Vendas e serviços'),
  ('2026-02-26', 'Vendas cartão de débito', 99406.25, 'Vendas e serviços'),
  ('2026-02-14', 'Vendas PIX', 81184.63, 'Vendas e serviços'),
  ('2026-02-03', 'Depósito vendas em dinheiro', 102799.96, 'Vendas e serviços'),
  ('2026-03-17', 'Vendas cartão de crédito', 68012.60, 'Vendas e serviços'),
  ('2026-03-14', 'Vendas cartão de débito', 98075.40, 'Vendas e serviços'),
  ('2026-03-17', 'Vendas PIX', 104153.72, 'Vendas e serviços'),
  ('2026-03-26', 'Depósito vendas em dinheiro', 96015.62, 'Vendas e serviços'),
  ('2026-04-20', 'Vendas cartão de crédito', 74802.63, 'Vendas e serviços'),
  ('2026-04-19', 'Vendas cartão de débito', 104265.00, 'Vendas e serviços'),
  ('2026-04-10', 'Vendas PIX', 75605.89, 'Vendas e serviços'),
  ('2026-04-08', 'Depósito vendas em dinheiro', 76326.48, 'Vendas e serviços'),
  ('2026-05-08', 'Vendas cartão de crédito', 95569.81, 'Vendas e serviços'),
  ('2026-05-14', 'Vendas cartão de débito', 80720.99, 'Vendas e serviços'),
  ('2026-05-22', 'Vendas PIX', 83099.75, 'Vendas e serviços'),
  ('2026-05-08', 'Depósito vendas em dinheiro', 103328.44, 'Vendas e serviços'),
  ('2026-06-25', 'Vendas cartão de crédito', 101280.17, 'Vendas e serviços'),
  ('2026-06-14', 'Vendas cartão de débito', 82883.97, 'Vendas e serviços'),
  ('2026-06-25', 'Vendas PIX', 97938.81, 'Vendas e serviços'),
  ('2026-06-18', 'Depósito vendas em dinheiro', 88426.91, 'Vendas e serviços'),
  ('2026-07-26', 'Vendas cartão de crédito', 61743.77, 'Vendas e serviços'),
  ('2026-07-22', 'Vendas cartão de débito', 104438.93, 'Vendas e serviços'),
  ('2026-07-21', 'Vendas PIX', 116775.50, 'Vendas e serviços'),
  ('2026-07-22', 'Depósito vendas em dinheiro', 103667.73, 'Vendas e serviços'),
  ('2026-08-02', 'Vendas cartão de crédito', 78871.08, 'Vendas e serviços'),
  ('2026-08-14', 'Vendas cartão de débito', 112244.93, 'Vendas e serviços'),
  ('2026-08-02', 'Vendas PIX', 86557.59, 'Vendas e serviços'),
  ('2026-08-06', 'Depósito vendas em dinheiro', 108149.02, 'Vendas e serviços'),
  ('2026-09-20', 'Vendas cartão de crédito', 108944.00, 'Vendas e serviços'),
  ('2026-09-26', 'Vendas cartão de débito', 104314.42, 'Vendas e serviços'),
  ('2026-09-13', 'Vendas PIX', 84171.34, 'Vendas e serviços'),
  ('2026-09-10', 'Depósito vendas em dinheiro', 121570.24, 'Vendas e serviços'),
  ('2026-01-25', 'Rendimento aplicação', 2613.07, 'Outros recebimentos'),
  ('2026-02-02', 'Rendimento aplicação', 2458.05, 'Outros recebimentos'),
  ('2026-03-10', 'Rendimento aplicação', 2056.30, 'Outros recebimentos'),
  ('2026-04-09', 'Rendimento aplicação', 2506.81, 'Outros recebimentos'),
  ('2026-05-15', 'Rendimento aplicação', 2622.42, 'Outros recebimentos'),
  ('2026-06-18', 'Rendimento aplicação', 2070.33, 'Outros recebimentos'),
  ('2026-07-19', 'Rendimento aplicação', 2870.16, 'Outros recebimentos'),
  ('2026-08-14', 'Rendimento aplicação', 2201.41, 'Outros recebimentos'),
  ('2026-09-16', 'Rendimento aplicação', 2677.89, 'Outros recebimentos'),
  ('2026-01-16', 'Fornecedor Distribuidora Horizonte NF 6836', -50316.45, 'Fornecedores e insumos'),
  ('2026-01-27', 'Fornecedor Atacado Serra Azul NF 3280', -88977.36, 'Fornecedores e insumos'),
  ('2026-01-28', 'Frete de entrada', -77930.95, 'Fornecedores e insumos'),
  ('2026-02-24', 'Fornecedor Distribuidora Horizonte NF 6253', -48706.65, 'Fornecedores e insumos'),
  ('2026-02-09', 'Fornecedor Atacado Serra Azul NF 8083', -101894.03, 'Fornecedores e insumos'),
  ('2026-02-14', 'Frete de entrada', -66908.61, 'Fornecedores e insumos'),
  ('2026-03-26', 'Fornecedor Distribuidora Horizonte NF 9820', -107111.54, 'Fornecedores e insumos'),
  ('2026-03-08', 'Fornecedor Atacado Serra Azul NF 6689', -70775.52, 'Fornecedores e insumos'),
  ('2026-03-05', 'Frete de entrada', -48385.51, 'Fornecedores e insumos'),
  ('2026-04-28', 'Fornecedor Distribuidora Horizonte NF 1022', -77824.61, 'Fornecedores e insumos'),
  ('2026-04-12', 'Fornecedor Atacado Serra Azul NF 4209', -71066.83, 'Fornecedores e insumos'),
  ('2026-04-25', 'Frete de entrada', -75740.05, 'Fornecedores e insumos'),
  ('2026-05-06', 'Fornecedor Distribuidora Horizonte NF 1501', -51042.16, 'Fornecedores e insumos'),
  ('2026-05-18', 'Fornecedor Atacado Serra Azul NF 8801', -98078.91, 'Fornecedores e insumos'),
  ('2026-05-02', 'Frete de entrada', -77783.63, 'Fornecedores e insumos'),
  ('2026-06-25', 'Fornecedor Distribuidora Horizonte NF 5686', -76377.89, 'Fornecedores e insumos'),
  ('2026-06-18', 'Fornecedor Atacado Serra Azul NF 6786', -69119.43, 'Fornecedores e insumos'),
  ('2026-06-21', 'Frete de entrada', -77842.03, 'Fornecedores e insumos'),
  ('2026-07-24', 'Fornecedor Distribuidora Horizonte NF 8351', -84304.50, 'Fornecedores e insumos'),
  ('2026-07-18', 'Fornecedor Atacado Serra Azul NF 4170', -63424.61, 'Fornecedores e insumos'),
  ('2026-07-03', 'Frete de entrada', -71861.81, 'Fornecedores e insumos'),
  ('2026-08-14', 'Fornecedor Distribuidora Horizonte NF 7454', -73080.73, 'Fornecedores e insumos'),
  ('2026-08-05', 'Fornecedor Atacado Serra Azul NF 9368', -84728.25, 'Fornecedores e insumos'),
  ('2026-08-23', 'Frete de entrada', -67491.02, 'Fornecedores e insumos'),
  ('2026-09-26', 'Fornecedor Distribuidora Horizonte NF 8373', -100683.76, 'Fornecedores e insumos'),
  ('2026-09-26', 'Fornecedor Atacado Serra Azul NF 2065', -49919.52, 'Fornecedores e insumos'),
  ('2026-09-23', 'Frete de entrada', -85796.72, 'Fornecedores e insumos'),
  ('2026-01-21', 'Folha de pagamento', -19549.10, 'Pessoal'),
  ('2026-01-09', 'Vale-transporte', -9880.49, 'Pessoal'),
  ('2026-01-10', 'Vale-alimentação', -15948.31, 'Pessoal'),
  ('2026-02-26', 'Folha de pagamento', -15124.58, 'Pessoal'),
  ('2026-02-10', 'Vale-transporte', -14263.71, 'Pessoal'),
  ('2026-02-20', 'Vale-alimentação', -15906.81, 'Pessoal'),
  ('2026-03-02', 'Folha de pagamento', -11546.11, 'Pessoal'),
  ('2026-03-03', 'Vale-transporte', -20791.40, 'Pessoal'),
  ('2026-03-17', 'Vale-alimentação', -11727.04, 'Pessoal'),
  ('2026-04-28', 'Folha de pagamento', -12646.62, 'Pessoal'),
  ('2026-04-06', 'Vale-transporte', -21462.20, 'Pessoal'),
  ('2026-04-26', 'Vale-alimentação', -11378.95, 'Pessoal'),
  ('2026-05-07', 'Folha de pagamento', -11148.06, 'Pessoal'),
  ('2026-05-12', 'Vale-transporte', -20170.04, 'Pessoal'),
  ('2026-05-08', 'Vale-alimentação', -13794.43, 'Pessoal'),
  ('2026-06-24', 'Folha de pagamento', -16830.34, 'Pessoal'),
  ('2026-06-27', 'Vale-transporte', -12331.43, 'Pessoal'),
  ('2026-06-05', 'Vale-alimentação', -14872.75, 'Pessoal'),
  ('2026-07-12', 'Folha de pagamento', -17977.01, 'Pessoal'),
  ('2026-07-27', 'Vale-transporte', -16486.76, 'Pessoal'),
  ('2026-07-06', 'Vale-alimentação', -10436.96, 'Pessoal'),
  ('2026-08-08', 'Folha de pagamento', -17260.10, 'Pessoal'),
  ('2026-08-18', 'Vale-transporte', -17835.24, 'Pessoal'),
  ('2026-08-06', 'Vale-alimentação', -9790.66, 'Pessoal'),
  ('2026-09-22', 'Folha de pagamento', -18954.66, 'Pessoal'),
  ('2026-09-08', 'Vale-transporte', -19405.96, 'Pessoal'),
  ('2026-09-22', 'Vale-alimentação', -19505.38, 'Pessoal'),
  ('2026-01-14', 'Simples Nacional DAS', -9057.16, 'Impostos e tributos'),
  ('2026-01-16', 'ICMS antecipado', -9112.33, 'Impostos e tributos'),
  ('2026-02-10', 'Simples Nacional DAS', -7120.76, 'Impostos e tributos'),
  ('2026-02-14', 'ICMS antecipado', -11068.68, 'Impostos e tributos'),
  ('2026-03-14', 'Simples Nacional DAS', -9706.99, 'Impostos e tributos'),
  ('2026-03-09', 'ICMS antecipado', -7989.61, 'Impostos e tributos'),
  ('2026-04-04', 'Simples Nacional DAS', -9081.11, 'Impostos e tributos'),
  ('2026-04-18', 'ICMS antecipado', -9567.56, 'Impostos e tributos'),
  ('2026-05-16', 'Simples Nacional DAS', -8932.70, 'Impostos e tributos'),
  ('2026-05-26', 'ICMS antecipado', -9214.83, 'Impostos e tributos'),
  ('2026-06-05', 'Simples Nacional DAS', -9090.08, 'Impostos e tributos'),
  ('2026-06-23', 'ICMS antecipado', -9762.50, 'Impostos e tributos'),
  ('2026-07-28', 'Simples Nacional DAS', -12182.40, 'Impostos e tributos'),
  ('2026-07-16', 'ICMS antecipado', -7259.04, 'Impostos e tributos'),
  ('2026-08-22', 'Simples Nacional DAS', -10972.40, 'Impostos e tributos'),
  ('2026-08-23', 'ICMS antecipado', -7684.60, 'Impostos e tributos'),
  ('2026-09-09', 'Simples Nacional DAS', -1943.39, 'Impostos e tributos'),
  ('2026-09-27', 'ICMS antecipado', -2213.61, 'Impostos e tributos'),
  ('2026-01-15', 'Contabilidade mensalidade', -2662.23, 'Administrativo'),
  ('2026-01-17', 'Sistema de gestão mensalidade', -3922.35, 'Administrativo'),
  ('2026-01-22', 'Material de escritório', -2000.24, 'Administrativo'),
  ('2026-02-05', 'Contabilidade mensalidade', -2845.02, 'Administrativo'),
  ('2026-02-08', 'Sistema de gestão mensalidade', -2623.75, 'Administrativo'),
  ('2026-02-10', 'Material de escritório', -3157.68, 'Administrativo'),
  ('2026-03-27', 'Contabilidade mensalidade', -3492.97, 'Administrativo'),
  ('2026-03-14', 'Sistema de gestão mensalidade', -1722.65, 'Administrativo'),
  ('2026-03-19', 'Material de escritório', -3325.70, 'Administrativo'),
  ('2026-04-05', 'Contabilidade mensalidade', -2265.70, 'Administrativo'),
  ('2026-04-17', 'Sistema de gestão mensalidade', -2722.42, 'Administrativo'),
  ('2026-04-20', 'Material de escritório', -3132.10, 'Administrativo'),
  ('2026-05-21', 'Contabilidade mensalidade', -2481.92, 'Administrativo'),
  ('2026-05-28', 'Sistema de gestão mensalidade', -3128.77, 'Administrativo'),
  ('2026-05-09', 'Material de escritório', -2561.83, 'Administrativo'),
  ('2026-06-18', 'Contabilidade mensalidade', -2484.85, 'Administrativo'),
  ('2026-06-19', 'Sistema de gestão mensalidade', -2155.35, 'Administrativo'),
  ('2026-06-05', 'Material de escritório', -3672.02, 'Administrativo'),
  ('2026-07-04', 'Contabilidade mensalidade', -2215.24, 'Administrativo'),
  ('2026-07-14', 'Sistema de gestão mensalidade', -2114.63, 'Administrativo'),
  ('2026-07-23', 'Material de escritório', -4584.87, 'Administrativo'),
  ('2026-08-27', 'Contabilidade mensalidade', -4325.05, 'Administrativo'),
  ('2026-08-05', 'Sistema de gestão mensalidade', -4691.35, 'Administrativo'),
  ('2026-08-11', 'Material de escritório', -5485.60, 'Administrativo'),
  ('2026-09-25', 'Contabilidade mensalidade', -3641.56, 'Administrativo'),
  ('2026-09-28', 'Sistema de gestão mensalidade', -2433.59, 'Administrativo'),
  ('2026-09-26', 'Material de escritório', -2566.85, 'Administrativo'),
  ('2026-01-27', 'Aluguel da loja', -4448.79, 'Instalações'),
  ('2026-01-03', 'Conta de energia', -2441.62, 'Instalações'),
  ('2026-01-20', 'Conta de água', -4066.81, 'Instalações'),
  ('2026-01-08', 'Internet e telefone', -4306.36, 'Instalações'),
  ('2026-02-05', 'Aluguel da loja', -2768.33, 'Instalações'),
  ('2026-02-05', 'Conta de energia', -4754.45, 'Instalações'),
  ('2026-02-16', 'Conta de água', -3703.02, 'Instalações'),
  ('2026-02-14', 'Internet e telefone', -4498.30, 'Instalações'),
  ('2026-03-22', 'Aluguel da loja', -3833.66, 'Instalações'),
  ('2026-03-10', 'Conta de energia', -3055.37, 'Instalações'),
  ('2026-03-11', 'Conta de água', -4925.82, 'Instalações'),
  ('2026-03-25', 'Internet e telefone', -3213.53, 'Instalações'),
  ('2026-04-05', 'Aluguel da loja', -3810.03, 'Instalações'),
  ('2026-04-24', 'Conta de energia', -3410.61, 'Instalações'),
  ('2026-04-08', 'Conta de água', -4552.55, 'Instalações'),
  ('2026-04-15', 'Internet e telefone', -3789.82, 'Instalações'),
  ('2026-05-17', 'Aluguel da loja', -2733.22, 'Instalações'),
  ('2026-05-03', 'Conta de energia', -3558.13, 'Instalações'),
  ('2026-05-25', 'Conta de água', -4314.70, 'Instalações'),
  ('2026-05-06', 'Internet e telefone', -5126.15, 'Instalações'),
  ('2026-06-07', 'Aluguel da loja', -5144.03, 'Instalações'),
  ('2026-06-17', 'Conta de energia', -3957.96, 'Instalações'),
  ('2026-06-04', 'Conta de água', -3344.13, 'Instalações'),
  ('2026-06-27', 'Internet e telefone', -2973.59, 'Instalações'),
  ('2026-07-13', 'Aluguel da loja', -3142.77, 'Instalações'),
  ('2026-07-07', 'Conta de energia', -4610.99, 'Instalações'),
  ('2026-07-15', 'Conta de água', -2565.78, 'Instalações'),
  ('2026-07-23', 'Internet e telefone', -4885.32, 'Instalações'),
  ('2026-08-16', 'Aluguel da loja', -3941.03, 'Instalações'),
  ('2026-08-04', 'Conta de energia', -4568.40, 'Instalações'),
  ('2026-08-08', 'Conta de água', -3668.28, 'Instalações'),
  ('2026-08-07', 'Internet e telefone', -3401.29, 'Instalações'),
  ('2026-09-09', 'Aluguel da loja', -5563.82, 'Instalações'),
  ('2026-09-27', 'Conta de energia', -3222.14, 'Instalações'),
  ('2026-09-11', 'Conta de água', -3668.85, 'Instalações'),
  ('2026-09-04', 'Internet e telefone', -5764.19, 'Instalações'),
  ('2026-01-13', 'Combustível entregas', -1562.06, 'Veículos e equipamentos'),
  ('2026-01-10', 'Manutenção utilitário', -1424.21, 'Veículos e equipamentos'),
  ('2026-02-21', 'Combustível entregas', -1599.78, 'Veículos e equipamentos'),
  ('2026-02-26', 'Manutenção utilitário', -1338.18, 'Veículos e equipamentos'),
  ('2026-03-17', 'Combustível entregas', -1309.01, 'Veículos e equipamentos'),
  ('2026-03-21', 'Manutenção utilitário', -1720.50, 'Veículos e equipamentos'),
  ('2026-04-19', 'Combustível entregas', -1502.31, 'Veículos e equipamentos'),
  ('2026-04-02', 'Manutenção utilitário', -1394.29, 'Veículos e equipamentos'),
  ('2026-05-08', 'Combustível entregas', -1524.51, 'Veículos e equipamentos'),
  ('2026-05-07', 'Manutenção utilitário', -1328.42, 'Veículos e equipamentos'),
  ('2026-06-28', 'Combustível entregas', -1317.40, 'Veículos e equipamentos'),
  ('2026-06-15', 'Manutenção utilitário', -1699.49, 'Veículos e equipamentos'),
  ('2026-07-10', 'Combustível entregas', -1400.72, 'Veículos e equipamentos'),
  ('2026-07-05', 'Manutenção utilitário', -1520.87, 'Veículos e equipamentos'),
  ('2026-08-09', 'Combustível entregas', -2239.08, 'Veículos e equipamentos'),
  ('2026-08-24', 'Manutenção utilitário', -2567.92, 'Veículos e equipamentos'),
  ('2026-09-02', 'Combustível entregas', -938.11, 'Veículos e equipamentos'),
  ('2026-09-24', 'Manutenção utilitário', -808.89, 'Veículos e equipamentos'),
  ('2026-01-14', 'Limpeza terceirizada', -1625.68, 'Serviços de terceiros'),
  ('2026-01-05', 'Manutenção do ar-condicionado', -2126.57, 'Serviços de terceiros')
) as x(data, descricao, valor, categoria) left join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000001' and c.nome = x.categoria;
insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem, carga_id)
select '00000000-0000-4000-a000-000000000001', x.data::date, x.descricao, x.valor, c.id, 'planilha', '00000000-0000-4000-b000-000000000001' from (values
  ('2026-02-17', 'Limpeza terceirizada', -2457.52, 'Serviços de terceiros'),
  ('2026-02-22', 'Manutenção do ar-condicionado', -1215.33, 'Serviços de terceiros'),
  ('2026-03-24', 'Limpeza terceirizada', -2525.87, 'Serviços de terceiros'),
  ('2026-03-14', 'Manutenção do ar-condicionado', -1592.77, 'Serviços de terceiros'),
  ('2026-04-06', 'Limpeza terceirizada', -2048.51, 'Serviços de terceiros'),
  ('2026-04-04', 'Manutenção do ar-condicionado', -2031.25, 'Serviços de terceiros'),
  ('2026-05-18', 'Limpeza terceirizada', -2435.07, 'Serviços de terceiros'),
  ('2026-05-12', 'Manutenção do ar-condicionado', -1647.40, 'Serviços de terceiros'),
  ('2026-06-05', 'Limpeza terceirizada', -2213.13, 'Serviços de terceiros'),
  ('2026-06-04', 'Manutenção do ar-condicionado', -1593.90, 'Serviços de terceiros'),
  ('2026-07-06', 'Limpeza terceirizada', -1592.16, 'Serviços de terceiros'),
  ('2026-07-24', 'Manutenção do ar-condicionado', -2043.28, 'Serviços de terceiros'),
  ('2026-08-21', 'Limpeza terceirizada', -1687.90, 'Serviços de terceiros'),
  ('2026-08-19', 'Manutenção do ar-condicionado', -2327.68, 'Serviços de terceiros'),
  ('2026-09-17', 'Limpeza terceirizada', -1662.11, 'Serviços de terceiros'),
  ('2026-09-07', 'Manutenção do ar-condicionado', -2456.85, 'Serviços de terceiros'),
  ('2026-01-03', 'Impulsionamento redes sociais', -3523.30, 'Marketing'),
  ('2026-01-27', 'Material de ponto de venda', -3760.64, 'Marketing'),
  ('2026-02-12', 'Impulsionamento redes sociais', -3140.91, 'Marketing'),
  ('2026-02-24', 'Material de ponto de venda', -3901.60, 'Marketing'),
  ('2026-03-18', 'Impulsionamento redes sociais', -4388.42, 'Marketing'),
  ('2026-03-06', 'Material de ponto de venda', -3114.42, 'Marketing'),
  ('2026-04-09', 'Impulsionamento redes sociais', -4642.94, 'Marketing'),
  ('2026-04-07', 'Material de ponto de venda', -2628.72, 'Marketing'),
  ('2026-05-13', 'Impulsionamento redes sociais', -3194.11, 'Marketing'),
  ('2026-05-06', 'Material de ponto de venda', -4775.05, 'Marketing'),
  ('2026-06-21', 'Impulsionamento redes sociais', -3949.53, 'Marketing'),
  ('2026-06-23', 'Material de ponto de venda', -3650.87, 'Marketing'),
  ('2026-07-26', 'Impulsionamento redes sociais', -3985.00, 'Marketing'),
  ('2026-07-06', 'Material de ponto de venda', -3616.49, 'Marketing'),
  ('2026-08-04', 'Impulsionamento redes sociais', -3529.46, 'Marketing'),
  ('2026-08-21', 'Material de ponto de venda', -4450.54, 'Marketing'),
  ('2026-09-26', 'Impulsionamento redes sociais', -5789.97, 'Marketing'),
  ('2026-09-23', 'Material de ponto de venda', -5597.03, 'Marketing'),
  ('2026-01-11', 'Tarifa bancária', -863.21, 'Bancários'),
  ('2026-01-12', 'Taxa das maquininhas', -723.00, 'Bancários'),
  ('2026-02-27', 'Tarifa bancária', -927.84, 'Bancários'),
  ('2026-02-06', 'Taxa das maquininhas', -761.22, 'Bancários'),
  ('2026-03-03', 'Tarifa bancária', -804.01, 'Bancários'),
  ('2026-03-03', 'Taxa das maquininhas', -930.93, 'Bancários'),
  ('2026-04-26', 'Tarifa bancária', -978.92, 'Bancários'),
  ('2026-04-10', 'Taxa das maquininhas', -719.44, 'Bancários'),
  ('2026-05-11', 'Tarifa bancária', -594.44, 'Bancários'),
  ('2026-05-17', 'Taxa das maquininhas', -1152.54, 'Bancários'),
  ('2026-06-17', 'Tarifa bancária', -999.01, 'Bancários'),
  ('2026-06-03', 'Taxa das maquininhas', -899.99, 'Bancários'),
  ('2026-07-13', 'Tarifa bancária', -926.64, 'Bancários'),
  ('2026-07-28', 'Taxa das maquininhas', -723.94, 'Bancários'),
  ('2026-08-18', 'Tarifa bancária', -992.77, 'Bancários'),
  ('2026-08-23', 'Taxa das maquininhas', -801.07, 'Bancários'),
  ('2026-09-14', 'Tarifa bancária', -788.07, 'Bancários'),
  ('2026-09-17', 'Taxa das maquininhas', -1065.34, 'Bancários'),
  ('2026-01-26', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-02-14', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-03-07', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-04-18', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-05-08', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-06-20', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-07-15', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-08-11', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-09-23', 'Pró-labore sócio', -20000.00, 'Pró-labore e retiradas'),
  ('2026-01-25', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-02-08', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-03-27', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-04-05', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-05-03', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-06-13', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-07-05', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-08-05', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-09-25', 'Parcela capital de giro', -6200.00, 'Parcelas de empréstimos'),
  ('2026-03-02', 'Compra de balcão refrigerado', -15800.00, 'Máquinas e equipamentos'),
  ('2026-09-12', 'PIX recebido 00482', 1840.00, null::text),
  ('2026-09-18', 'Pagamento boleto diverso', -612.40, null::text),
  ('2026-09-22', 'Transferência enviada 7731', -1350.00, null::text)
) as x(data, descricao, valor, categoria) left join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000001' and c.nome = x.categoria;
update empresa_viva.cargas set linhas = 274 where id = '00000000-0000-4000-b000-000000000001';
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000001', '00000000-0000-4000-a000-000000000001', 'Cláudia Reis', 'Gerente de loja', 'Gerência', '2021-03-08'::date, '62922056096');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c001-000000000001', t.id, '00000000-0000-4000-a000-000000000001', ('2021-03-08'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000001' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000001', '2023-08-01'::date, 'mudanca_funcao', 'Promovida de vendedora a gerente de loja');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000001', '2026-06-12'::date, 'treinamento', 'Treinamento de liderança concluído');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000001', 58, 18, 12, 12, 'D', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000001', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil D');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000002', '00000000-0000-4000-a000-000000000001', 'Juliana Prado', 'Vendedora', 'Vendas', '2026-02-02'::date, '62992704889');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c001-000000000002', t.id, '00000000-0000-4000-a000-000000000001', ('2026-02-02'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000001' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000002', '2026-05-04'::date, 'avaliacao', 'Avaliação de 90 dias: acima do esperado');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000002', 17, 54, 17, 12, 'I', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000002', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil I');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000003', '00000000-0000-4000-a000-000000000001', 'Marcos Tavares', 'Estoquista', 'Estoque', current_date - 70, '62948992573');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c001-000000000003', t.id, '00000000-0000-4000-a000-000000000001', (current_date - 70) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000001' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time');
insert into empresa_viva.disc_convites (empresa_id, colaborador_id, criado_em) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000003', now() - interval '2 days');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000004', '00000000-0000-4000-a000-000000000001', 'Renata Alves', 'Operadora de caixa', 'Caixa', '2023-10-16'::date, '62925800438');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c001-000000000004', t.id, '00000000-0000-4000-a000-000000000001', ('2023-10-16'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000001' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000004', '2025-01-06'::date, 'mudanca_funcao', 'Mudou do estoque para o caixa');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000004', current_date - 3, 'ferias', 'Férias de 15 dias marcadas para outubro');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000004', 8, 17, 54, 21, 'S', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000004', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil S');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000005', '00000000-0000-4000-a000-000000000001', 'Pedro Lins', 'Vendedor', 'Vendas', current_date - 12, '62982905448');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000006', '00000000-0000-4000-a000-000000000001', 'Sandra Queiroz', 'Vendedora', 'Vendas', '2022-07-11'::date, '62935698972');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c001-000000000006', t.id, '00000000-0000-4000-a000-000000000001', ('2022-07-11'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000001' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000006', current_date - 5, 'anotacao', 'Pediu para mudar para o turno da manhã');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000006', 17, 54, 17, 12, 'I', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000006', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil I');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000007', '00000000-0000-4000-a000-000000000001', 'Thiago Barros', 'Auxiliar de estoque', 'Estoque', '2025-04-14'::date, '62972709741');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c001-000000000007', t.id, '00000000-0000-4000-a000-000000000001', ('2025-04-14'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000001' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000007', 8, 17, 54, 21, 'S', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000007', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil S');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c001-000000000008', '00000000-0000-4000-a000-000000000001', 'Vânia Moreira', 'Auxiliar administrativa', 'Administrativo', '2024-02-19'::date, '62988413251');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c001-000000000008', t.id, '00000000-0000-4000-a000-000000000001', ('2024-02-19'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000001' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000008', current_date - 2, 'treinamento', 'Curso de atendimento ao cliente');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000008', 12, 8, 25, 55, 'C', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000001', '00000000-0000-4000-c001-000000000008', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil C');

-- Log Bandeirante
insert into empresa_viva.empresas (id, nome, perfil, ano_inicio) values ('00000000-0000-4000-a000-000000000002', 'Log Bandeirante', 'frota', 2026);
insert into empresa_viva.categorias (empresa_id, nome, grupo, ordem) values ('00000000-0000-4000-a000-000000000002', 'Combustível', 'pagamentos_operacionais', 2);
insert into empresa_viva.saldos_iniciais (empresa_id, ano, valor) values ('00000000-0000-4000-a000-000000000002', 2026, 88000);
insert into empresa_viva.regras_classificacao (empresa_id, contem, categoria_id)
select '00000000-0000-4000-a000-000000000002', r.contem, c.id from (values ('folha', 'Pessoal'), ('vale-', 'Pessoal'), ('ferias', 'Pessoal'), ('simples nacional', 'Impostos e tributos'), ('imposto', 'Impostos e tributos'), ('aluguel', 'Instalações'), ('energia', 'Instalações'), ('conta de agua', 'Instalações'), ('contabilidade', 'Administrativo'), ('tarifa bancaria', 'Bancários'), ('maquininha', 'Bancários'), ('pro-labore', 'Pró-labore e retiradas'), ('impulsionamento', 'Marketing'), ('frete', 'Vendas e serviços'), ('posto', 'Combustível'), ('diesel', 'Combustível'), ('manutencao de frota', 'Veículos e equipamentos'), ('pneus', 'Veículos e equipamentos'), ('horas extras', 'Pessoal'), ('rastreamento', 'Administrativo'), ('financiamento caminh', 'Parcelas de empréstimos')) as r(contem, categoria)
join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000002' and c.nome = r.categoria;
insert into empresa_viva.cargas (id, empresa_id, arquivo, linhas, mapeamento) values ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000002', 'extrato-janeiro-a-setembro-2026.xlsx', 0, '{"cabecalho":0,"data":0,"descricao":1,"valor":2}');
insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem, carga_id)
select '00000000-0000-4000-a000-000000000002', x.data::date, x.descricao, x.valor, c.id, 'planilha', '00000000-0000-4000-b000-000000000002' from (values
  ('2026-01-14', 'Fretes recebidos', 152078.01, 'Vendas e serviços'),
  ('2026-01-06', 'Contrato de distribuição mensal', 135139.85, 'Vendas e serviços'),
  ('2026-01-19', 'Fretes avulsos PIX', 218960.64, 'Vendas e serviços'),
  ('2026-02-12', 'Fretes recebidos', 155046.15, 'Vendas e serviços'),
  ('2026-02-18', 'Contrato de distribuição mensal', 228935.82, 'Vendas e serviços'),
  ('2026-02-16', 'Fretes avulsos PIX', 120148.90, 'Vendas e serviços'),
  ('2026-03-14', 'Fretes recebidos', 167967.82, 'Vendas e serviços'),
  ('2026-03-17', 'Contrato de distribuição mensal', 162860.86, 'Vendas e serviços'),
  ('2026-03-04', 'Fretes avulsos PIX', 160962.74, 'Vendas e serviços'),
  ('2026-04-14', 'Fretes recebidos', 134869.88, 'Vendas e serviços'),
  ('2026-04-04', 'Contrato de distribuição mensal', 170538.62, 'Vendas e serviços'),
  ('2026-04-13', 'Fretes avulsos PIX', 185217.99, 'Vendas e serviços'),
  ('2026-05-21', 'Fretes recebidos', 163045.39, 'Vendas e serviços'),
  ('2026-05-08', 'Contrato de distribuição mensal', 119342.61, 'Vendas e serviços'),
  ('2026-05-13', 'Fretes avulsos PIX', 188612.00, 'Vendas e serviços'),
  ('2026-06-03', 'Fretes recebidos', 187342.71, 'Vendas e serviços'),
  ('2026-06-03', 'Contrato de distribuição mensal', 188590.67, 'Vendas e serviços'),
  ('2026-06-05', 'Fretes avulsos PIX', 123399.79, 'Vendas e serviços'),
  ('2026-07-26', 'Fretes recebidos', 195154.83, 'Vendas e serviços'),
  ('2026-07-11', 'Contrato de distribuição mensal', 132105.05, 'Vendas e serviços'),
  ('2026-07-03', 'Fretes avulsos PIX', 175070.94, 'Vendas e serviços'),
  ('2026-08-05', 'Fretes recebidos', 119417.19, 'Vendas e serviços'),
  ('2026-08-14', 'Contrato de distribuição mensal', 209522.58, 'Vendas e serviços'),
  ('2026-08-27', 'Fretes avulsos PIX', 179864.19, 'Vendas e serviços'),
  ('2026-09-13', 'Fretes recebidos', 163428.71, 'Vendas e serviços'),
  ('2026-09-22', 'Contrato de distribuição mensal', 180751.08, 'Vendas e serviços'),
  ('2026-09-19', 'Fretes avulsos PIX', 168620.21, 'Vendas e serviços'),
  ('2026-01-11', 'Folha de pagamento', -59000.34, 'Pessoal'),
  ('2026-01-09', 'Horas extras motoristas', -61448.18, 'Pessoal'),
  ('2026-01-03', 'Vale-alimentação', -40704.12, 'Pessoal'),
  ('2026-02-05', 'Folha de pagamento', -47626.51, 'Pessoal'),
  ('2026-02-26', 'Horas extras motoristas', -44032.94, 'Pessoal'),
  ('2026-02-17', 'Vale-alimentação', -70391.18, 'Pessoal'),
  ('2026-03-16', 'Folha de pagamento', -59949.15, 'Pessoal'),
  ('2026-03-09', 'Horas extras motoristas', -51467.99, 'Pessoal'),
  ('2026-03-14', 'Vale-alimentação', -47138.82, 'Pessoal'),
  ('2026-04-14', 'Folha de pagamento', -65753.82, 'Pessoal'),
  ('2026-04-15', 'Horas extras motoristas', -53974.48, 'Pessoal'),
  ('2026-04-05', 'Vale-alimentação', -36896.74, 'Pessoal'),
  ('2026-05-19', 'Folha de pagamento', -47737.77, 'Pessoal'),
  ('2026-05-23', 'Horas extras motoristas', -47417.58, 'Pessoal'),
  ('2026-05-26', 'Vale-alimentação', -64184.88, 'Pessoal'),
  ('2026-06-25', 'Folha de pagamento', -45907.40, 'Pessoal'),
  ('2026-06-11', 'Horas extras motoristas', -66768.55, 'Pessoal'),
  ('2026-06-15', 'Vale-alimentação', -44302.64, 'Pessoal'),
  ('2026-07-05', 'Folha de pagamento', -57392.72, 'Pessoal'),
  ('2026-07-17', 'Horas extras motoristas', -48696.45, 'Pessoal'),
  ('2026-07-03', 'Vale-alimentação', -50413.96, 'Pessoal'),
  ('2026-08-25', 'Folha de pagamento', -45702.08, 'Pessoal'),
  ('2026-08-04', 'Horas extras motoristas', -73660.71, 'Pessoal'),
  ('2026-08-15', 'Vale-alimentação', -42257.21, 'Pessoal'),
  ('2026-09-11', 'Folha de pagamento', -54085.85, 'Pessoal'),
  ('2026-09-06', 'Horas extras motoristas', -52898.44, 'Pessoal'),
  ('2026-09-20', 'Vale-alimentação', -61435.71, 'Pessoal'),
  ('2026-01-03', 'Posto Estrela Diesel', -27595.84, 'Combustível'),
  ('2026-01-27', 'Posto Rodovia Diesel', -38331.58, 'Combustível'),
  ('2026-01-21', 'Arla 32', -34983.96, 'Combustível'),
  ('2026-02-15', 'Posto Estrela Diesel', -25188.45, 'Combustível'),
  ('2026-02-16', 'Posto Rodovia Diesel', -39678.37, 'Combustível'),
  ('2026-02-20', 'Arla 32', -35602.39, 'Combustível'),
  ('2026-03-18', 'Posto Estrela Diesel', -35301.40, 'Combustível'),
  ('2026-03-10', 'Posto Rodovia Diesel', -25368.15, 'Combustível'),
  ('2026-03-21', 'Arla 32', -38499.11, 'Combustível'),
  ('2026-04-06', 'Posto Estrela Diesel', -27552.37, 'Combustível'),
  ('2026-04-23', 'Posto Rodovia Diesel', -46456.53, 'Combustível'),
  ('2026-04-11', 'Arla 32', -30411.28, 'Combustível'),
  ('2026-05-05', 'Posto Estrela Diesel', -51072.28, 'Combustível'),
  ('2026-05-04', 'Posto Rodovia Diesel', -24884.75, 'Combustível'),
  ('2026-05-04', 'Arla 32', -23729.75, 'Combustível'),
  ('2026-06-12', 'Posto Estrela Diesel', -39289.33, 'Combustível'),
  ('2026-06-19', 'Posto Rodovia Diesel', -21216.01, 'Combustível'),
  ('2026-06-27', 'Arla 32', -38379.40, 'Combustível'),
  ('2026-07-12', 'Posto Estrela Diesel', -28626.04, 'Combustível'),
  ('2026-07-20', 'Posto Rodovia Diesel', -25163.08, 'Combustível'),
  ('2026-07-07', 'Arla 32', -50676.44, 'Combustível'),
  ('2026-08-09', 'Posto Estrela Diesel', -38437.96, 'Combustível'),
  ('2026-08-09', 'Posto Rodovia Diesel', -30959.77, 'Combustível'),
  ('2026-08-17', 'Arla 32', -33352.27, 'Combustível'),
  ('2026-09-21', 'Posto Estrela Diesel', -40567.20, 'Combustível'),
  ('2026-09-14', 'Posto Rodovia Diesel', -42102.91, 'Combustível'),
  ('2026-09-25', 'Arla 32', -38979.89, 'Combustível'),
  ('2026-01-05', 'Manutenção de frota', -7250.48, 'Veículos e equipamentos'),
  ('2026-01-16', 'Pneus', -11336.46, 'Veículos e equipamentos'),
  ('2026-01-05', 'Oficina mecânica', -8009.11, 'Veículos e equipamentos'),
  ('2026-02-11', 'Manutenção de frota', -7962.69, 'Veículos e equipamentos'),
  ('2026-02-07', 'Pneus', -9668.79, 'Veículos e equipamentos'),
  ('2026-02-20', 'Oficina mecânica', -9227.13, 'Veículos e equipamentos'),
  ('2026-03-07', 'Manutenção de frota', -10942.92, 'Veículos e equipamentos'),
  ('2026-03-12', 'Pneus', -9292.44, 'Veículos e equipamentos'),
  ('2026-03-13', 'Oficina mecânica', -8399.96, 'Veículos e equipamentos'),
  ('2026-04-17', 'Manutenção de frota', -8400.23, 'Veículos e equipamentos'),
  ('2026-04-25', 'Pneus', -8242.92, 'Veículos e equipamentos'),
  ('2026-04-22', 'Oficina mecânica', -11778.98, 'Veículos e equipamentos'),
  ('2026-05-08', 'Manutenção de frota', -11952.53, 'Veículos e equipamentos'),
  ('2026-05-07', 'Pneus', -6628.10, 'Veículos e equipamentos'),
  ('2026-05-04', 'Oficina mecânica', -6965.69, 'Veículos e equipamentos'),
  ('2026-06-27', 'Manutenção de frota', -8217.09, 'Veículos e equipamentos'),
  ('2026-06-26', 'Pneus', -11980.38, 'Veículos e equipamentos'),
  ('2026-06-23', 'Oficina mecânica', -8707.73, 'Veículos e equipamentos'),
  ('2026-07-12', 'Manutenção de frota', -9145.76, 'Veículos e equipamentos'),
  ('2026-07-15', 'Pneus', -10461.48, 'Veículos e equipamentos'),
  ('2026-07-23', 'Oficina mecânica', -5528.66, 'Veículos e equipamentos'),
  ('2026-08-18', 'Manutenção de frota', -11119.54, 'Veículos e equipamentos'),
  ('2026-08-25', 'Pneus', -8936.17, 'Veículos e equipamentos'),
  ('2026-08-10', 'Oficina mecânica', -9284.29, 'Veículos e equipamentos'),
  ('2026-09-15', 'Manutenção de frota', -19648.66, 'Veículos e equipamentos'),
  ('2026-09-08', 'Pneus', -16374.95, 'Veículos e equipamentos'),
  ('2026-09-04', 'Oficina mecânica', -11356.39, 'Veículos e equipamentos'),
  ('2026-01-08', 'Impostos sobre faturamento', -25253.52, 'Impostos e tributos'),
  ('2026-01-03', 'IPVA e licenciamento', -33708.40, 'Impostos e tributos'),
  ('2026-02-22', 'Impostos sobre faturamento', -25291.87, 'Impostos e tributos'),
  ('2026-02-09', 'IPVA e licenciamento', -32821.47, 'Impostos e tributos'),
  ('2026-03-04', 'Impostos sobre faturamento', -26669.03, 'Impostos e tributos'),
  ('2026-03-15', 'IPVA e licenciamento', -31919.67, 'Impostos e tributos'),
  ('2026-04-25', 'Impostos sobre faturamento', -30585.37, 'Impostos e tributos'),
  ('2026-04-12', 'IPVA e licenciamento', -30212.59, 'Impostos e tributos'),
  ('2026-05-15', 'Impostos sobre faturamento', -35973.48, 'Impostos e tributos'),
  ('2026-05-07', 'IPVA e licenciamento', -22766.42, 'Impostos e tributos'),
  ('2026-06-28', 'Impostos sobre faturamento', -33866.49, 'Impostos e tributos'),
  ('2026-06-12', 'IPVA e licenciamento', -27262.06, 'Impostos e tributos'),
  ('2026-07-11', 'Impostos sobre faturamento', -29934.45, 'Impostos e tributos'),
  ('2026-07-04', 'IPVA e licenciamento', -30693.54, 'Impostos e tributos'),
  ('2026-08-20', 'Impostos sobre faturamento', -34878.66, 'Impostos e tributos'),
  ('2026-08-08', 'IPVA e licenciamento', -25983.34, 'Impostos e tributos'),
  ('2026-09-03', 'Impostos sobre faturamento', -33605.27, 'Impostos e tributos'),
  ('2026-09-26', 'IPVA e licenciamento', -28534.73, 'Impostos e tributos'),
  ('2026-01-20', 'Aluguel do galpão', -6094.60, 'Instalações'),
  ('2026-01-03', 'Conta de energia', -11877.34, 'Instalações'),
  ('2026-01-15', 'Conta de água', -10740.90, 'Instalações'),
  ('2026-02-10', 'Aluguel do galpão', -10444.71, 'Instalações'),
  ('2026-02-24', 'Conta de energia', -11268.15, 'Instalações'),
  ('2026-02-18', 'Conta de água', -8304.90, 'Instalações'),
  ('2026-03-23', 'Aluguel do galpão', -10055.75, 'Instalações'),
  ('2026-03-22', 'Conta de energia', -11979.62, 'Instalações'),
  ('2026-03-19', 'Conta de água', -7722.49, 'Instalações'),
  ('2026-04-22', 'Aluguel do galpão', -9905.36, 'Instalações'),
  ('2026-04-28', 'Conta de energia', -10402.69, 'Instalações'),
  ('2026-04-18', 'Conta de água', -9441.86, 'Instalações'),
  ('2026-05-20', 'Aluguel do galpão', -12063.76, 'Instalações'),
  ('2026-05-13', 'Conta de energia', -5668.06, 'Instalações'),
  ('2026-05-09', 'Conta de água', -11560.72, 'Instalações'),
  ('2026-06-06', 'Aluguel do galpão', -9345.18, 'Instalações'),
  ('2026-06-04', 'Conta de energia', -7610.62, 'Instalações'),
  ('2026-06-04', 'Conta de água', -13136.81, 'Instalações'),
  ('2026-07-14', 'Aluguel do galpão', -11630.26, 'Instalações'),
  ('2026-07-20', 'Conta de energia', -6830.68, 'Instalações'),
  ('2026-07-04', 'Conta de água', -11753.44, 'Instalações'),
  ('2026-08-18', 'Aluguel do galpão', -11583.34, 'Instalações'),
  ('2026-08-03', 'Conta de energia', -12573.42, 'Instalações'),
  ('2026-08-15', 'Conta de água', -7343.24, 'Instalações'),
  ('2026-09-03', 'Aluguel do galpão', -9013.84, 'Instalações'),
  ('2026-09-26', 'Conta de energia', -9610.86, 'Instalações'),
  ('2026-09-04', 'Conta de água', -10275.30, 'Instalações'),
  ('2026-01-22', 'Rastreamento de veículos', -5037.69, 'Administrativo'),
  ('2026-01-25', 'Contabilidade mensalidade', -8212.50, 'Administrativo'),
  ('2026-01-15', 'Seguro da frota', -4071.14, 'Administrativo'),
  ('2026-02-26', 'Rastreamento de veículos', -6952.51, 'Administrativo'),
  ('2026-02-13', 'Contabilidade mensalidade', -5182.07, 'Administrativo'),
  ('2026-02-09', 'Seguro da frota', -4995.92, 'Administrativo'),
  ('2026-03-27', 'Rastreamento de veículos', -5699.81, 'Administrativo'),
  ('2026-03-05', 'Contabilidade mensalidade', -7256.71, 'Administrativo'),
  ('2026-03-21', 'Seguro da frota', -4274.89, 'Administrativo'),
  ('2026-04-02', 'Rastreamento de veículos', -4476.17, 'Administrativo'),
  ('2026-04-25', 'Contabilidade mensalidade', -5025.33, 'Administrativo'),
  ('2026-04-03', 'Seguro da frota', -8011.00, 'Administrativo'),
  ('2026-05-03', 'Rastreamento de veículos', -6812.23, 'Administrativo'),
  ('2026-05-09', 'Contabilidade mensalidade', -4011.98, 'Administrativo'),
  ('2026-05-24', 'Seguro da frota', -5927.20, 'Administrativo'),
  ('2026-06-05', 'Rastreamento de veículos', -6893.76, 'Administrativo'),
  ('2026-06-25', 'Contabilidade mensalidade', -6285.10, 'Administrativo'),
  ('2026-06-16', 'Seguro da frota', -4147.94, 'Administrativo'),
  ('2026-07-27', 'Rastreamento de veículos', -6420.86, 'Administrativo'),
  ('2026-07-06', 'Contabilidade mensalidade', -5145.75, 'Administrativo'),
  ('2026-07-24', 'Seguro da frota', -5674.74, 'Administrativo'),
  ('2026-08-06', 'Rastreamento de veículos', -5261.86, 'Administrativo'),
  ('2026-08-12', 'Contabilidade mensalidade', -7803.85, 'Administrativo'),
  ('2026-08-14', 'Seguro da frota', -4684.29, 'Administrativo'),
  ('2026-09-09', 'Rastreamento de veículos', -7226.65, 'Administrativo'),
  ('2026-09-18', 'Contabilidade mensalidade', -5341.40, 'Administrativo'),
  ('2026-09-15', 'Seguro da frota', -7251.95, 'Administrativo'),
  ('2026-01-10', 'Terceirizados de carga e descarga', -12199.43, 'Serviços de terceiros'),
  ('2026-02-18', 'Terceirizados de carga e descarga', -11879.20, 'Serviços de terceiros'),
  ('2026-03-18', 'Terceirizados de carga e descarga', -11295.22, 'Serviços de terceiros'),
  ('2026-04-04', 'Terceirizados de carga e descarga', -11732.30, 'Serviços de terceiros'),
  ('2026-05-25', 'Terceirizados de carga e descarga', -11522.17, 'Serviços de terceiros'),
  ('2026-06-04', 'Terceirizados de carga e descarga', -11957.62, 'Serviços de terceiros'),
  ('2026-07-02', 'Terceirizados de carga e descarga', -12117.50, 'Serviços de terceiros'),
  ('2026-08-08', 'Terceirizados de carga e descarga', -11325.53, 'Serviços de terceiros'),
  ('2026-09-10', 'Terceirizados de carga e descarga', -12549.78, 'Serviços de terceiros'),
  ('2026-01-05', 'Site e anúncios', -2944.68, 'Marketing'),
  ('2026-02-21', 'Site e anúncios', -3094.44, 'Marketing'),
  ('2026-03-06', 'Site e anúncios', -2956.94, 'Marketing'),
  ('2026-04-24', 'Site e anúncios', -2720.78, 'Marketing'),
  ('2026-05-14', 'Site e anúncios', -3100.65, 'Marketing'),
  ('2026-06-10', 'Site e anúncios', -3096.30, 'Marketing'),
  ('2026-07-04', 'Site e anúncios', -2780.05, 'Marketing'),
  ('2026-08-04', 'Site e anúncios', -2687.65, 'Marketing'),
  ('2026-09-27', 'Site e anúncios', -3189.10, 'Marketing'),
  ('2026-01-04', 'Tarifa bancária', -1848.73, 'Bancários'),
  ('2026-01-16', 'Juros de antecipação', -1384.25, 'Bancários')
) as x(data, descricao, valor, categoria) left join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000002' and c.nome = x.categoria;
insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem, carga_id)
select '00000000-0000-4000-a000-000000000002', x.data::date, x.descricao, x.valor, c.id, 'planilha', '00000000-0000-4000-b000-000000000002' from (values
  ('2026-02-15', 'Tarifa bancária', -1098.24, 'Bancários'),
  ('2026-02-24', 'Juros de antecipação', -2055.19, 'Bancários'),
  ('2026-03-03', 'Tarifa bancária', -2198.55, 'Bancários'),
  ('2026-03-04', 'Juros de antecipação', -1145.36, 'Bancários'),
  ('2026-04-22', 'Tarifa bancária', -1223.25, 'Bancários'),
  ('2026-04-28', 'Juros de antecipação', -1959.29, 'Bancários'),
  ('2026-05-21', 'Tarifa bancária', -1747.79, 'Bancários'),
  ('2026-05-27', 'Juros de antecipação', -1887.41, 'Bancários'),
  ('2026-06-06', 'Tarifa bancária', -1572.46, 'Bancários'),
  ('2026-06-27', 'Juros de antecipação', -1710.18, 'Bancários'),
  ('2026-07-21', 'Tarifa bancária', -1845.94, 'Bancários'),
  ('2026-07-27', 'Juros de antecipação', -1615.96, 'Bancários'),
  ('2026-08-17', 'Tarifa bancária', -1650.23, 'Bancários'),
  ('2026-08-17', 'Juros de antecipação', -1908.88, 'Bancários'),
  ('2026-09-18', 'Tarifa bancária', -1440.67, 'Bancários'),
  ('2026-09-28', 'Juros de antecipação', -2254.33, 'Bancários'),
  ('2026-01-04', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-02-07', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-03-24', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-04-03', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-05-26', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-06-16', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-07-15', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-08-09', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-09-17', 'Pró-labore sócios', -30000.00, 'Pró-labore e retiradas'),
  ('2026-01-23', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-02-08', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-03-22', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-04-15', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-05-04', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-06-17', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-07-23', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-08-23', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-09-13', 'Parcela financiamento caminhões', -21800.00, 'Parcelas de empréstimos'),
  ('2026-07-09', 'Financiamento de caminhão liberado', 150000.00, 'Empréstimos recebidos'),
  ('2026-07-13', 'Compra de caminhão', -182000.00, 'Máquinas e equipamentos'),
  ('2026-09-12', 'PIX recebido 00482', 1840.00, null::text),
  ('2026-09-18', 'Pagamento boleto diverso', -612.40, null::text),
  ('2026-09-22', 'Transferência enviada 7731', -1350.00, null::text)
) as x(data, descricao, valor, categoria) left join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000002' and c.nome = x.categoria;
update empresa_viva.cargas set linhas = 239 where id = '00000000-0000-4000-b000-000000000002';
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000001', '00000000-0000-4000-a000-000000000002', 'Luciana Brito', 'Coordenadora financeira', 'Financeiro', '2019-05-06'::date, '62951487561');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000001', t.id, '00000000-0000-4000-a000-000000000002', ('2019-05-06'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000001', '2024-02-01'::date, 'mudanca_funcao', 'Assumiu a coordenação financeira');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000001', 12, 8, 25, 55, 'C', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000001', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil C');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000002', '00000000-0000-4000-a000-000000000002', 'Sérgio Motta', 'Motorista', 'Operação', '2022-04-04'::date, '62990360789');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000002', t.id, '00000000-0000-4000-a000-000000000002', ('2022-04-04'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000002', '2026-08-25'::date, 'anotacao', 'Cobriu rota de férias por 3 semanas');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000002', current_date - 4, 'treinamento', 'Reciclagem de direção defensiva');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000002', 8, 17, 54, 21, 'S', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000002', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil S');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000003', '00000000-0000-4000-a000-000000000002', 'Diego Ferraz', 'Motorista', 'Operação', current_date - 45, '62952088618');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000003', t.id, '00000000-0000-4000-a000-000000000002', (current_date - 45) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função');
insert into empresa_viva.disc_convites (empresa_id, colaborador_id, criado_em) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000003', now() - interval '2 days');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000004', '00000000-0000-4000-a000-000000000002', 'Ana Paula Rocha', 'Analista de logística', 'Logística', '2025-01-13'::date, '62924222700');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000004', t.id, '00000000-0000-4000-a000-000000000002', ('2025-01-13'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000004', '2026-07-20'::date, 'treinamento', 'Curso de roteirização concluído');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000004', 12, 8, 25, 55, 'C', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000004', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil C');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000005', '00000000-0000-4000-a000-000000000002', 'Tiago Neves', 'Ajudante', 'Operação', current_date - 8, '62974323037');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000005', t.id, '00000000-0000-4000-a000-000000000002', (current_date - 8) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000006', '00000000-0000-4000-a000-000000000002', 'Márcio Lopes', 'Motorista', 'Operação', '2020-09-14'::date, '62910340508');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000006', t.id, '00000000-0000-4000-a000-000000000002', ('2020-09-14'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000006', current_date - 6, 'avaliacao', 'Avaliação anual: pontualidade exemplar');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000006', 58, 18, 12, 12, 'D', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000006', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil D');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000007', '00000000-0000-4000-a000-000000000002', 'Rogério Sales', 'Mecânico', 'Manutenção', '2023-03-20'::date, '62966913766');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000007', t.id, '00000000-0000-4000-a000-000000000002', ('2023-03-20'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000007', 8, 17, 54, 21, 'S', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000007', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil S');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c002-000000000008', '00000000-0000-4000-a000-000000000002', 'Patrícia Nogueira', 'Assistente de RH', 'Administrativo', '2024-08-05'::date, '62990259843');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c002-000000000008', t.id, '00000000-0000-4000-a000-000000000002', ('2024-08-05'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000002' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000008', 17, 54, 17, 12, 'I', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000002', '00000000-0000-4000-c002-000000000008', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil I');

-- Clínica Sollus
insert into empresa_viva.empresas (id, nome, perfil, ano_inicio) values ('00000000-0000-4000-a000-000000000003', 'Clínica Sollus', 'clinica', 2026);
insert into empresa_viva.saldos_iniciais (empresa_id, ano, valor) values ('00000000-0000-4000-a000-000000000003', 2026, 35000);
insert into empresa_viva.regras_classificacao (empresa_id, contem, categoria_id)
select '00000000-0000-4000-a000-000000000003', r.contem, c.id from (values ('folha', 'Pessoal'), ('vale-', 'Pessoal'), ('ferias', 'Pessoal'), ('simples nacional', 'Impostos e tributos'), ('imposto', 'Impostos e tributos'), ('aluguel', 'Instalações'), ('energia', 'Instalações'), ('conta de agua', 'Instalações'), ('contabilidade', 'Administrativo'), ('tarifa bancaria', 'Bancários'), ('maquininha', 'Bancários'), ('pro-labore', 'Pró-labore e retiradas'), ('impulsionamento', 'Marketing'), ('atendimentos', 'Vendas e serviços'), ('insumos', 'Fornecedores e insumos'), ('medicamentos', 'Fornecedores e insumos'), ('plantoes', 'Pessoal'), ('laboratorio', 'Serviços de terceiros')) as r(contem, categoria)
join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000003' and c.nome = r.categoria;
insert into empresa_viva.cargas (id, empresa_id, arquivo, linhas, mapeamento) values ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000003', 'extrato-janeiro-a-setembro-2026.xlsx', 0, '{"cabecalho":0,"data":0,"descricao":1,"valor":2}');
insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem, carga_id)
select '00000000-0000-4000-a000-000000000003', x.data::date, x.descricao, x.valor, c.id, 'planilha', '00000000-0000-4000-b000-000000000003' from (values
  ('2026-01-05', 'Atendimentos convênios', 89865.00, 'Vendas e serviços'),
  ('2026-01-22', 'Atendimentos particulares cartão', 76254.43, 'Vendas e serviços'),
  ('2026-01-27', 'Atendimentos particulares PIX', 70669.95, 'Vendas e serviços'),
  ('2026-02-10', 'Atendimentos convênios', 99324.74, 'Vendas e serviços'),
  ('2026-02-20', 'Atendimentos particulares cartão', 88508.71, 'Vendas e serviços'),
  ('2026-02-13', 'Atendimentos particulares PIX', 52617.54, 'Vendas e serviços'),
  ('2026-03-05', 'Atendimentos convênios', 55519.28, 'Vendas e serviços'),
  ('2026-03-06', 'Atendimentos particulares cartão', 92532.82, 'Vendas e serviços'),
  ('2026-03-13', 'Atendimentos particulares PIX', 85779.26, 'Vendas e serviços'),
  ('2026-04-18', 'Atendimentos convênios', 81124.80, 'Vendas e serviços'),
  ('2026-04-21', 'Atendimentos particulares cartão', 71413.04, 'Vendas e serviços'),
  ('2026-04-08', 'Atendimentos particulares PIX', 79290.26, 'Vendas e serviços'),
  ('2026-05-22', 'Atendimentos convênios', 79057.82, 'Vendas e serviços'),
  ('2026-05-16', 'Atendimentos particulares cartão', 86649.21, 'Vendas e serviços'),
  ('2026-05-14', 'Atendimentos particulares PIX', 74057.87, 'Vendas e serviços'),
  ('2026-06-25', 'Atendimentos convênios', 46802.55, 'Vendas e serviços'),
  ('2026-06-24', 'Atendimentos particulares cartão', 103477.70, 'Vendas e serviços'),
  ('2026-06-07', 'Atendimentos particulares PIX', 83359.79, 'Vendas e serviços'),
  ('2026-07-08', 'Atendimentos convênios', 101335.44, 'Vendas e serviços'),
  ('2026-07-28', 'Atendimentos particulares cartão', 101706.83, 'Vendas e serviços'),
  ('2026-07-20', 'Atendimentos particulares PIX', 58957.73, 'Vendas e serviços'),
  ('2026-08-14', 'Atendimentos convênios', 117581.62, 'Vendas e serviços'),
  ('2026-08-12', 'Atendimentos particulares cartão', 85527.76, 'Vendas e serviços'),
  ('2026-08-12', 'Atendimentos particulares PIX', 63590.62, 'Vendas e serviços'),
  ('2026-09-26', 'Atendimentos convênios', 96541.71, 'Vendas e serviços'),
  ('2026-09-03', 'Atendimentos particulares cartão', 96470.93, 'Vendas e serviços'),
  ('2026-09-11', 'Atendimentos particulares PIX', 94387.36, 'Vendas e serviços'),
  ('2026-01-08', 'Folha de pagamento', -28656.67, 'Pessoal'),
  ('2026-01-06', 'Plantões extras', -31168.11, 'Pessoal'),
  ('2026-01-15', 'Vale-transporte', -30183.18, 'Pessoal'),
  ('2026-02-11', 'Folha de pagamento', -18484.15, 'Pessoal'),
  ('2026-02-07', 'Plantões extras', -38739.15, 'Pessoal'),
  ('2026-02-24', 'Vale-transporte', -32279.63, 'Pessoal'),
  ('2026-03-13', 'Folha de pagamento', -26921.88, 'Pessoal'),
  ('2026-03-27', 'Plantões extras', -23373.13, 'Pessoal'),
  ('2026-03-24', 'Vale-transporte', -38865.27, 'Pessoal'),
  ('2026-04-26', 'Folha de pagamento', -31980.66, 'Pessoal'),
  ('2026-04-20', 'Plantões extras', -26979.06, 'Pessoal'),
  ('2026-04-06', 'Vale-transporte', -29992.12, 'Pessoal'),
  ('2026-05-17', 'Folha de pagamento', -21914.25, 'Pessoal'),
  ('2026-05-28', 'Plantões extras', -43766.55, 'Pessoal'),
  ('2026-05-24', 'Vale-transporte', -21282.90, 'Pessoal'),
  ('2026-06-10', 'Folha de pagamento', -27250.01, 'Pessoal'),
  ('2026-06-17', 'Plantões extras', -33457.78, 'Pessoal'),
  ('2026-06-24', 'Vale-transporte', -27375.62, 'Pessoal'),
  ('2026-07-19', 'Folha de pagamento', -33881.90, 'Pessoal'),
  ('2026-07-10', 'Plantões extras', -25823.77, 'Pessoal'),
  ('2026-07-18', 'Vale-transporte', -30115.06, 'Pessoal'),
  ('2026-08-05', 'Folha de pagamento', -29045.79, 'Pessoal'),
  ('2026-08-21', 'Plantões extras', -29744.78, 'Pessoal'),
  ('2026-08-05', 'Vale-transporte', -31379.43, 'Pessoal'),
  ('2026-09-06', 'Folha de pagamento', -42926.97, 'Pessoal'),
  ('2026-09-13', 'Plantões extras', -30536.61, 'Pessoal'),
  ('2026-09-22', 'Vale-transporte', -25176.42, 'Pessoal'),
  ('2026-01-12', 'Insumos médicos', -23325.30, 'Fornecedores e insumos'),
  ('2026-01-19', 'Material descartável', -18142.19, 'Fornecedores e insumos'),
  ('2026-01-05', 'Medicamentos', -12325.18, 'Fornecedores e insumos'),
  ('2026-02-04', 'Insumos médicos', -22356.45, 'Fornecedores e insumos'),
  ('2026-02-22', 'Material descartável', -17000.94, 'Fornecedores e insumos'),
  ('2026-02-08', 'Medicamentos', -12059.93, 'Fornecedores e insumos'),
  ('2026-03-21', 'Insumos médicos', -13006.91, 'Fornecedores e insumos'),
  ('2026-03-22', 'Material descartável', -18641.54, 'Fornecedores e insumos'),
  ('2026-03-14', 'Medicamentos', -18523.49, 'Fornecedores e insumos'),
  ('2026-04-21', 'Insumos médicos', -12668.95, 'Fornecedores e insumos'),
  ('2026-04-19', 'Material descartável', -23826.48, 'Fornecedores e insumos'),
  ('2026-04-05', 'Medicamentos', -14352.69, 'Fornecedores e insumos'),
  ('2026-05-14', 'Insumos médicos', -11611.28, 'Fornecedores e insumos'),
  ('2026-05-19', 'Material descartável', -16657.46, 'Fornecedores e insumos'),
  ('2026-05-25', 'Medicamentos', -22424.70, 'Fornecedores e insumos'),
  ('2026-06-07', 'Insumos médicos', -16281.92, 'Fornecedores e insumos'),
  ('2026-06-05', 'Material descartável', -19672.22, 'Fornecedores e insumos'),
  ('2026-06-20', 'Medicamentos', -14962.41, 'Fornecedores e insumos'),
  ('2026-07-23', 'Insumos médicos', -13723.54, 'Fornecedores e insumos'),
  ('2026-07-03', 'Material descartável', -20246.85, 'Fornecedores e insumos'),
  ('2026-07-04', 'Medicamentos', -15976.91, 'Fornecedores e insumos'),
  ('2026-08-24', 'Insumos médicos', -18133.22, 'Fornecedores e insumos'),
  ('2026-08-09', 'Material descartável', -20517.86, 'Fornecedores e insumos'),
  ('2026-08-23', 'Medicamentos', -14948.92, 'Fornecedores e insumos'),
  ('2026-09-17', 'Insumos médicos', -19067.65, 'Fornecedores e insumos'),
  ('2026-09-22', 'Material descartável', -25262.65, 'Fornecedores e insumos'),
  ('2026-09-17', 'Medicamentos', -16869.70, 'Fornecedores e insumos'),
  ('2026-01-20', 'Impostos sobre faturamento', -30824.84, 'Impostos e tributos'),
  ('2026-02-19', 'Impostos sobre faturamento', -30125.88, 'Impostos e tributos'),
  ('2026-03-06', 'Impostos sobre faturamento', -31675.21, 'Impostos e tributos'),
  ('2026-04-10', 'Impostos sobre faturamento', -31721.53, 'Impostos e tributos'),
  ('2026-05-18', 'Impostos sobre faturamento', -30820.57, 'Impostos e tributos'),
  ('2026-06-10', 'Impostos sobre faturamento', -30094.92, 'Impostos e tributos'),
  ('2026-07-16', 'Impostos sobre faturamento', -30878.65, 'Impostos e tributos'),
  ('2026-08-06', 'Impostos sobre faturamento', -31700.00, 'Impostos e tributos'),
  ('2026-09-26', 'Impostos sobre faturamento', -34180.00, 'Impostos e tributos'),
  ('2026-01-21', 'Aluguel da clínica', -5962.94, 'Instalações'),
  ('2026-01-02', 'Conta de energia', -8709.75, 'Instalações'),
  ('2026-01-08', 'Conta de água', -5748.38, 'Instalações'),
  ('2026-02-28', 'Aluguel da clínica', -7151.57, 'Instalações'),
  ('2026-02-27', 'Conta de energia', -6297.85, 'Instalações'),
  ('2026-02-18', 'Conta de água', -7111.57, 'Instalações'),
  ('2026-03-06', 'Aluguel da clínica', -7720.38, 'Instalações'),
  ('2026-03-17', 'Conta de energia', -6866.78, 'Instalações'),
  ('2026-03-24', 'Conta de água', -6472.63, 'Instalações'),
  ('2026-04-06', 'Aluguel da clínica', -6013.23, 'Instalações'),
  ('2026-04-11', 'Conta de energia', -4991.35, 'Instalações'),
  ('2026-04-11', 'Conta de água', -9639.48, 'Instalações'),
  ('2026-05-27', 'Aluguel da clínica', -7472.38, 'Instalações'),
  ('2026-05-23', 'Conta de energia', -5378.69, 'Instalações'),
  ('2026-05-28', 'Conta de água', -7985.91, 'Instalações'),
  ('2026-06-28', 'Aluguel da clínica', -6147.95, 'Instalações'),
  ('2026-06-09', 'Conta de energia', -7985.87, 'Instalações'),
  ('2026-06-06', 'Conta de água', -6273.06, 'Instalações'),
  ('2026-07-22', 'Aluguel da clínica', -5903.89, 'Instalações'),
  ('2026-07-10', 'Conta de energia', -7314.55, 'Instalações'),
  ('2026-07-10', 'Conta de água', -7341.37, 'Instalações'),
  ('2026-08-24', 'Aluguel da clínica', -4123.73, 'Instalações'),
  ('2026-08-06', 'Conta de energia', -9532.39, 'Instalações'),
  ('2026-08-07', 'Conta de água', -7158.88, 'Instalações'),
  ('2026-09-18', 'Aluguel da clínica', -6382.71, 'Instalações'),
  ('2026-09-05', 'Conta de energia', -9441.64, 'Instalações'),
  ('2026-09-28', 'Conta de água', -5635.65, 'Instalações'),
  ('2026-01-27', 'Manutenção preventiva equipamentos', -9529.24, 'Veículos e equipamentos'),
  ('2026-02-12', 'Manutenção preventiva equipamentos', -9494.86, 'Veículos e equipamentos'),
  ('2026-03-23', 'Manutenção preventiva equipamentos', -9902.45, 'Veículos e equipamentos'),
  ('2026-04-17', 'Manutenção preventiva equipamentos', -9918.64, 'Veículos e equipamentos'),
  ('2026-05-21', 'Manutenção preventiva equipamentos', -9894.03, 'Veículos e equipamentos'),
  ('2026-06-22', 'Manutenção preventiva equipamentos', -9714.60, 'Veículos e equipamentos'),
  ('2026-07-12', 'Manutenção preventiva equipamentos', -9808.10, 'Veículos e equipamentos'),
  ('2026-08-07', 'Manutenção preventiva equipamentos', -9700.00, 'Veículos e equipamentos'),
  ('2026-09-25', 'Manutenção preventiva equipamentos', -9840.00, 'Veículos e equipamentos'),
  ('2026-01-08', 'Laboratório parceiro', -4406.05, 'Serviços de terceiros'),
  ('2026-01-15', 'Limpeza terceirizada', -3030.92, 'Serviços de terceiros'),
  ('2026-02-19', 'Laboratório parceiro', -3822.73, 'Serviços de terceiros'),
  ('2026-02-22', 'Limpeza terceirizada', -3665.89, 'Serviços de terceiros'),
  ('2026-03-24', 'Laboratório parceiro', -2703.86, 'Serviços de terceiros'),
  ('2026-03-10', 'Limpeza terceirizada', -4232.46, 'Serviços de terceiros'),
  ('2026-04-16', 'Laboratório parceiro', -3944.44, 'Serviços de terceiros'),
  ('2026-04-17', 'Limpeza terceirizada', -3648.70, 'Serviços de terceiros'),
  ('2026-05-13', 'Laboratório parceiro', -2304.60, 'Serviços de terceiros'),
  ('2026-05-16', 'Limpeza terceirizada', -5052.48, 'Serviços de terceiros'),
  ('2026-06-19', 'Laboratório parceiro', -4025.50, 'Serviços de terceiros'),
  ('2026-06-09', 'Limpeza terceirizada', -3231.44, 'Serviços de terceiros'),
  ('2026-07-26', 'Laboratório parceiro', -4004.06, 'Serviços de terceiros'),
  ('2026-07-18', 'Limpeza terceirizada', -2962.82, 'Serviços de terceiros'),
  ('2026-08-14', 'Laboratório parceiro', -2508.07, 'Serviços de terceiros'),
  ('2026-08-26', 'Limpeza terceirizada', -4398.50, 'Serviços de terceiros'),
  ('2026-09-04', 'Laboratório parceiro', -3394.26, 'Serviços de terceiros'),
  ('2026-09-15', 'Limpeza terceirizada', -3734.84, 'Serviços de terceiros'),
  ('2026-01-08', 'Campanha de captação', -2684.59, 'Marketing'),
  ('2026-01-26', 'Impulsionamento redes sociais', -1985.63, 'Marketing'),
  ('2026-02-19', 'Campanha de captação', -2137.04, 'Marketing'),
  ('2026-02-22', 'Impulsionamento redes sociais', -2306.08, 'Marketing'),
  ('2026-03-25', 'Campanha de captação', -2212.52, 'Marketing'),
  ('2026-03-12', 'Impulsionamento redes sociais', -2146.79, 'Marketing'),
  ('2026-04-03', 'Campanha de captação', -2358.05, 'Marketing'),
  ('2026-04-12', 'Impulsionamento redes sociais', -2434.31, 'Marketing'),
  ('2026-05-08', 'Campanha de captação', -1926.59, 'Marketing'),
  ('2026-05-03', 'Impulsionamento redes sociais', -2471.64, 'Marketing'),
  ('2026-06-22', 'Campanha de captação', -2335.79, 'Marketing'),
  ('2026-06-26', 'Impulsionamento redes sociais', -2391.36, 'Marketing'),
  ('2026-07-17', 'Campanha de captação', -1907.29, 'Marketing'),
  ('2026-07-16', 'Impulsionamento redes sociais', -2463.46, 'Marketing'),
  ('2026-08-09', 'Campanha de captação', -2533.57, 'Marketing'),
  ('2026-08-03', 'Impulsionamento redes sociais', -2146.43, 'Marketing'),
  ('2026-09-21', 'Campanha de captação', -2962.67, 'Marketing'),
  ('2026-09-27', 'Impulsionamento redes sociais', -2867.33, 'Marketing'),
  ('2026-01-25', 'Tarifa bancária', -414.46, 'Bancários'),
  ('2026-01-11', 'Taxa das maquininhas', -789.99, 'Bancários'),
  ('2026-02-06', 'Tarifa bancária', -471.80, 'Bancários'),
  ('2026-02-23', 'Taxa das maquininhas', -647.36, 'Bancários'),
  ('2026-03-04', 'Tarifa bancária', -416.73, 'Bancários'),
  ('2026-03-23', 'Taxa das maquininhas', -808.39, 'Bancários'),
  ('2026-04-21', 'Tarifa bancária', -610.51, 'Bancários'),
  ('2026-04-18', 'Taxa das maquininhas', -595.07, 'Bancários'),
  ('2026-05-14', 'Tarifa bancária', -607.34, 'Bancários'),
  ('2026-05-19', 'Taxa das maquininhas', -481.69, 'Bancários'),
  ('2026-06-13', 'Tarifa bancária', -627.38, 'Bancários'),
  ('2026-06-11', 'Taxa das maquininhas', -661.04, 'Bancários'),
  ('2026-07-03', 'Tarifa bancária', -566.66, 'Bancários'),
  ('2026-07-21', 'Taxa das maquininhas', -562.26, 'Bancários'),
  ('2026-08-12', 'Tarifa bancária', -670.19, 'Bancários'),
  ('2026-08-14', 'Taxa das maquininhas', -514.41, 'Bancários'),
  ('2026-09-09', 'Tarifa bancária', -489.95, 'Bancários'),
  ('2026-09-20', 'Taxa das maquininhas', -827.11, 'Bancários'),
  ('2026-01-09', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-02-11', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-03-08', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-04-27', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-05-15', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-06-03', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-07-14', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-08-04', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-09-08', 'Pró-labore sócios', -25000.00, 'Pró-labore e retiradas'),
  ('2026-08-18', 'Compra de equipamento de ultrassom', -38000.00, 'Máquinas e equipamentos'),
  ('2026-09-12', 'PIX recebido 00482', 1840.00, null::text),
  ('2026-09-18', 'Pagamento boleto diverso', -612.40, null::text),
  ('2026-09-22', 'Transferência enviada 7731', -1350.00, null::text)
) as x(data, descricao, valor, categoria) left join empresa_viva.categorias c on c.empresa_id = '00000000-0000-4000-a000-000000000003' and c.nome = x.categoria;
update empresa_viva.cargas set linhas = 193 where id = '00000000-0000-4000-b000-000000000003';
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c003-000000000001', '00000000-0000-4000-a000-000000000003', 'Helena Dias', 'Médica responsável', 'Corpo clínico', '2018-06-04'::date, '62926696592');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c003-000000000001', t.id, '00000000-0000-4000-a000-000000000003', ('2018-06-04'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000003' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000001', '2022-03-01'::date, 'mudanca_funcao', 'Assumiu a responsabilidade técnica');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000001', 12, 8, 25, 55, 'C', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000001', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil C');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c003-000000000002', '00000000-0000-4000-a000-000000000003', 'Fernanda Luz', 'Enfermeira', 'Enfermagem', current_date - 40, '62928533688');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c003-000000000002', t.id, '00000000-0000-4000-a000-000000000003', (current_date - 40) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000003' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000002', 8, 17, 54, 21, 'S', '[]'::jsonb, (current_date - 40 + 3) + time '12:00');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000002', ((current_date - 40 + 3) + time '12:00')::date, 'disc', 'DISC respondido pelo celular: perfil S');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c003-000000000003', '00000000-0000-4000-a000-000000000003', 'Patrícia Gomes', 'Técnica de enfermagem', 'Enfermagem', current_date - 38, '62970738090');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c003-000000000003', t.id, '00000000-0000-4000-a000-000000000003', (current_date - 38) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000003' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time');
insert into empresa_viva.disc_convites (empresa_id, colaborador_id, criado_em) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000003', now() - interval '2 days');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c003-000000000004', '00000000-0000-4000-a000-000000000003', 'Bruno Castro', 'Recepcionista', 'Recepção', current_date - 5, '62927758572');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c003-000000000005', '00000000-0000-4000-a000-000000000003', 'Otávio Pires', 'Auxiliar administrativo', 'Administrativo', '2024-02-05'::date, '62976135369');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c003-000000000005', t.id, '00000000-0000-4000-a000-000000000003', ('2024-02-05'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000003' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000005', '2025-11-03'::date, 'mudanca_funcao', 'Mudou da recepção para o administrativo');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000005', 8, 17, 54, 21, 'S', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000005', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil S');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c003-000000000006', '00000000-0000-4000-a000-000000000003', 'Camila Freitas', 'Recepcionista', 'Recepção', '2025-06-09'::date, '62992079236');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c003-000000000006', t.id, '00000000-0000-4000-a000-000000000003', ('2025-06-09'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000003' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000006', current_date - 1, 'anotacao', 'Conversa sobre conflito com a enfermagem');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000006', 17, 54, 17, 12, 'I', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000006', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil I');
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, setor, data_entrada, telefone) values ('00000000-0000-4000-c003-000000000007', '00000000-0000-4000-a000-000000000003', 'Rafaela Martins', 'Enfermeira', 'Enfermagem', '2021-10-18'::date, '62919086090');
insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id, concluida_em)
select '00000000-0000-4000-c003-000000000007', t.id, '00000000-0000-4000-a000-000000000003', ('2021-10-18'::date) + (t.ordem * 3) from empresa_viva.etapas_integracao t where t.empresa_id = '00000000-0000-4000-a000-000000000003' and t.nome in ('Documentação e contrato', 'Apresentação da empresa e do time', 'Treinamento da função', 'Acompanhamento de 30 dias');
insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas, respondido_em) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000007', 8, 17, 54, 21, 'S', '[]'::jsonb, '2026-03-10 12:00:00-03'::timestamptz);
insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto) values ('00000000-0000-4000-a000-000000000003', '00000000-0000-4000-c003-000000000007', ('2026-03-10 12:00:00-03'::timestamptz)::date, 'disc', 'DISC respondido pelo celular: perfil S');

-- Religa os usuários da demonstração (apagar as empresas acima desfaz os vínculos). Sem os usuários criados, devolve 0.
select empresa_viva.ligar_usuarios_demonstracao() as usuarios_ligados;
commit;
