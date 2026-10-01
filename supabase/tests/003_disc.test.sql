-- TASK-003: DISC público (sem login).
-- O colaborador abre o link, vê só o primeiro nome, responde uma vez e o link morre.
-- Resposta fora do formato é recusada sem gastar o link.
-- Dados 100% inventados. Tudo volta atrás no rollback do fim.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- ---------------------------------------------------------------------------
-- Preparação (como postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at) values
  ('30000000-0000-4000-8000-000000000001', 'rh.y@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('30000000-0000-4000-8000-000000000002', 'financeiro.y@teste.local', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('30000000-0000-4000-8000-000000000003', 'aluno.y@teste.local', 'authenticated', 'authenticated', '{}', '{}', now());

insert into empresa_viva.empresas (id, nome) values
  ('e0000000-0000-4000-8000-00000000000e', 'Empresa Teste Y');

insert into empresa_viva.membros (empresa_id, usuario_id, papel) values
  ('e0000000-0000-4000-8000-00000000000e', '30000000-0000-4000-8000-000000000001', 'rh'),
  ('e0000000-0000-4000-8000-00000000000e', '30000000-0000-4000-8000-000000000002', 'financeiro');

insert into empresa_viva.colaboradores (id, empresa_id, nome, funcao, data_entrada) values
  ('c3000000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-00000000000e',
   'Maria Aparecida Teste', 'Recepcionista', '2026-05-01');

insert into empresa_viva.disc_convites (empresa_id, colaborador_id, token) values
  ('e0000000-0000-4000-8000-00000000000e', 'c3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-00000000000e', 'c3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-00000000000e', 'c3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000003'),
  ('e0000000-0000-4000-8000-00000000000e', 'c3000000-0000-4000-8000-000000000001', 'f1000000-0000-4000-8000-000000000004');

-- Respostas prontas (24 letras cada, fora as inválidas de propósito).
create temp table _resp on commit drop as
select
  -- 12 D, 6 I, 4 S, 2 C: 50, 25, 17, 8
  (select jsonb_agg(x.l) from (
     select 'D'::text as l from generate_series(1, 12)
     union all select 'I' from generate_series(1, 6)
     union all select 'S' from generate_series(1, 4)
     union all select 'C' from generate_series(1, 2)) x) as perfil_d,
  -- 6 de cada: empate, vale a ordem D, I, S, C
  (select jsonb_agg(x.l) from (
     select unnest(array['D', 'I', 'S', 'C']) as l from generate_series(1, 6)) x) as empate,
  -- 5 D, 7 I, 7 S, 5 C: empate entre I e S, vence I
  (select jsonb_agg(x.l) from (
     select 'D'::text as l from generate_series(1, 5)
     union all select 'I' from generate_series(1, 7)
     union all select 'S' from generate_series(1, 7)
     union all select 'C' from generate_series(1, 5)) x) as perfil_i,
  -- só 23 respostas
  (select jsonb_agg(x.l) from (
     select 'D'::text as l from generate_series(1, 23)) x) as curta,
  -- 24 respostas, uma com letra que não existe
  (select jsonb_agg(x.l) from (
     select 'D'::text as l from generate_series(1, 23)
     union all select 'X') x) as letra_errada;
grant select on _resp to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Colaborador pelo celular (anônimo)
-- ---------------------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select results_eq(
  $$select * from empresa_viva.disc_ler_convite('f1000000-0000-4000-8000-000000000001')$$,
  $$values ('Maria'::text, false)$$,
  'anônimo lê o convite: só o primeiro nome e ainda não respondido'
);
select is_empty(
  $$select * from empresa_viva.disc_ler_convite('f9999999-0000-4000-8000-000000000999')$$,
  'token que não existe não devolve nada'
);
select results_eq(
  $$select * from empresa_viva.disc_responder('f1000000-0000-4000-8000-000000000001', (select perfil_d from _resp))$$,
  $$values (50, 25, 17, 8, 'D'::text)$$,
  'responder devolve as porcentagens e o perfil predominante'
);
select throws_ok(
  $$select * from empresa_viva.disc_responder('f1000000-0000-4000-8000-000000000001', (select perfil_d from _resp))$$,
  'P0001', 'Este link já foi usado ou não existe.',
  'o mesmo link não aceita segunda resposta'
);
select throws_ok(
  $$select * from empresa_viva.disc_responder('f9999999-0000-4000-8000-000000000999', (select perfil_d from _resp))$$,
  'P0001', 'Este link já foi usado ou não existe.',
  'token que não existe dá o mesmo aviso'
);
select throws_ok(
  $$select * from empresa_viva.disc_responder('f1000000-0000-4000-8000-000000000002', (select curta from _resp))$$,
  '22023', 'O questionário tem 24 perguntas e chegaram 23 respostas.',
  'número errado de respostas é recusado'
);
select throws_ok(
  $$select * from empresa_viva.disc_responder('f1000000-0000-4000-8000-000000000002', (select letra_errada from _resp))$$,
  '22023', null,
  'letra que não é D, I, S ou C é recusada'
);
select throws_ok(
  $$select * from empresa_viva.disc_responder('f1000000-0000-4000-8000-000000000002', '{"a": 1}'::jsonb)$$,
  '22023', null,
  'resposta que não é lista é recusada'
);
select results_eq(
  $$select * from empresa_viva.disc_ler_convite('f1000000-0000-4000-8000-000000000001')$$,
  $$values ('Maria'::text, true)$$,
  'depois de responder, o convite aparece como respondido'
);
select results_eq(
  $$select * from empresa_viva.disc_ler_convite('f1000000-0000-4000-8000-000000000002')$$,
  $$values ('Maria'::text, false)$$,
  'resposta recusada não gasta o link'
);
select results_eq(
  $$select * from empresa_viva.disc_responder('f1000000-0000-4000-8000-000000000003', (select empate from _resp))$$,
  $$values (25, 25, 25, 25, 'D'::text)$$,
  'empate geral: vale a ordem D, I, S, C'
);
select results_eq(
  $$select * from empresa_viva.disc_responder('f1000000-0000-4000-8000-000000000004', (select perfil_i from _resp))$$,
  $$values (21, 29, 29, 21, 'I'::text)$$,
  'empate entre I e S: vence I'
);
select throws_ok('select count(*) from empresa_viva.disc_resultados', '42501', null, 'anônimo não lê resultados');
select throws_ok('select count(*) from empresa_viva.disc_convites', '42501', null, 'anônimo não lê convites');
reset role;

-- ---------------------------------------------------------------------------
-- Aluno da comunidade (logado, sem vínculo)
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated"}';

select results_eq(
  $$select * from empresa_viva.disc_ler_convite('f1000000-0000-4000-8000-000000000002')$$,
  $$values ('Maria'::text, false)$$,
  'logado também consegue abrir o convite'
);
select is_empty('select * from empresa_viva.disc_resultados', 'aluno não vê resultados de DISC');
select throws_ok(
  $$insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas)
    values ('e0000000-0000-4000-8000-00000000000e', 'c3000000-0000-4000-8000-000000000001', 100, 0, 0, 0, 'D', '[]')$$,
  '42501', null, 'aluno não grava resultado direto'
);
reset role;

-- ---------------------------------------------------------------------------
-- RH da empresa Y
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"30000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is((select count(*) from empresa_viva.disc_resultados), 3::bigint, 'RH vê os três resultados');
select throws_ok(
  $$insert into empresa_viva.disc_resultados (empresa_id, colaborador_id, d, i, s, c, predominante, respostas)
    values ('e0000000-0000-4000-8000-00000000000e', 'c3000000-0000-4000-8000-000000000001', 100, 0, 0, 0, 'D', '[]')$$,
  '42501', null, 'nem o RH grava resultado direto: só pelo link'
);
select results_eq(
  $$select texto from empresa_viva.eventos where tipo = 'disc' order by texto$$,
  $$values ('DISC respondido pelo celular: perfil D'::text),
           ('DISC respondido pelo celular: perfil D'),
           ('DISC respondido pelo celular: perfil I')$$,
  'cada resposta vira um evento na jornada'
);
reset role;

-- ---------------------------------------------------------------------------
-- Financeiro da empresa Y
-- ---------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated"}';

select is_empty('select * from empresa_viva.disc_resultados', 'financeiro não vê resultados de DISC');
select is_empty('select * from empresa_viva.disc_convites', 'financeiro não vê convites de DISC');
reset role;

-- ---------------------------------------------------------------------------
-- Conferência como postgres
-- ---------------------------------------------------------------------------
select ok(
  (select respondido_em is not null from empresa_viva.disc_convites
   where token = 'f1000000-0000-4000-8000-000000000001'),
  'convite respondido fica marcado'
);
select ok(
  (select respondido_em is null from empresa_viva.disc_convites
   where token = 'f1000000-0000-4000-8000-000000000002'),
  'convite com resposta recusada continua em aberto'
);
select results_eq(
  $$select r.d, r.i, r.s, r.c, r.predominante
    from empresa_viva.disc_resultados r
    join empresa_viva.disc_convites cv on cv.id = r.convite_id
    where cv.token = 'f1000000-0000-4000-8000-000000000001'$$,
  $$values (50, 25, 17, 8, 'D'::text)$$,
  'resultado gravado com as porcentagens'
);
select ok(
  has_function_privilege('anon', 'empresa_viva.disc_responder(uuid, jsonb)', 'execute'),
  'anônimo pode chamar disc_responder'
);
select ok(
  not has_function_privilege('anon', 'empresa_viva.pode_ver_pessoas(uuid)', 'execute'),
  'anônimo não chama as funções de permissão'
);

select * from finish();
rollback;
