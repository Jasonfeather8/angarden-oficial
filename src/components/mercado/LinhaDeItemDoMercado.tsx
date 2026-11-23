import React from 'react';
import { Lock, Coins } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import { MolduraDeItem } from '../MolduraDeItem';
import { LOTE_PROJETEIS } from '../../services/mercadoService';
import type { MercadoItem } from '../../types';

interface LinhaDeItemDoMercadoProps {
  item: MercadoItem;
  rotuloCategoria?: string;
  temPermissaoEpica: boolean;
  temPermissaoArcano: boolean;
  onAbrirDetalhes: (item: MercadoItem) => void;
  onPreloadDetalhes: () => void;
}

/**
 * Linha metálica do catálogo: moldura ornamental do ícone, placa de madeira com
 * nome/preço/propriedades/peso e as ações de informação e compra.
 * O bloqueio por permissão é derivado do próprio item.
 */
export const LinhaDeItemDoMercado: React.FC<LinhaDeItemDoMercadoProps> = ({
  item,
  rotuloCategoria,
  temPermissaoEpica,
  temPermissaoArcano,
  onAbrirDetalhes,
  onPreloadDetalhes,
}) => {
  const bloqueadoEpico = item.is_epico && !temPermissaoEpica;
  const ehProjetil = item.categoria === 'mercado_progeteis';
  const ehBumerangue = item.categoria === 'mercado_ld' && (item.subcategoria === 'Bumerangue' || item.tipo === 'Bumerangue');
  const bloqueadoArcano = item.categoria?.startsWith('arcano_') && !temPermissaoArcano;
  const bloqueado = bloqueadoEpico || bloqueadoArcano;
  const rotuloBloqueio = bloqueadoEpico ? 'Arsenal Épico Restrito' : 'Mercado Arcano Restrito';

  return (
    <div
      id={`card-item-${item.id}`}
      onMouseEnter={onPreloadDetalhes}
      className={`group relative rounded-xs p-1.5 flex flex-col sm:grid sm:grid-cols-12 items-stretch sm:items-center gap-1.5 ${
        bloqueado ? 'opacity-60 cursor-not-allowed' : ''
      }`}
      style={{
        background: 'linear-gradient(180deg, #323b44 0%, #222930 15%, #151a1e 50%, #0d1013 85%, #07090b 100%)',
        borderTop: '1px solid #546473',
        borderBottom: '1.5px solid #050709',
        borderLeft: '1px solid #283038',
        borderRight: '1px solid #283038',
        boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
      }}
    >
      {/* PARTE PRINCIPAL: ÍCONE + DADOS (No mobile é uma linha horizontal unificada) */}
      <div className="flex items-center gap-2 sm:contents w-full">
        {/* 1. ÍCONE DO ITEM COM MOLDURA ORNAMENTAL E MEDALHÃO TIER */}
        <div className="sm:col-span-1 flex items-center justify-start shrink-0">
          <MolduraDeItem
            type={item.icone_tipo}
            imageUrl={item.imagem_url}
            ladoMiniatura={144}
            canto={(
              <div
                className="absolute -top-0.5 -left-0.5 z-30 w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold font-cinzel text-[#fde68a]"
                style={{
                  background: 'linear-gradient(180deg, #3a4652 0%, #151c22 100%)',
                  border: '1px solid #c5a059',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
                title={item.is_epico ? 'Nível Épico' : 'Nível I'}
              >
                {item.is_epico ? '★' : 'I'}
              </div>
            )}
            sobreposicao={bloqueado ? (
              <div role="img" aria-label={rotuloBloqueio} title={rotuloBloqueio} className="absolute inset-0 bg-black/85 z-40 rounded-xs flex items-center justify-center border border-[#3d4955]">
                <Lock size={14} className="text-[#8c6b41]" aria-hidden="true" />
              </div>
            ) : undefined}
          />
        </div>

        {/* 2. PLACA INTERNA DE MADEIRA NOBRE TEXTURIZADA */}
        <div
          className="relative flex-1 sm:col-span-8 md:col-span-8 lg:col-span-9 py-1 px-2.5 sm:pr-4 flex items-center overflow-hidden min-w-0"
          style={{
            background: 'linear-gradient(180deg, #3a1912 0%, #270f09 50%, #1a0805 100%)',
            backgroundImage: 'linear-gradient(180deg, #3a1912 0%, #220b06 100%), repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 4px)',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.85), inset 0 -2px 4px rgba(0,0,0,0.85), inset 1px 0 2px rgba(0,0,0,0.7)',
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
          }}
        >
          {/* Grampos metálicos superiores (dentes de ferro cravados na madeira) */}
          <div className="absolute top-0 left-2 right-4 h-[4px] pointer-events-none flex justify-between overflow-hidden z-20">
            {[...Array(7)].map((_, idx) => (
              <span
                key={`clamp-top-${idx}`}
                className="w-2.5 h-1.5 bg-gradient-to-b from-[#546473] to-[#1e252c] border-x border-b border-[#0d1115] shadow-xs"
                style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
              />
            ))}
          </div>

          {/* Grampos metálicos inferiores (dentes de ferro cravados na madeira) */}
          <div className="absolute bottom-0 left-2 right-4 h-[4px] pointer-events-none flex justify-between overflow-hidden z-20">
            {[...Array(7)].map((_, idx) => (
              <span
                key={`clamp-bot-${idx}`}
                className="w-2.5 h-1.5 bg-gradient-to-t from-[#546473] to-[#1e252c] border-x border-t border-[#0d1115] shadow-xs"
                style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }}
              />
            ))}
          </div>

          {/* Colunas internas de dados alinhadas */}
          <div className="w-full flex items-center justify-between sm:grid sm:grid-cols-8 lg:grid-cols-9 gap-1.5 z-10 min-w-0">
            {/* Nome & Subtítulo */}
            <div className="min-w-0 flex-1 sm:col-span-5 md:col-span-4 pr-1 sm:pr-2 overflow-hidden">
              <h4
                onClick={() => !bloqueado && onAbrirDetalhes(item)}
                className={`font-cinzel text-xs sm:text-[13px] font-bold tracking-wider truncate cursor-pointer transition-colors ${
                  bloqueado
                    ? 'text-[#5a4228]'
                    : 'text-[#f2dfa8] hover:text-[#fff5db]'
                }`}
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
                }}
                title={bloqueado ? rotuloBloqueio : item.nome}
              >
                {item.nome}
              </h4>
              <div className="text-[10px] text-[#bda171] truncate flex items-center gap-1 font-serif mt-0.5">
                <span className="text-[#c7aa78] truncate">{item.subcategoria || rotuloCategoria}</span>
                {item.material && (
                  <>
                    <span className="text-[#71542f]">&bull;</span>
                    <span className="text-[#decbb0] truncate">{item.material}</span>
                  </>
                )}
              </div>
            </div>

            {/* Preço */}
            <div className="shrink-0 sm:col-span-3 md:col-span-2 border-l border-[#8c6b41]/40 pl-2 pr-1 sm:px-1 flex items-center justify-end sm:justify-center gap-1 sm:gap-1.5">
              <Coins size={12} className="text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.6)] shrink-0" />
              <span
                className="font-mono text-xs sm:text-sm font-bold text-[#fde68a] tracking-wider whitespace-nowrap"
                title={ehProjetil ? `${item.preco} Moedas por ${LOTE_PROJETEIS} unidades` : undefined}
              >
                {item.preco.toLocaleString('pt-BR')}
              </span>
              {ehProjetil && <span className="font-cinzel text-[9px] text-[#a88d61] whitespace-nowrap">/dúzia</span>}
            </div>

            {/* Propriedades (MD+) */}
            <div className="hidden md:flex col-span-2 border-l border-[#8c6b41]/40 px-2 items-center justify-center text-center">
              {item.categoria === 'mercado_ld' || item.tensao !== undefined ? (
                <div className="text-[11px] truncate font-mono">
                  <span className="text-[#fde68a] font-semibold">
                    {ehBumerangue ? 'Dano' : 'Tensão'} {ehBumerangue ? item.dano : item.tensao !== undefined ? item.tensao : item.dano}
                  </span>
                  {!ehBumerangue && item.tensao !== undefined && item.dano && item.dano !== item.tensao && (
                    <span className="text-red-300 font-semibold ml-1">
                      ({item.dano})
                    </span>
                  )}
                </div>
              ) : item.dano ? (
                <span className="text-[11px] text-red-300 font-mono font-semibold">
                  Dano {item.dano}
                </span>
              ) : item.rd_base ? (
                <span className="text-[11px] text-[#fde68a] font-mono font-semibold">
                  RD +{item.rd_base}
                </span>
              ) : item.efeito_resumo ? (
                <span className="text-[10px] text-[#dfcfb5] truncate font-serif italic">
                  {item.efeito_resumo}
                </span>
              ) : (
                <span className="text-[11px] text-[#71542f] font-mono">-</span>
              )}
            </div>

            {/* Peso (LG+) */}
            <div className="hidden lg:flex col-span-1 border-l border-[#8c6b41]/40 items-center justify-center text-center">
              <span className="text-[11px] text-[#decbb0] font-mono">
                {item.peso ? `${item.peso} kg` : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTÕES DE AÇÃO: INFO & COMPRAR (No mobile ficam em barra inferior ergonômica, no sm/md voltam para a grade) */}
      <div className="flex sm:contents items-center justify-between sm:justify-center gap-2 pt-1 sm:pt-0 border-t border-[#3a2c1d]/60 sm:border-0">
        {/* 3. BOTÃO DE INFORMAÇÃO (i) CIRCULAR CRAVADO NO METAL */}
        <div className="sm:col-span-1 flex items-center justify-center shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!bloqueado) {
                onAbrirDetalhes(item);
              }
            }}
            disabled={bloqueado}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
              bloqueado
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105 hover:brightness-125 cursor-pointer active:scale-95'
            }`}
            style={{
              background: 'linear-gradient(180deg, #303942 0%, #191f25 50%, #0c0e11 100%)',
              border: '1px solid #4a5866',
              boxShadow: 'inset 0 1.5px 2px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.6)',
            }}
            aria-label={bloqueado ? rotuloBloqueio : 'Ver informações completas do item'}
            title={bloqueado ? rotuloBloqueio : 'Ver informações completas do item'}
          >
            <span
              className="font-serif italic font-black text-xs sm:text-[13px] text-[#f59e0b] select-none leading-none pl-0.5"
              style={{
                textShadow: '0 0 5px rgba(245, 158, 11, 0.75), 0 1px 2px #000',
              }}
            >
              i
            </span>
          </button>
        </div>

        {/* 4. BOTÃO COMPRAR PADRÃO DO SISTEMA (GothicButton) */}
        <div className="flex-1 sm:flex-initial sm:col-span-2 md:col-span-1 sm:pl-1 flex items-center justify-end">
          <GothicButton
            id={`btn-comprar-${item.id}`}
            disabled={bloqueado}
            onClick={(e) => {
              e.stopPropagation();
              if (!bloqueado) {
                onAbrirDetalhes(item);
              }
            }}
            variant="primary"
            size="xs"
            width="100%"
            height={30}
            title={bloqueado ? rotuloBloqueio : 'Comprar Item'}
            aria-label={bloqueado ? rotuloBloqueio : 'Comprar Item'}
            icon={bloqueado ? <Lock size={11} /> : undefined}
          >
            {bloqueado ? '' : 'COMPRAR'}
          </GothicButton>
        </div>
      </div>
      {!bloqueado && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xs bg-gradient-to-b from-white/10 via-white/5 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
      )}

    </div>
  );
};

export default LinhaDeItemDoMercado;
