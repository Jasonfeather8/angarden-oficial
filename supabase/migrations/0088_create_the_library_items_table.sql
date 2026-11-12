create table public.library_items (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  categoria text not null,
  titulo text not null,
  subtitulo text,
  descricao text,
  capa_url text,
  arquivo_caminho text,
  arquivo_url text,
  arquivo_bytes bigint,
  indice jsonb not null default '[]'::jsonb,
  conteudo text,
  oculto boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  busca text generated always as (
    public.f_unaccent(lower(
      coalesce(titulo, '') || ' ' || coalesce(subtitulo, '') || ' ' || coalesce(descricao, '')
    ))
  ) stored,
  constraint library_items_tipo_check check (tipo in ('pdf', 'pergaminho')),
  constraint library_items_categoria_check check (categoria in (
    'livro-de-regras', 'livro-do-jogador', 'suplementos',
    'aventuras', 'ambientacao', 'historia', 'bestiario'
  )),
  constraint library_items_titulo_check check (length(btrim(titulo)) > 0),
  constraint library_items_indice_check check (jsonb_typeof(indice) = 'array'),
  -- Um PDF vive no bucket privado ou é um link externo, nunca os dois; o
  -- pergaminho é só texto e não carrega arquivo.
  constraint library_items_arquivo_coerente_check check (
    case tipo
      when 'pdf' then num_nonnulls(arquivo_caminho, arquivo_url) = 1 and conteudo is null
      else arquivo_caminho is null
        and arquivo_url is null
        and arquivo_bytes is null
        and conteudo is not null
        and length(btrim(conteudo)) > 0
    end
  ),
  constraint library_items_arquivo_bytes_check check (arquivo_bytes is null or arquivo_bytes > 0)
);