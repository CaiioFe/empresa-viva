-- TASK-003: o que o banco faz sozinho.
-- Empresa nova nasce com o plano de contas padrão (17 categorias) e as 4 etapas de integração;
-- colaborador novo ganha o evento de contratação na jornada.
-- Dados 100% inventados. Tudo volta atrás no rollback do fim.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- ---------------------------------------------------------------------------
-- Preparação (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at) values
  ('20000000-0000-4000-8000-000000000001', 'rh.x@teste.local', 'authenticated', 'authenticated', '{}', '{}', now());

insert into empresa_viva.empresas (id, nome) values
  ('d0000000-0000-4000-8000-00000000000d', 'Empresa Teste X');

insert into empresa_viva.membros (empresa_id, usuario_id, papel) values
  ('d0000000-0000-4000-8000-00000000000d', '20000000-0000-4000-8000-000000000001', 'rh');

-- ---------------------------------------------------------------------------
-- Plano de contas e etapas padrão
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from empresa_viva.categorias where empresa_id = 'd0000000-0000-4000-8000-00000000000d'),
  17::bigint,
  'empresa nova nasce com 17 categorias'
);

select results_eq(
  $$select grupo::text as nome_do_grupo, count(*) from empresa_viva.categorias
    where empresa_id = 'd0000000-0000-4000-8000-00000000000d'
    group by grupo order by grupo$$,
  $$values ('recebimentos'::text, 2::bigint),
           ('pagamentos_operacionais', 9),
           ('investimentos', 2),
           ('acionistas', 1),
           ('financiamento', 2),
           ('nao_operacional', 1)$$,
  'categorias distribuídas pelos seis grupos'
);

select results_eq(
  $$select nome from empresa_viva.categorias
    where empresa_id = 'd0000000-0000-4000-8000-00000000000d'
    order by grupo, ordem$$,
  $$values ('Vendas e serviços'::text),
           ('Outros recebimentos'),
           ('Pessoal'),
           ('Fornecedores e insumos'),
           ('Impostos e tributos'),
           ('Administrativo'),
           ('Instalações'),
           ('Veículos e equipamentos'),
           ('Serviços de terceiros'),
           ('Marketing'),
           ('Bancários'),
           ('Máquinas e equipamentos'),
           ('Obras e reformas'),
           ('Pró-labore e retiradas'),
           ('Empréstimos recebidos'),
           ('Parcelas de empréstimos'),
           ('Outras entradas e saídas')$$,
  'plano de contas padrão na ordem certa'
);

select is(
  (select count(*) from empresa_viva.etapas_integracao where empresa_id = 'd0000000-0000-4000-8000-00000000000d'),
  4::bigint,
  'empresa nova nasce com 4 etapas de integração'
);

select results_eq(
  $$select nome from empresa_viva.etapas_integracao
    where empresa_id = 'd0000000-0000-4000-8000-00000000000d'
    order by ordem$$,
  $$values ('Documentação e contrato'::text),
           ('Apresentação da empresa e do time'),
           ('Treinamento da função'),
           ('Acompanhamento de 30 dias')$$,
  'etapas de integração padrão na ordem certa'
);

select lives_ok(
  $$select empresa_viva.criar_plano_padrao('d0000000-0000-4000-8000-00000000000d')$$,
  'chamar o plano padrão de novo não quebra'
);

select is(
  (select count(*) from empresa_viva.categorias where empresa_id = 'd0000000-0000-4000-8000-00000000000d'),
  17::bigint,
  'chamar o plano padrão de novo não duplica categorias'
);

select is(
  (select ano_inicio from empresa_viva.empresas where id = 'd0000000-0000-4000-8000-00000000000d'),
  extract(year from now())::int,
  'ano de início do caixa é o ano corrente por padrão'
);

-- ---------------------------------------------------------------------------
-- Evento de contratação
-- ---------------------------------------------------------------------------
insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, data_entrada) values
  ('c2000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-00000000000d', 'Pessoa Um', 'Vendedora', '2026-02-01');

insert into empresa_viva.colaboradores (id, empresa_id, nome, data_entrada) values
  ('c2000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-00000000000d', 'Pessoa Dois', '2026-03-01');

select results_eq(
  $$select tipo::text, data, texto from empresa_viva.eventos
    where colaborador_id = 'c2000000-0000-4000-8000-000000000001'$$,
  $$values ('contratacao'::text, '2026-02-01'::date, 'Contratado como Vendedora'::text)$$,
  'colaborador novo ganha o evento de contratação com a data de entrada'
);

select results_eq(
  $$select texto from empresa_viva.eventos
    where colaborador_id = 'c2000000-0000-4000-8000-000000000002'$$,
  $$values ('Contratado'::text)$$,
  'sem função, o texto é só "Contratado"'
);

-- ---------------------------------------------------------------------------
-- O RH cadastra e o gatilho funciona mesmo pela trava de acesso
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"20000000-0000-4000-8000-000000000001","role":"authenticated"}';

select lives_ok(
  $$insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, data_entrada)
    values ('c2000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-00000000000d',
            'Pessoa Três', 'Motorista', '2026-04-01')$$,
  'RH cadastra colaborador'
);
select is(
  (select count(*) from empresa_viva.eventos
   where colaborador_id = 'c2000000-0000-4000-8000-000000000003' and tipo = 'contratacao'),
  1::bigint,
  'cadastro do RH também gera o evento de contratação'
);
select throws_ok(
  $$select empresa_viva.criar_plano_padrao('d0000000-0000-4000-8000-00000000000d')$$,
  '42501', null, 'ninguém logado executa criar_plano_padrao'
);
select throws_ok(
  $$insert into empresa_viva.empresas (nome) values ('Empresa Intrusa')$$,
  '42501', null, 'ninguém logado cria empresa'
);
reset role;

select is(
  (select criado_por from empresa_viva.eventos
   where colaborador_id = 'c2000000-0000-4000-8000-000000000003' and tipo = 'contratacao'),
  '20000000-0000-4000-8000-000000000001'::uuid,
  'evento de contratação guarda quem cadastrou'
);

select * from finish();
rollback;
