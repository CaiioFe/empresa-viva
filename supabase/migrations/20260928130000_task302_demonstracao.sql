-- TASK-302: funções do modo de demonstração.
-- ligar_usuarios_demonstracao: depois de criar os quatro usuários da demo, liga cada um às empresas inventadas.
-- virar_ambiente_real: apaga a demonstração inteira (empresas, dados e usuários) e muda o modo para real. Sem volta.
-- As duas só rodam como postgres (SQL Editor ou script da Maestria); ninguém logado executa.

create or replace function empresa_viva.ligar_usuarios_demonstracao()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  aurora constant uuid := '00000000-0000-4000-a000-000000000001';
  bandeirante constant uuid := '00000000-0000-4000-a000-000000000002';
  sollus constant uuid := '00000000-0000-4000-a000-000000000003';
  ligados integer := 0;
  u record;
begin
  if (select a.modo from empresa_viva.ambiente a where a.id = 1) <> 'demonstracao' then
    raise exception 'O sistema não está em modo de demonstração.';
  end if;

  for u in
    select au.id, au.email
    from auth.users au
    where au.email in (
      'caiofebc+ev-dono@gmail.com',
      'caiofebc+ev-financeiro@gmail.com',
      'caiofebc+ev-rh@gmail.com',
      'caiofebc+ev-consultora@gmail.com'
    )
  loop
    if u.email = 'caiofebc+ev-consultora@gmail.com' then
      insert into empresa_viva.membros (empresa_id, usuario_id, papel, nome)
      select e.id, u.id, 'consultora', 'Consultora (demonstração)'
      from empresa_viva.empresas e
      where e.id in (aurora, bandeirante, sollus)
      on conflict (empresa_id, usuario_id) do update set papel = excluded.papel, ativo = true;
    else
      insert into empresa_viva.membros (empresa_id, usuario_id, papel, nome)
      values (
        aurora,
        u.id,
        case u.email
          when 'caiofebc+ev-dono@gmail.com' then 'dono'::empresa_viva.papel
          when 'caiofebc+ev-financeiro@gmail.com' then 'financeiro'::empresa_viva.papel
          else 'rh'::empresa_viva.papel
        end,
        case u.email
          when 'caiofebc+ev-dono@gmail.com' then 'Dono (demonstração)'
          when 'caiofebc+ev-financeiro@gmail.com' then 'Financeiro (demonstração)'
          else 'RH (demonstração)'
        end
      )
      on conflict (empresa_id, usuario_id) do update set papel = excluded.papel, ativo = true;
    end if;
    ligados := ligados + 1;
  end loop;

  return ligados;
end;
$$;

create or replace function empresa_viva.virar_ambiente_real()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from empresa_viva.empresas
  where id in (
    '00000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-a000-000000000002',
    '00000000-0000-4000-a000-000000000003'
  );

  delete from auth.users
  where email in (
    'caiofebc+ev-dono@gmail.com',
    'caiofebc+ev-financeiro@gmail.com',
    'caiofebc+ev-rh@gmail.com',
    'caiofebc+ev-consultora@gmail.com'
  );

  update empresa_viva.ambiente set modo = 'real' where id = 1;
end;
$$;

revoke all on function empresa_viva.ligar_usuarios_demonstracao() from public, anon, authenticated;
revoke all on function empresa_viva.virar_ambiente_real() from public, anon, authenticated;
