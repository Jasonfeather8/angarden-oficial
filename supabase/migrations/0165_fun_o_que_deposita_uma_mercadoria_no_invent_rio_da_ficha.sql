create or replace function public.adicionar_item_na_ficha(p_character_id text, p_item_id text, p_quantidade numeric)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_item public.market_items;
  v_inventario jsonb;
  v_novo jsonb;
  v_indice integer;
  v_qtd numeric := greatest(1, coalesce(p_quantidade, 1));
begin
  select * into v_item from public.market_items m where m.id = p_item_id;
  if v_item.id is null then
    raise exception 'Mercadoria não encontrada no catálogo.';
  end if;

  v_novo := coalesce(v_item.dados, '{}'::jsonb) || jsonb_build_object(
    'id', 'inv-' || replace(gen_random_uuid()::text, '-', ''),
    'item', v_item.nome,
    'nome', v_item.nome,
    'quantidade', v_qtd,
    'peso', coalesce(v_item.peso, 0),
    'preco', coalesce(v_item.preco, 0),
    'categoria', v_item.categoria,
    'icone_tipo', v_item.icone_tipo,
    'is_epico', coalesce(v_item.is_epico, false),
    'imagem_url', v_item.imagem_url,
    'efeito', v_item.efeito,
    'descricao', coalesce(v_item.descricao, v_item.efeito, '')
  );

  select coalesce(f.dados #> '{suporte,inventario}', '[]'::jsonb)
    into v_inventario
  from public.fichas f
  where f.character_id = p_character_id;

  if v_inventario is null then
    v_inventario := '[]'::jsonb;
  end if;

  select t.ord - 1
    into v_indice
  from jsonb_array_elements(v_inventario) with ordinality as t(elemento, ord)
  where lower(coalesce(t.elemento ->> 'item', t.elemento ->> 'nome', '')) = lower(v_item.nome)
  limit 1;

  if v_indice is null then
    v_inventario := v_inventario || jsonb_build_array(v_novo);
  else
    v_inventario := jsonb_set(
      v_inventario,
      array[v_indice::text, 'quantidade'],
      to_jsonb(coalesce(public.safe_numeric(v_inventario -> v_indice ->> 'quantidade'), 0) + v_qtd),
      true
    );
  end if;

  update public.fichas
  set dados = jsonb_set(dados, '{suporte,inventario}', v_inventario, true)
  where character_id = p_character_id;
end;
$function$