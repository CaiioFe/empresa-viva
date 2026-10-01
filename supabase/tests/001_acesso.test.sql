-- TASK-003: trava de acesso por papel no schema empresa_viva.
-- Prova que: aluno da comunidade (logado, sem vínculo) não vê nada; uma empresa não vê a outra;
-- Financeiro não vê Pessoas; RH não vê Caixa; Consultora só lê o caixa e registra na jornada;
-- anônimo só lê o ambiente; ninguém liga dado de uma empresa a outra.
-- Dados 100% inventados. Tudo volta atrás no rollback do fim.
begin;
create extension if not exists pgtap with schema extensions;
select plan(55);

-- ---------------------------------------------------------------------------
-- Preparação (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at) values
  ('10000000-0000-4000-8000-000000000001', 'dono.a@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-8000-000000000002', 'financeiro.a@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-8000-000000000003', 'rh.a@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-8000-000000000004', 'consultora@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-8000-000000000005', 'aluno@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-8000-000000000006', 'dono.b@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-8000-000000000007', 'inativo.a@teste.local', 'authenticated', 'authenticated', '{}', '{}', now());

insert into empresa_viva.empresas (id, nome, perfil) values
  ('a0000000-0000-4000-8000-00000000000a', 'Empresa Teste A', 'comercio'),
  ('b0000000-0000-4000-8000-00000000000b', 'Empresa Teste B', 'clinica');

insert into empresa_viva.membros (empresa_id, usuario_id, papel, ativo) values
  ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000001', 'dono', true),
  ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000002', 'financeiro', true),
  ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000003', 'rh', true),
  ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000004', 'consultora', true),
  ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000007', 'dono', false),
  ('b0000000-0000-4000-8000-00000000000b', '10000000-0000-4000-8000-000000000006', 'dono', true);

insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, data_entrada) values
  ('c0000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-00000000000a', 'Pessoa Teste A', 'Vendedora', '2026-01-10'),
  ('c0000000-0000-4000-8000-00000000000b', 'b0000000-0000-4000-8000-00000000000b', 'Pessoa Teste B', 'Recepcionista', '2026-02-10');

create temp table _ids on commit drop as
select
  'a0000000-0000-4000-8000-00000000000a'::uuid as emp_a,
  'b0000000-0000-4000-8000-00000000000b'::uuid as emp_b,
  (select id from empresa_viva.categorias
   where empresa_id = 'a0000000-0000-4000-8000-00000000000a' and nome = 'Vendas e serviços') as cat_a,
  (select id from empresa_viva.categorias
   where empresa_id = 'b0000000-0000-4000-8000-00000000000b' and nome = 'Vendas e serviços') as cat_b,
  'c0000000-0000-4000-8000-00000000000a'::uuid as colab_a,
  'c0000000-0000-4000-8000-00000000000b'::uuid as colab_b,
  (select id from empresa_viva.etapas_integracao
   where empresa_id = 'b0000000-0000-4000-8000-00000000000b' and ordem = 1) as etapa_b;
grant select on _ids to anon, authenticated;

insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem)
select emp_a, date '2026-03-05', 'Venda balcão', 1500.00, cat_a, 'manual' from _ids
union all
select emp_b, date '2026-03-06', 'Consulta particular', 300.00, cat_b, 'manual' from _ids;

-- ---------------------------------------------------------------------------
-- Estrutura
-- ---------------------------------------------------------------------------
select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'empresa_viva' and c.relkind = 'r' and not c.relrowsecurity),
  0::bigint,
  'todas as tabelas do schema empresa_viva com RLS ligada'
);

select is(
  (select count(*) from pg_policies
   where schemaname = 'empresa_viva'
     and 'authenticated' = any (roles)
     and (qual = 'true' or with_check = 'true')),
  0::bigint,
  'nenhuma política "logado pode tudo"'
);

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'empresa_viva' and c.relkind = 'r' and c.relname <> 'ambiente'
     and (has_table_privilege('anon', c.oid, 'select')
          or has_table_privilege('anon', c.oid, 'insert')
          or has_table_privilege('anon', c.oid, 'update')
          or has_table_privilege('anon', c.oid, 'delete'))),
  0::bigint,
  'anônimo não tem permissão em tabela nenhuma além de ambiente'
);

-- ---------------------------------------------------------------------------
-- Anônimo (sem login)
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is((select modo from empresa_viva.ambiente), 'demonstracao', 'anônimo lê o ambiente');
select throws_ok('select count(*) from empresa_viva.empresas', '42501', null, 'anônimo não lê empresas');
select throws_ok('select count(*) from empresa_viva.lancamentos', '42501', null, 'anônimo não lê lançamentos');
select throws_ok(
  $$select empresa_viva.meu_papel('a0000000-0000-4000-8000-00000000000a'::uuid)$$,
  '42501', null, 'anônimo não executa meu_papel'
);
reset role;

-- ---------------------------------------------------------------------------
-- Aluno da comunidade: logado, sem vínculo com empresa nenhuma
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000005","role":"authenticated"}';

select is_empty('select * from empresa_viva.empresas', 'aluno não vê empresas');
select is_empty('select * from empresa_viva.lancamentos', 'aluno não vê lançamentos');
select is_empty('select * from empresa_viva.colaboradores', 'aluno não vê colaboradores');
select is_empty('select * from empresa_viva.membros', 'aluno não vê membros');
select is_empty('select * from empresa_viva.categorias', 'aluno não vê categorias');
select is_empty('select * from empresa_viva.eventos', 'aluno não vê eventos');
select is(
  empresa_viva.pode_ver_caixa('a0000000-0000-4000-8000-00000000000a'),
  false,
  'aluno não pode ver o caixa'
);
select is((select count(*) from empresa_viva.ambiente), 1::bigint, 'logado lê o ambiente');
reset role;

-- ---------------------------------------------------------------------------
-- Membro inativo: vínculo desligado não abre nada
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000007","role":"authenticated"}';

select is_empty('select * from empresa_viva.empresas', 'membro inativo não vê empresas');
select is_empty('select * from empresa_viva.lancamentos', 'membro inativo não vê lançamentos');
select is(
  empresa_viva.meu_papel('a0000000-0000-4000-8000-00000000000a'),
  null::empresa_viva.papel,
  'membro inativo fica sem papel'
);
reset role;

-- ---------------------------------------------------------------------------
-- Financeiro da empresa A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}';

select results_eq(
  'select id from empresa_viva.empresas',
  $$values ('a0000000-0000-4000-8000-00000000000a'::uuid)$$,
  'financeiro vê só a empresa A'
);
select is((select count(*) from empresa_viva.lancamentos), 1::bigint, 'financeiro vê só o lançamento da empresa A');
select is((select count(*) from empresa_viva.categorias), 17::bigint, 'financeiro vê só as categorias da empresa A');
select is_empty('select * from empresa_viva.colaboradores', 'financeiro não vê colaboradores');
select is_empty('select * from empresa_viva.eventos', 'financeiro não vê a jornada');
select is((select count(*) from empresa_viva.membros), 1::bigint, 'financeiro vê só a própria linha de membros');
select lives_ok(
  $$insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem)
    select emp_a, date '2026-03-10', 'Venda online', 800.00, cat_a, 'manual' from _ids$$,
  'financeiro lança na empresa A'
);
select throws_ok(
  $$insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem)
    select emp_a, date '2026-03-11', 'Venda cruzada', 50.00, cat_b, 'manual' from _ids$$,
  '23503', null, 'lançamento da empresa A não aceita categoria da empresa B'
);
select throws_ok(
  $$update empresa_viva.lancamentos set categoria_id = (select cat_b from _ids) where descricao = 'Venda balcão'$$,
  '23503', null, 'não dá para trocar a categoria para uma da empresa B'
);
select throws_ok(
  $$insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, origem)
    select emp_b, date '2026-03-12', 'Intruso', 10.00, 'manual' from _ids$$,
  '42501', null, 'financeiro da A não lança na empresa B'
);
select throws_ok(
  $$insert into empresa_viva.membros (empresa_id, usuario_id, papel)
    values ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000005', 'rh')$$,
  '42501', null, 'financeiro não cadastra membro'
);
reset role;

-- ---------------------------------------------------------------------------
-- RH da empresa A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}';

select is((select count(*) from empresa_viva.colaboradores), 1::bigint, 'RH vê só o colaborador da empresa A');
select is_empty('select * from empresa_viva.lancamentos', 'RH não vê lançamentos');
select is_empty('select * from empresa_viva.categorias', 'RH não vê o plano de contas');
select is((select count(*) from empresa_viva.eventos), 1::bigint, 'RH vê a jornada da empresa A');
select throws_ok(
  $$insert into empresa_viva.eventos (empresa_id, colaborador_id, tipo, texto)
    select emp_a, colab_b, 'anotacao', 'Ligação cruzada' from _ids$$,
  '23503', null, 'evento da empresa A não aceita colaborador da empresa B'
);
select throws_ok(
  $$insert into empresa_viva.integracao_progresso (colaborador_id, etapa_id, empresa_id)
    select colab_a, etapa_b, emp_a from _ids$$,
  '23503', null, 'integração não aceita etapa de outra empresa'
);
select throws_ok(
  $$insert into empresa_viva.colaboradores (empresa_id, nome, data_entrada)
    select emp_b, 'Intrusa', date '2026-04-01' from _ids$$,
  '42501', null, 'RH da A não cadastra colaborador na empresa B'
);
reset role;

-- ---------------------------------------------------------------------------
-- Consultora ligada à empresa A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated"}';

select is((select count(*) from empresa_viva.lancamentos), 2::bigint, 'consultora vê os lançamentos da empresa A');
select is((select count(*) from empresa_viva.colaboradores), 1::bigint, 'consultora vê os colaboradores da empresa A');
select throws_ok(
  $$insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, origem)
    select emp_a, date '2026-03-15', 'Tentativa', 10.00, 'manual' from _ids$$,
  '42501', null, 'consultora não lança no caixa'
);
select results_eq(
  $$with alterada as (update empresa_viva.lancamentos set descricao = 'Mudado' returning 1) select count(*) from alterada$$,
  $$values (0::bigint)$$,
  'consultora não altera lançamento'
);
select lives_ok(
  $$insert into empresa_viva.eventos (empresa_id, colaborador_id, tipo, texto)
    select emp_a, colab_a, 'anotacao', 'Visita de acompanhamento' from _ids$$,
  'consultora registra na jornada'
);
select results_eq(
  $$with alterada as (update empresa_viva.colaboradores set nome = 'Mudado' returning 1) select count(*) from alterada$$,
  $$values (0::bigint)$$,
  'consultora não edita colaborador'
);
select results_eq(
  'select id from empresa_viva.empresas',
  $$values ('a0000000-0000-4000-8000-00000000000a'::uuid)$$,
  'consultora vê só a empresa à qual foi ligada'
);
reset role;

-- ---------------------------------------------------------------------------
-- Dono da empresa A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is((select count(*) from empresa_viva.membros), 5::bigint, 'dono vê todos os membros da empresa A');
select results_eq(
  $$with alterada as (
      update empresa_viva.membros set papel = 'rh'
      where usuario_id = '10000000-0000-4000-8000-000000000001' returning 1)
    select count(*) from alterada$$,
  $$values (0::bigint)$$,
  'dono não altera a própria linha'
);
select results_eq(
  $$with apagada as (
      delete from empresa_viva.membros
      where usuario_id = '10000000-0000-4000-8000-000000000001' returning 1)
    select count(*) from apagada$$,
  $$values (0::bigint)$$,
  'dono não apaga a própria linha'
);
select lives_ok(
  $$insert into empresa_viva.membros (empresa_id, usuario_id, papel)
    values ('a0000000-0000-4000-8000-00000000000a', '10000000-0000-4000-8000-000000000005', 'rh')$$,
  'dono cadastra um membro novo'
);
select is((select count(*) from empresa_viva.lancamentos), 2::bigint, 'dono vê o caixa da empresa A');
select is((select count(*) from empresa_viva.eventos), 2::bigint, 'dono vê a jornada da empresa A');
reset role;

-- ---------------------------------------------------------------------------
-- Dono da empresa B
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000006","role":"authenticated"}';

select results_eq(
  'select id from empresa_viva.empresas',
  $$values ('b0000000-0000-4000-8000-00000000000b'::uuid)$$,
  'dono da B vê só a empresa B'
);
select is_empty(
  $$select * from empresa_viva.lancamentos where empresa_id = 'a0000000-0000-4000-8000-00000000000a'$$,
  'dono da B não vê lançamentos da A'
);
select is((select count(*) from empresa_viva.colaboradores), 1::bigint, 'dono da B vê só o colaborador da B');
reset role;

-- ---------------------------------------------------------------------------
-- O aluno que o dono da A cadastrou como RH passa a ver as pessoas da A
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000005","role":"authenticated"}';

select is((select count(*) from empresa_viva.colaboradores), 1::bigint, 'novo RH vê os colaboradores da A');
reset role;

-- ---------------------------------------------------------------------------
-- Coerência entre empresas mesmo para quem ignora a RLS (postgres)
-- ---------------------------------------------------------------------------
select throws_ok(
  $$insert into empresa_viva.regras_classificacao (empresa_id, contem, categoria_id)
    select emp_a, 'aluguel', cat_b from _ids$$,
  '23503', null, 'regra da empresa A não aponta para categoria da B'
);
select throws_ok(
  $$insert into empresa_viva.lancamentos (empresa_id, data, descricao, valor, categoria_id, origem)
    select emp_a, date '2026-03-20', 'Cruzado', 10.00, cat_b, 'manual' from _ids$$,
  '23503', null, 'nem o postgres liga lançamento da A a categoria da B'
);

select * from finish();
rollback;
