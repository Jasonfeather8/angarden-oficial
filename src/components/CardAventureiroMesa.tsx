import React from 'react';
import { clsx } from 'clsx';
import { Coins, Pencil, ScrollText, ShoppingCart, Sparkles, Store, UserCog, Wand2 } from 'lucide-react';
import { BarraProgresso } from './ui/BarraProgresso';
import { Skeleton } from './ui/Skeleton';
import { ToolbarButton } from './ui/ToolbarButton';

export interface AventureiroMesa {
  id: string;
  nome: string;
  jogador: string | null;
  imagemUrl?: string;
  nivel: number;
  xp: number;
  dinheiro: number;
  edicaoLiberada: boolean;
  podeComprar: boolean;
  acessoMercadoEpico: boolean;
  acessoMercadoArcano: boolean;
  acessoMercadoLendario: boolean;
  status: { vidaAtual: number; vidaMax: number; vigorAtual: number; vigorMax: number; north: number } | null;
}

export interface CardAventureiroMesaProps {
  aventureiro: AventureiroMesa;
  onAbrirFicha: (characterId: string) => void;
  onAjustarTesouro?: (characterId: string) => void;
  onPermissoes?: (characterId: string) => void;
}

const SeloPermissao: React.FC<{ ativo: boolean; rotulo: string; icon: React.ReactNode }> = ({ ativo, rotulo, icon }) => (
  <span
    title={`${rotulo}: ${ativo ? 'liberado' : 'bloqueado'}`}
    className={clsx(
      'inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 font-cinzel text-[9px] uppercase tracking-wider',
      ativo ? 'border-[#80652e] bg-[#33250f] text-[#e7c56d]' : 'border-[#3e2d1d] bg-[#150f0a] text-[#7d6a56]'
    )}
  >
    <span aria-hidden="true" className="flex items-center gap-1">
      {icon}
      <span>{rotulo}</span>
    </span>
    <span className="sr-only">{`${rotulo}: ${ativo ? 'liberado' : 'bloqueado'}`}</span>
  </span>
);

/**
 * Cartão de um personagem da mesa: retrato, vitais em barras, as cinco permissões
 * em selos de leitura e ações opcionais do Mestre (cartão de leitura quando as ações do Mestre não são passadas).
 */
export const CardAventureiroMesa: React.FC<CardAventureiroMesaProps> = ({
  aventureiro,
  onAbrirFicha,
  onAjustarTesouro,
  onPermissoes,
}) => {
  const inicial = aventureiro.nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <article className="flex min-w-0 flex-col rounded-sm border border-[#3a2c1d] bg-[#150f0a] shadow-[0_2px_10px_rgba(0,0,0,0.45)] transition-colors hover:border-[#5a4225]">
      <header className="flex min-w-0 items-start gap-3 border-b border-[#2e2216] bg-[#1b120b] px-4 py-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-[#5a4225] bg-[#241a11]">
          {aventureiro.imagemUrl ? (
            <img
              src={aventureiro.imagemUrl}
              alt={`Retrato de ${aventureiro.nome}`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="font-cinzel text-lg font-bold text-[#c6a66d]">{inicial}</span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-cinzel text-base font-bold text-[#e6ddc5]">{aventureiro.nome}</h3>
          <p className="mt-0.5 font-serif text-xs text-[#a88d61]">
            Nível {aventureiro.nivel} · {aventureiro.xp} XP
          </p>
          {aventureiro.jogador && (
            <p className="truncate font-serif text-xs text-[#8f795e]">Jogador: {aventureiro.jogador}</p>
          )}
        </div>

        <span
          title="Tesouro"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xs border border-[#4b3823] bg-[#241a11] px-2 py-1 font-serif text-xs text-[#d8b86b]"
        >
          <Coins className="h-3.5 w-3.5" aria-hidden="true" />
          {aventureiro.dinheiro}
          <span className="sr-only">moedas de tesouro</span>
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[1fr_1fr_auto]">
        {aventureiro.status ? (
          <>
            <BarraProgresso rotulo="Vida" atual={aventureiro.status.vidaAtual} max={aventureiro.status.vidaMax} />
            <BarraProgresso rotulo="Vigor" atual={aventureiro.status.vigorAtual} max={aventureiro.status.vigorMax} />
            <div className="flex flex-col items-center justify-center rounded-xs border border-[#3a2c1d] bg-[#1b120b] px-3 py-1.5">
              <span className="font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#a88d61]">North</span>
              <span className="font-cinzel text-base font-bold text-[#e0c98e]">{aventureiro.status.north}</span>
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-11 w-20" />
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-[#2e2216] px-4 py-3">
        <SeloPermissao ativo={aventureiro.edicaoLiberada} rotulo="Edição" icon={<Pencil className="h-3 w-3" />} />
        <SeloPermissao ativo={aventureiro.podeComprar} rotulo="Compra" icon={<ShoppingCart className="h-3 w-3" />} />
        <SeloPermissao ativo={aventureiro.acessoMercadoEpico} rotulo="Épico" icon={<Store className="h-3 w-3" />} />
        <SeloPermissao ativo={aventureiro.acessoMercadoArcano} rotulo="Arcano" icon={<Wand2 className="h-3 w-3" />} />
        <SeloPermissao ativo={aventureiro.acessoMercadoLendario} rotulo="Lendário" icon={<Sparkles className="h-3 w-3" />} />
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-[#2e2216] bg-[#120c08] px-4 py-3">
        <ToolbarButton
          icon={<ScrollText className="h-3.5 w-3.5" />}
          onClick={() => onAbrirFicha(aventureiro.id)}
          aria-label={`Abrir ficha de ${aventureiro.nome}`}
        >
          Abrir ficha
        </ToolbarButton>
        {onAjustarTesouro && (
          <ToolbarButton
            icon={<Coins className="h-3.5 w-3.5" />}
            onClick={() => onAjustarTesouro(aventureiro.id)}
            aria-label={`Ajustar tesouro de ${aventureiro.nome}`}
          >
            Tesouro
          </ToolbarButton>
        )}
        {onPermissoes && (
          <ToolbarButton
            variant="primary"
            className="ml-auto"
            icon={<UserCog className="h-3.5 w-3.5" />}
            onClick={() => onPermissoes(aventureiro.id)}
            aria-label={`Permissões de ${aventureiro.nome}`}
          >
            Permissões
          </ToolbarButton>
        )}
      </div>
    </article>
  );
};

export default CardAventureiroMesa;
