-- TASK-302: ligar os usuários da demonstração e virar para o modo real.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into empresa_viva.empresas (id, nome, perfil) values
  ('00000000-0000-4000-a000-000000000001', 'Comercial Aurora', 'comercio'),
  ('00000000-0000-4000-a000-000000000002', 'Log Bandeirante', 'frota'),
  ('00000000-0000-4000-a000-000000000003', 'Clínica Sollus', 'clinica'),
  ('00000000-0000-4000-a000-00000000aaaa', 'Empresa de verdade', 'outro');

insert into auth.users (id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at) values
  ('10000000-0000-4000-a000-000000000001', 'caiofebc+ev-dono@gmail.com', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-a000-000000000002', 'caiofebc+ev-financeiro@gmail.com', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-a000-000000000003', 'caiofebc+ev-rh@gmail.com', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-a000-000000000004', 'caiofebc+ev-consultora@gmail.com', 'authenticated', 'authenticated', '{}', '{}', now()),
  ('10000000-0000-4000-a000-000000000009', 'alguem-de-verdade@exemplo.com', 'authenticated', 'authenticated', '{}', '{}', now());

update empresa_viva.ambiente set modo = 'demonstracao';

select is(empresa_viva.ligar_usuarios_demonstracao(), 4, 'liga os quatro usuários da demonstração');

select is(
  (select count(*)::int from empresa_viva.membros where usuario_id = '10000000-0000-4000-a000-000000000004' and papel = 'consultora'),
  3,
  'a consultora fica ligada às três empresas da demonstração'
);

select is(
  (select papel::text from empresa_viva.membros where usuario_id = '10000000-0000-4000-a000-000000000002'),
  'financeiro',
  'o financeiro entra na Comercial Aurora como financeiro'
);

select is(empresa_viva.ligar_usuarios_demonstracao(), 4, 'rodar de novo não duplica nem quebra');
select is((select count(*)::int from empresa_viva.membros), 6, 'continuam seis vínculos depois da segunda vez');

set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-a000-000000000001","role":"authenticated"}';
select throws_ok(
  'select empresa_viva.virar_ambiente_real()',
  '42501',
  null,
  'ninguém logado consegue virar o ambiente'
);
reset role;

select empresa_viva.virar_ambiente_real();

select is(
  (select array_agg(nome order by nome) from empresa_viva.empresas),
  array['Empresa de verdade'],
  'virar para real apaga só as empresas da demonstração'
);

select is(
  (select count(*)::int from auth.users where email like 'caiofebc+ev-%'),
  0,
  'os usuários da demonstração somem'
);

select is((select modo from empresa_viva.ambiente), 'real', 'o modo passa a ser real');

select * from finish();
rollback;
