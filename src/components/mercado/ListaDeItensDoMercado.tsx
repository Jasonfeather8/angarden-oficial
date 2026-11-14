import React from 'react';
import { GothicButton } from '../GothicButton';
import { ErrorState } from '../ui/ErrorState';
import { EmptyState } from '../ui/EmptyState';
import { MercadoListaSkeleton } from './MercadoListaSkeleton';
import { LinhaDeItemDoMercado } from './LinhaDeItemDoMercado';
import type { MercadoItem } from '../../types';

interface ListaDeItensDoMercadoProps {
  itens: MercadoItem[];
  carregandoItens: boolean;
  erroItens: boolean;
  erroConsulta: unknown;
  totalItens: number;
  rotuloCategoria?: string;
  temPermissaoEpica: boolean;
  temPermissaoArcano: boolean;
  onAbrirDetalhes: (item: MercadoItem) => void;
  onPreloadDetalhes: () => void;
  onRecarregar: () => void;
  page: number;
  totalPaginas: number;
  pageSize: number;
  isPlaceholderData: boolean;
  onPaginaAnterior: () => void;
  onProximaPagina: () => void;
}

/**
 * Listagem de itens da categoria ativa com os quatro estados da seção
 * (carregando, erro, vazio e sucesso) e a paginação do catálogo.
 */
export const ListaDeItensDoMercado: React.FC<ListaDeItensDoMercadoProps> = ({
  itens,
  carregandoItens,
  erroItens,
  erroConsulta,
  totalItens,
  rotuloCategoria,
  temPermissaoEpica,
  temPermissaoArcano,
  onAbrirDetalhes,
  onPreloadDetalhes,
  onRecarregar,
  page,
  totalPaginas,
  pageSize,
  isPlaceholderData,
  onPaginaAnterior,
  onProximaPagina,
}) => (
  <>
    {carregandoItens ? (
      <div role="status" aria-live="polite" className="py-10">
        <span className="sr-only">Consultando registros do arsenal…</span>
        <MercadoListaSkeleton />
      </div>
    ) : erroItens ? (
      <ErrorState
        title="Falha ao consultar o catálogo"
        description={erroConsulta instanceof Error ? erroConsulta.message : 'Não foi possível carregar o catálogo do mercado.'}
        onRetry={() => { void onRecarregar(); }}
      />
    ) : totalItens === 0 ? (
      <EmptyState
        variant="plano"
        title="Nenhum item encontrado nesta subcategoria."
        description={'Tente selecionar "Todas as Armas" ou cadastrar uma nova mercadoria através do botão do Administrador.'}
      />
    ) : (
      <div className="space-y-2 bg-[#0c0806]/85 p-1.5 sm:p-3 rounded-xs border border-[#5a4225] shadow-[0_0_20px_rgba(0,0,0,0.8)]">
        {/* CABEÇALHO DA TABELA DE ITENS - Visível apenas a partir de telas sm/md para não poluir o mobile */}
        <div className="hidden sm:grid grid-cols-12 text-[10px] sm:text-xs font-cinzel text-[#8c6b41] px-3 py-2 border-b border-[#3a2c1d] uppercase tracking-wider text-center items-center font-bold">
          <div className="col-span-1 text-left">Item</div>
          <div className="col-span-5 md:col-span-4 text-left">Nome</div>
          <div className="col-span-3 sm:col-span-2 text-center">Preço</div>
          <div className="hidden md:block col-span-2 text-center">Propriedades</div>
          <div className="hidden lg:block col-span-1 text-center">Peso</div>
          <div className="col-span-1 text-center">Info</div>
          <div className="col-span-2 md:col-span-1 text-right pr-1">Ação</div>
        </div>

        {/* TABELA / LISTA DE LINHAS METÁLICAS */}
        <div className="space-y-2">
          {itens.map((item) => (
            <LinhaDeItemDoMercado
              key={item.id}
              item={item}
              rotuloCategoria={rotuloCategoria}
              temPermissaoEpica={temPermissaoEpica}
              temPermissaoArcano={temPermissaoArcano}
              onAbrirDetalhes={onAbrirDetalhes}
              onPreloadDetalhes={onPreloadDetalhes}
            />
          ))}
        </div>
      </div>
    )}

    {!carregandoItens && !erroItens && totalItens > 0 && (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-2">
        <span className="text-[10px] sm:text-xs text-[#a88d61] font-serif">
          Exibindo {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItens)} de {totalItens} itens
        </span>
        <div className="flex items-center gap-2">
          <GothicButton
            onClick={onPaginaAnterior}
            disabled={page <= 1 || isPlaceholderData}
            variant="secondary"
            size="sm"
            width={110}
            height={34}
          >
            Anterior
          </GothicButton>
          <span className="text-[10px] text-[#dcd1ba] font-cinzel whitespace-nowrap">
            Página {page} de {totalPaginas}
          </span>
          <GothicButton
            onClick={onProximaPagina}
            disabled={page >= totalPaginas || isPlaceholderData}
            variant="secondary"
            size="sm"
            width={110}
            height={34}
          >
            Próxima
          </GothicButton>
        </div>
      </div>
    )}
  </>
);

export default ListaDeItensDoMercado;
