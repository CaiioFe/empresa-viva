-- TASK-003: estrutura do banco da Empresa Viva.
-- Tudo mora no schema empresa_viva (o banco pode ser compartilhado com outros sistemas).
-- Regra de ouro: estar logado não quer dizer estar autorizado. Os alunos da comunidade também são
-- "authenticated", então toda política confere empresa_viva.membros.

create schema if not exists empresa_viva;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type empresa_viva.papel as enum ('dono', 'financeiro', 'rh', 'consultora');

create type empresa_viva.grupo_categoria as enum (
  'recebimentos',
  'pagamentos_operacionais',
  'investimentos',
  'acionistas',
  'financiamento',
  'nao_operacional'
);

create type empresa_viva.tipo_evento as enum (
  'contratacao',
  'integracao',
  'mudanca_funcao',
  'treinamento',
  'avaliacao',
  'ferias',
  'desligamento',
  'disc',
  'anotacao'
);

-- ---------------------------------------------------------------------------
-- Tabelas
-- As ligações entre tabelas filhas usam chave estrangeira composta (empresa_id, id).
-- Assim o banco recusa, sozinho, ligar um lançamento da empresa A a uma categoria da
-- empresa B (ou um evento a um colaborador de outra empresa), mesmo para quem ignora a RLS.
-- ---------------------------------------------------------------------------

-- Uma linha só: diz se o banco está em demonstração ou com empresa real.
create table empresa_viva.ambiente (
  id int primary key default 1 check (id = 1),
  modo text not null default 'demonstracao' check (modo in ('demonstracao', 'real'))
);

insert into empresa_viva.ambiente (id) values (1) on conflict (id) do nothing;

create table empresa_viva.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  perfil text not null default 'outro' check (perfil in ('comercio', 'frota', 'clinica', 'outro')),
  ano_inicio int not null default (extract(year from now()))::int,
  criado_em timestamptz not null default now()
);

create table empresa_viva.membros (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  papel empresa_viva.papel not null,
  nome text not null default '',
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empresa_id, usuario_id)
);

create index membros_usuario_idx on empresa_viva.membros (usuario_id);

create table empresa_viva.categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  nome text not null,
  grupo empresa_viva.grupo_categoria not null,
  ordem int not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empresa_id, id)
);

create table empresa_viva.regras_classificacao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  contem text not null check (length(trim(contem)) > 0),
  categoria_id uuid not null,
  criado_em timestamptz not null default now(),
  constraint regras_classificacao_categoria_fk
    foreign key (empresa_id, categoria_id)
    references empresa_viva.categorias (empresa_id, id) on delete cascade
);

create index regras_classificacao_categoria_idx on empresa_viva.regras_classificacao (empresa_id, categoria_id);

create table empresa_viva.saldos_iniciais (
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  ano int not null,
  valor numeric(14, 2) not null default 0,
  criado_em timestamptz not null default now(),
  primary key (empresa_id, ano)
);

create table empresa_viva.cargas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  arquivo text not null,
  linhas int not null default 0,
  mapeamento jsonb not null default '{}'::jsonb,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  unique (empresa_id, id)
);

create table empresa_viva.lancamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  data date not null,
  descricao text not null default '',
  valor numeric(14, 2) not null check (valor <> 0),
  categoria_id uuid null,
  origem text not null check (origem in ('planilha', 'manual')),
  carga_id uuid null,
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  -- apagar a categoria deixa o lançamento "sem categoria" (só a coluna categoria_id vira nula)
  constraint lancamentos_categoria_fk
    foreign key (empresa_id, categoria_id)
    references empresa_viva.categorias (empresa_id, id) on delete set null (categoria_id),
  -- desfazer uma carga apaga os lançamentos dela
  constraint lancamentos_carga_fk
    foreign key (empresa_id, carga_id)
    references empresa_viva.cargas (empresa_id, id) on delete cascade
);

create index lancamentos_empresa_data_idx on empresa_viva.lancamentos (empresa_id, data);
create index lancamentos_empresa_categoria_idx on empresa_viva.lancamentos (empresa_id, categoria_id);
create index lancamentos_empresa_carga_idx on empresa_viva.lancamentos (empresa_id, carga_id);

create table empresa_viva.colaboradores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  nome text not null,
  funcao text not null default '',
  setor text not null default '',
  data_entrada date not null,
  telefone text,
  email text,
  situacao text not null default 'ativo' check (situacao in ('ativo', 'desligado')),
  data_saida date,
  criado_em timestamptz not null default now(),
  unique (empresa_id, id)
);

create table empresa_viva.eventos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  colaborador_id uuid not null,
  data date not null default current_date,
  tipo empresa_viva.tipo_evento not null,
  texto text not null default '',
  criado_por uuid default auth.uid(),
  criado_em timestamptz not null default now(),
  constraint eventos_colaborador_fk
    foreign key (empresa_id, colaborador_id)
    references empresa_viva.colaboradores (empresa_id, id) on delete cascade
);

create index eventos_colaborador_data_idx on empresa_viva.eventos (empresa_id, colaborador_id, data);
create index eventos_empresa_data_idx on empresa_viva.eventos (empresa_id, data);

create table empresa_viva.etapas_integracao (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  nome text not null,
  ordem int not null default 0,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (empresa_id, id)
);

create table empresa_viva.integracao_progresso (
  colaborador_id uuid not null,
  etapa_id uuid not null,
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  concluida_em timestamptz not null default now(),
  primary key (colaborador_id, etapa_id),
  constraint integracao_progresso_colaborador_fk
    foreign key (empresa_id, colaborador_id)
    references empresa_viva.colaboradores (empresa_id, id) on delete cascade,
  constraint integracao_progresso_etapa_fk
    foreign key (empresa_id, etapa_id)
    references empresa_viva.etapas_integracao (empresa_id, id) on delete cascade
);

create index integracao_progresso_etapa_idx on empresa_viva.integracao_progresso (empresa_id, etapa_id);
create index integracao_progresso_colaborador_idx on empresa_viva.integracao_progresso (empresa_id, colaborador_id);

create table empresa_viva.disc_convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  colaborador_id uuid not null,
  token uuid not null unique default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  respondido_em timestamptz,
  constraint disc_convites_colaborador_fk
    foreign key (empresa_id, colaborador_id)
    references empresa_viva.colaboradores (empresa_id, id) on delete cascade
);

create index disc_convites_colaborador_idx on empresa_viva.disc_convites (empresa_id, colaborador_id);

create table empresa_viva.disc_resultados (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresa_viva.empresas (id) on delete cascade,
  colaborador_id uuid not null,
  convite_id uuid unique references empresa_viva.disc_convites (id) on delete set null,
  d int check (d between 0 and 100),
  i int check (i between 0 and 100),
  s int check (s between 0 and 100),
  c int check (c between 0 and 100),
  predominante text check (predominante in ('D', 'I', 'S', 'C')),
  respostas jsonb not null,
  respondido_em timestamptz not null default now(),
  constraint disc_resultados_colaborador_fk
    foreign key (empresa_id, colaborador_id)
    references empresa_viva.colaboradores (empresa_id, id) on delete cascade
);

create index disc_resultados_colaborador_idx on empresa_viva.disc_resultados (empresa_id, colaborador_id);

-- RLS ligada em todas, sem exceção.
alter table empresa_viva.ambiente enable row level security;
alter table empresa_viva.empresas enable row level security;
alter table empresa_viva.membros enable row level security;
alter table empresa_viva.categorias enable row level security;
alter table empresa_viva.regras_classificacao enable row level security;
alter table empresa_viva.saldos_iniciais enable row level security;
alter table empresa_viva.cargas enable row level security;
alter table empresa_viva.lancamentos enable row level security;
alter table empresa_viva.colaboradores enable row level security;
alter table empresa_viva.eventos enable row level security;
alter table empresa_viva.etapas_integracao enable row level security;
alter table empresa_viva.integracao_progresso enable row level security;
alter table empresa_viva.disc_convites enable row level security;
alter table empresa_viva.disc_resultados enable row level security;

-- ---------------------------------------------------------------------------
-- Funções que dizem o que a pessoa logada pode fazer em cada empresa.
-- São security definer para ler membros sem cair na própria RLS de membros.
-- ---------------------------------------------------------------------------

create function empresa_viva.meu_papel(p_empresa uuid)
returns empresa_viva.papel
language sql
stable
security definer
set search_path = ''
as $$
  select m.papel
  from empresa_viva.membros m
  where m.empresa_id = p_empresa
    and m.usuario_id = (select auth.uid())
    and m.ativo
$$;

create function empresa_viva.pode_ver_caixa(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    empresa_viva.meu_papel(p_empresa) in ('dono'::empresa_viva.papel, 'financeiro'::empresa_viva.papel, 'consultora'::empresa_viva.papel),
    false
  )
$$;

create function empresa_viva.pode_editar_caixa(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    empresa_viva.meu_papel(p_empresa) in ('dono'::empresa_viva.papel, 'financeiro'::empresa_viva.papel),
    false
  )
$$;

create function empresa_viva.pode_ver_pessoas(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    empresa_viva.meu_papel(p_empresa) in ('dono'::empresa_viva.papel, 'rh'::empresa_viva.papel, 'consultora'::empresa_viva.papel),
    false
  )
$$;

create function empresa_viva.pode_editar_pessoas(p_empresa uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    empresa_viva.meu_papel(p_empresa) in ('dono'::empresa_viva.papel, 'rh'::empresa_viva.papel),
    false
  )
$$;

-- ---------------------------------------------------------------------------
-- Plano de contas padrão e gatilhos
-- ---------------------------------------------------------------------------

-- Cria o plano de contas padrão de uma empresa. Não duplica: se a empresa já tem
-- categorias, não faz nada. Só o gatilho de empresas chama (ninguém logado executa).
create function empresa_viva.criar_plano_padrao(p_empresa uuid)
returns void
language sql
volatile
set search_path = ''
as $$
  insert into empresa_viva.categorias (empresa_id, grupo, nome, ordem)
  select p_empresa, v.grupo::empresa_viva.grupo_categoria, v.nome, v.ordem
  from (values
    ('recebimentos', 'Vendas e serviços', 1),
    ('recebimentos', 'Outros recebimentos', 2),
    ('pagamentos_operacionais', 'Pessoal', 1),
    ('pagamentos_operacionais', 'Fornecedores e insumos', 2),
    ('pagamentos_operacionais', 'Impostos e tributos', 3),
    ('pagamentos_operacionais', 'Administrativo', 4),
    ('pagamentos_operacionais', 'Instalações', 5),
    ('pagamentos_operacionais', 'Veículos e equipamentos', 6),
    ('pagamentos_operacionais', 'Serviços de terceiros', 7),
    ('pagamentos_operacionais', 'Marketing', 8),
    ('pagamentos_operacionais', 'Bancários', 9),
    ('investimentos', 'Máquinas e equipamentos', 1),
    ('investimentos', 'Obras e reformas', 2),
    ('acionistas', 'Pró-labore e retiradas', 1),
    ('financiamento', 'Empréstimos recebidos', 1),
    ('financiamento', 'Parcelas de empréstimos', 2),
    ('nao_operacional', 'Outras entradas e saídas', 1)
  ) as v (grupo, nome, ordem)
  where not exists (
    select 1 from empresa_viva.categorias cat where cat.empresa_id = p_empresa
  );
$$;

-- Empresa nova nasce com o plano de contas e as etapas de integração padrão.
create function empresa_viva.tg_empresa_criada()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform empresa_viva.criar_plano_padrao(new.id);

  insert into empresa_viva.etapas_integracao (empresa_id, nome, ordem)
  values
    (new.id, 'Documentação e contrato', 1),
    (new.id, 'Apresentação da empresa e do time', 2),
    (new.id, 'Treinamento da função', 3),
    (new.id, 'Acompanhamento de 30 dias', 4);

  return null;
end;
$$;

create trigger empresa_criada
after insert on empresa_viva.empresas
for each row execute function empresa_viva.tg_empresa_criada();

-- Colaborador novo ganha o evento de contratação na jornada.
create function empresa_viva.tg_colaborador_criado()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into empresa_viva.eventos (empresa_id, colaborador_id, data, tipo, texto)
  values (
    new.empresa_id,
    new.id,
    new.data_entrada,
    'contratacao'::empresa_viva.tipo_evento,
    case
      when length(trim(new.funcao)) > 0 then 'Contratado como ' || trim(new.funcao)
      else 'Contratado'
    end
  );

  return null;
end;
$$;

create trigger colaborador_criado
after insert on empresa_viva.colaboradores
for each row execute function empresa_viva.tg_colaborador_criado();

-- ---------------------------------------------------------------------------
-- DISC público (sem login). Só o token do convite abre alguma coisa.
-- ---------------------------------------------------------------------------

-- Devolve só o primeiro nome do colaborador e se o convite já foi respondido.
-- Token que não existe: nenhuma linha.
create function empresa_viva.disc_ler_convite(p_token uuid)
returns table (primeiro_nome text, respondido boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select
    split_part(trim(col.nome), ' ', 1),
    conv.respondido_em is not null
  from empresa_viva.disc_convites conv
  join empresa_viva.colaboradores col
    on col.empresa_id = conv.empresa_id and col.id = conv.colaborador_id
  where conv.token = p_token
$$;

-- Grava a resposta do DISC uma vez só.
-- p_respostas: lista JSON com 24 letras ('D', 'I', 'S' ou 'C'), uma por pergunta.
-- Devolve a porcentagem de cada fator (arredondada) e o predominante
-- (maior contagem; no empate vale a ordem D, I, S, C).
create function empresa_viva.disc_responder(p_token uuid, p_respostas jsonb)
returns table (d int, i int, s int, c int, predominante text)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_convite empresa_viva.disc_convites%rowtype;
  v_item jsonb;
  v_letra text;
  v_total int;
  v_qd int := 0;
  v_qi int := 0;
  v_qs int := 0;
  v_qc int := 0;
  v_pred text;
  v_max int;
begin
  -- trava o convite para que duas respostas ao mesmo tempo não passem juntas
  select * into v_convite
  from empresa_viva.disc_convites
  where token = p_token
  for update;

  if not found or v_convite.respondido_em is not null then
    raise exception 'Este link já foi usado ou não existe.';
  end if;

  if p_respostas is null or jsonb_typeof(p_respostas) <> 'array' then
    raise exception 'As respostas precisam ser uma lista com 24 letras (D, I, S ou C).'
      using errcode = '22023';
  end if;

  v_total := jsonb_array_length(p_respostas);
  if v_total <> 24 then
    raise exception 'O questionário tem 24 perguntas e chegaram % respostas.', v_total
      using errcode = '22023';
  end if;

  for v_item in select e.valor from jsonb_array_elements(p_respostas) as e (valor) loop
    if jsonb_typeof(v_item) <> 'string' then
      raise exception 'Resposta inválida: cada resposta precisa ser uma das letras D, I, S ou C.'
        using errcode = '22023';
    end if;

    v_letra := v_item #>> '{}';

    if v_letra = 'D' then
      v_qd := v_qd + 1;
    elsif v_letra = 'I' then
      v_qi := v_qi + 1;
    elsif v_letra = 'S' then
      v_qs := v_qs + 1;
    elsif v_letra = 'C' then
      v_qc := v_qc + 1;
    else
      raise exception 'Resposta inválida: "%" não é uma das letras D, I, S ou C.', v_letra
        using errcode = '22023';
    end if;
  end loop;

  -- predominante: maior contagem; no empate fica a que vem antes na ordem D, I, S, C
  v_pred := 'D';
  v_max := v_qd;
  if v_qi > v_max then
    v_pred := 'I';
    v_max := v_qi;
  end if;
  if v_qs > v_max then
    v_pred := 'S';
    v_max := v_qs;
  end if;
  if v_qc > v_max then
    v_pred := 'C';
    v_max := v_qc;
  end if;

  d := round(v_qd * 100.0 / v_total)::int;
  i := round(v_qi * 100.0 / v_total)::int;
  s := round(v_qs * 100.0 / v_total)::int;
  c := round(v_qc * 100.0 / v_total)::int;
  predominante := v_pred;

  insert into empresa_viva.disc_resultados
    (empresa_id, colaborador_id, convite_id, d, i, s, c, predominante, respostas)
  values
    (v_convite.empresa_id, v_convite.colaborador_id, v_convite.id,
     round(v_qd * 100.0 / v_total)::int,
     round(v_qi * 100.0 / v_total)::int,
     round(v_qs * 100.0 / v_total)::int,
     round(v_qc * 100.0 / v_total)::int,
     v_pred,
     p_respostas);

  update empresa_viva.disc_convites
  set respondido_em = now()
  where id = v_convite.id;

  insert into empresa_viva.eventos (empresa_id, colaborador_id, tipo, texto)
  values (
    v_convite.empresa_id,
    v_convite.colaborador_id,
    'disc'::empresa_viva.tipo_evento,
    'DISC respondido pelo celular: perfil ' || v_pred
  );

  return next;
end;
$$;

-- ---------------------------------------------------------------------------
-- Políticas de RLS
-- Todas para "authenticated" passam por membros (meu_papel e pode_*).
-- ---------------------------------------------------------------------------

-- ambiente: a única coisa que se lê sem login (a tela de entrada precisa saber o modo).
create policy ambiente_ler on empresa_viva.ambiente
  for select to anon, authenticated
  using (id = 1);

-- empresas
create policy empresas_ler on empresa_viva.empresas
  for select to authenticated
  using (empresa_viva.meu_papel(id) is not null);

create policy empresas_editar on empresa_viva.empresas
  for update to authenticated
  using (empresa_viva.meu_papel(id) = 'dono'::empresa_viva.papel)
  with check (empresa_viva.meu_papel(id) = 'dono'::empresa_viva.papel);

-- membros: cada um vê a própria linha; o dono vê e cuida de todas da empresa,
-- menos da própria (ninguém se rebaixa nem se apaga por engano).
create policy membros_ler on empresa_viva.membros
  for select to authenticated
  using (
    usuario_id = (select auth.uid())
    or empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel
  );

create policy membros_incluir on empresa_viva.membros
  for insert to authenticated
  with check (
    empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel
    and usuario_id <> (select auth.uid())
  );

create policy membros_editar on empresa_viva.membros
  for update to authenticated
  using (
    empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel
    and usuario_id <> (select auth.uid())
  )
  with check (
    empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel
    and usuario_id <> (select auth.uid())
  );

create policy membros_apagar on empresa_viva.membros
  for delete to authenticated
  using (
    empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel
    and usuario_id <> (select auth.uid())
  );

-- Caixa: dono, financeiro e consultora leem; dono e financeiro gravam.
create policy categorias_ler on empresa_viva.categorias
  for select to authenticated using (empresa_viva.pode_ver_caixa(empresa_id));
create policy categorias_incluir on empresa_viva.categorias
  for insert to authenticated with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy categorias_editar on empresa_viva.categorias
  for update to authenticated
  using (empresa_viva.pode_editar_caixa(empresa_id))
  with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy categorias_apagar on empresa_viva.categorias
  for delete to authenticated using (empresa_viva.pode_editar_caixa(empresa_id));

create policy regras_classificacao_ler on empresa_viva.regras_classificacao
  for select to authenticated using (empresa_viva.pode_ver_caixa(empresa_id));
create policy regras_classificacao_incluir on empresa_viva.regras_classificacao
  for insert to authenticated with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy regras_classificacao_editar on empresa_viva.regras_classificacao
  for update to authenticated
  using (empresa_viva.pode_editar_caixa(empresa_id))
  with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy regras_classificacao_apagar on empresa_viva.regras_classificacao
  for delete to authenticated using (empresa_viva.pode_editar_caixa(empresa_id));

create policy saldos_iniciais_ler on empresa_viva.saldos_iniciais
  for select to authenticated using (empresa_viva.pode_ver_caixa(empresa_id));
create policy saldos_iniciais_incluir on empresa_viva.saldos_iniciais
  for insert to authenticated with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy saldos_iniciais_editar on empresa_viva.saldos_iniciais
  for update to authenticated
  using (empresa_viva.pode_editar_caixa(empresa_id))
  with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy saldos_iniciais_apagar on empresa_viva.saldos_iniciais
  for delete to authenticated using (empresa_viva.pode_editar_caixa(empresa_id));

create policy cargas_ler on empresa_viva.cargas
  for select to authenticated using (empresa_viva.pode_ver_caixa(empresa_id));
create policy cargas_incluir on empresa_viva.cargas
  for insert to authenticated with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy cargas_editar on empresa_viva.cargas
  for update to authenticated
  using (empresa_viva.pode_editar_caixa(empresa_id))
  with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy cargas_apagar on empresa_viva.cargas
  for delete to authenticated using (empresa_viva.pode_editar_caixa(empresa_id));

create policy lancamentos_ler on empresa_viva.lancamentos
  for select to authenticated using (empresa_viva.pode_ver_caixa(empresa_id));
create policy lancamentos_incluir on empresa_viva.lancamentos
  for insert to authenticated with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy lancamentos_editar on empresa_viva.lancamentos
  for update to authenticated
  using (empresa_viva.pode_editar_caixa(empresa_id))
  with check (empresa_viva.pode_editar_caixa(empresa_id));
create policy lancamentos_apagar on empresa_viva.lancamentos
  for delete to authenticated using (empresa_viva.pode_editar_caixa(empresa_id));

-- Pessoas: dono, RH e consultora leem; dono e RH gravam.
create policy colaboradores_ler on empresa_viva.colaboradores
  for select to authenticated using (empresa_viva.pode_ver_pessoas(empresa_id));
create policy colaboradores_incluir on empresa_viva.colaboradores
  for insert to authenticated with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy colaboradores_editar on empresa_viva.colaboradores
  for update to authenticated
  using (empresa_viva.pode_editar_pessoas(empresa_id))
  with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy colaboradores_apagar on empresa_viva.colaboradores
  for delete to authenticated using (empresa_viva.pode_editar_pessoas(empresa_id));

-- Jornada: a consultora também registra (mas não edita nem apaga).
create policy eventos_ler on empresa_viva.eventos
  for select to authenticated using (empresa_viva.pode_ver_pessoas(empresa_id));
create policy eventos_incluir on empresa_viva.eventos
  for insert to authenticated
  with check (
    empresa_viva.pode_editar_pessoas(empresa_id)
    or empresa_viva.meu_papel(empresa_id) = 'consultora'::empresa_viva.papel
  );
create policy eventos_editar on empresa_viva.eventos
  for update to authenticated
  using (empresa_viva.pode_editar_pessoas(empresa_id))
  with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy eventos_apagar on empresa_viva.eventos
  for delete to authenticated using (empresa_viva.pode_editar_pessoas(empresa_id));

-- Etapas da integração: quem vê pessoas lê; só o dono configura.
create policy etapas_integracao_ler on empresa_viva.etapas_integracao
  for select to authenticated using (empresa_viva.pode_ver_pessoas(empresa_id));
create policy etapas_integracao_incluir on empresa_viva.etapas_integracao
  for insert to authenticated
  with check (empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel);
create policy etapas_integracao_editar on empresa_viva.etapas_integracao
  for update to authenticated
  using (empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel)
  with check (empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel);
create policy etapas_integracao_apagar on empresa_viva.etapas_integracao
  for delete to authenticated
  using (empresa_viva.meu_papel(empresa_id) = 'dono'::empresa_viva.papel);

create policy integracao_progresso_ler on empresa_viva.integracao_progresso
  for select to authenticated using (empresa_viva.pode_ver_pessoas(empresa_id));
create policy integracao_progresso_incluir on empresa_viva.integracao_progresso
  for insert to authenticated with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy integracao_progresso_editar on empresa_viva.integracao_progresso
  for update to authenticated
  using (empresa_viva.pode_editar_pessoas(empresa_id))
  with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy integracao_progresso_apagar on empresa_viva.integracao_progresso
  for delete to authenticated using (empresa_viva.pode_editar_pessoas(empresa_id));

create policy disc_convites_ler on empresa_viva.disc_convites
  for select to authenticated using (empresa_viva.pode_ver_pessoas(empresa_id));
create policy disc_convites_incluir on empresa_viva.disc_convites
  for insert to authenticated with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy disc_convites_editar on empresa_viva.disc_convites
  for update to authenticated
  using (empresa_viva.pode_editar_pessoas(empresa_id))
  with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy disc_convites_apagar on empresa_viva.disc_convites
  for delete to authenticated using (empresa_viva.pode_editar_pessoas(empresa_id));

-- Resultado do DISC só entra pela função disc_responder (não há política de insert).
create policy disc_resultados_ler on empresa_viva.disc_resultados
  for select to authenticated using (empresa_viva.pode_ver_pessoas(empresa_id));
create policy disc_resultados_editar on empresa_viva.disc_resultados
  for update to authenticated
  using (empresa_viva.pode_editar_pessoas(empresa_id))
  with check (empresa_viva.pode_editar_pessoas(empresa_id));
create policy disc_resultados_apagar on empresa_viva.disc_resultados
  for delete to authenticated using (empresa_viva.pode_editar_pessoas(empresa_id));

-- ---------------------------------------------------------------------------
-- Permissões
-- anon: só usa o schema, lê ambiente e chama as duas funções do DISC.
-- authenticated: recebe o acesso às tabelas e a RLS decide linha por linha.
-- service_role: acesso de manutenção (ignora a RLS por natureza).
-- ---------------------------------------------------------------------------

grant usage on schema empresa_viva to anon, authenticated, service_role;

revoke all on all tables in schema empresa_viva from public, anon, authenticated;

grant select on empresa_viva.ambiente to anon, authenticated;

grant select, insert, update, delete on
  empresa_viva.empresas,
  empresa_viva.membros,
  empresa_viva.categorias,
  empresa_viva.regras_classificacao,
  empresa_viva.saldos_iniciais,
  empresa_viva.cargas,
  empresa_viva.lancamentos,
  empresa_viva.colaboradores,
  empresa_viva.eventos,
  empresa_viva.etapas_integracao,
  empresa_viva.integracao_progresso,
  empresa_viva.disc_convites,
  empresa_viva.disc_resultados
to authenticated;

grant all on all tables in schema empresa_viva to service_role;

revoke all on all functions in schema empresa_viva from public, anon, authenticated;

grant execute on function
  empresa_viva.meu_papel(uuid),
  empresa_viva.pode_ver_caixa(uuid),
  empresa_viva.pode_editar_caixa(uuid),
  empresa_viva.pode_ver_pessoas(uuid),
  empresa_viva.pode_editar_pessoas(uuid)
to authenticated;

grant execute on function
  empresa_viva.disc_ler_convite(uuid),
  empresa_viva.disc_responder(uuid, jsonb)
to anon, authenticated;

grant execute on all functions in schema empresa_viva to service_role;
