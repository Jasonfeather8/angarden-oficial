import { useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { GRUPOS_BIBLIOTECA, type GrupoBiblioteca } from '@/config/biblioteca';
import { carregarAcervoBiblioteca, chaveAcervoBiblioteca } from '@/services/bibliotecaQuery';
import type { ItemBiblioteca } from '@/types';

export interface UseAcervoBibliotecaOptions {
  papel: string | null;
  categoria: string | null;
  termo: string;
}

export interface EstanteBiblioteca {
  grupo: GrupoBiblioteca;
  itens: ItemBiblioteca[];
}

/**
 * Acervo da Biblioteca. O catálogo é global: a RLS entrega tudo o que a conta
 * pode ver (o Administrador também recebe o que está oculto) e o filtro de
 * categoria e a busca são resolvidos no banco, sobre a coluna normalizada
 * `busca`. O agrupamento por seção é só apresentação.
 */
export function useAcervoBiblioteca({ papel, categoria, termo }: UseAcervoBibliotecaOptions) {
  const parametros = useMemo(() => ({ papel, categoria, termo }), [papel, categoria, termo]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: chaveAcervoBiblioteca(parametros),
    queryFn: () => carregarAcervoBiblioteca(parametros),
    placeholderData: keepPreviousData,
    // Sem validade: a estante pinta do cache e revalida em segundo plano a cada
    // visita, para uma publicação recente do Administrador aparecer de imediato.
    staleTime: 0,
  });

  const itens = data ?? [];

  const estantes = useMemo(
    () =>
      GRUPOS_BIBLIOTECA.map((grupo) => ({
        grupo,
        itens: itens.filter((item) =>
          grupo.categorias.some((categoriaDoGrupo) => categoriaDoGrupo.id === item.categoria),
        ),
      })).filter(({ itens: itensDoGrupo }) => itensDoGrupo.length > 0),
    [itens],
  );

  return { itens, estantes, isLoading, isFetching, isError, error, refetch };
}
