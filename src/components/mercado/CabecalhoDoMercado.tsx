import React from 'react';
import { User, Search, Coins, Hammer } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import type { FichaCompleta } from '../../types';

interface CabecalhoDoMercadoProps {
  tenantId: string | null;
  fichaDoComprador: FichaCompleta | null;
  loadingFicha: boolean;
  saldoAtual: number;
  canManageCatalog: boolean;
  onAbrirSelecaoComprador: () => void;
  onCriarMercadoria: () => void;
}

/**
 * Ações do cabeçalho da tela: seleção do personagem comprador, bolsa de moedas
 * e o botão de criação de mercadoria (exclusivo do Administrador).
 */
export const CabecalhoDoMercado: React.FC<CabecalhoDoMercadoProps> = ({
  tenantId,
  fichaDoComprador,
  loadingFicha,
  saldoAtual,
  canManageCatalog,
  onAbrirSelecaoComprador,
  onCriarMercadoria,
}) => (
  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
    {/* Botão de Seleção de Personagem Comprador (Abre Modal Elegante) */}
    {tenantId && <button
      id="btn-abrir-modal-comprador"
      type="button"
      onClick={onAbrirSelecaoComprador}
      className="flex items-center justify-between gap-1.5 sm:gap-2.5 h-10 bg-[#120f0d]/95 hover:bg-[#1c140d] border border-[#5a4225] hover:border-[#c5a059] px-2.5 sm:px-3 rounded-xs shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all cursor-pointer text-left group min-w-0"
      title="Clique para selecionar o personagem comprador"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        {fichaDoComprador?.identidade?.imagem_url ? (
          <img
            src={fichaDoComprador.identidade.imagem_url}
            alt={fichaDoComprador.identidade.nome_personagem}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-xs object-cover border border-[#8c6b41] group-hover:border-[#c5a059] shrink-0 transition-colors"
          />
        ) : (
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xs bg-[#24170d] border border-[#5a4225] group-hover:border-[#c5a059] flex items-center justify-center shrink-0 text-[#c5a059] transition-colors">
            <User size={13} />
          </div>
        )}

        <div className="min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-[#8c6b41] uppercase tracking-wider block font-cinzel leading-none mb-0.5">
            Comprador
          </span>
          <span className="text-[#f2dfa8] group-hover:text-[#fff] font-cinzel font-bold text-[11px] sm:text-xs truncate block leading-tight transition-colors">
            {loadingFicha ? (
              <span className="block h-3 w-20 animate-pulse rounded-xs border border-[#3a2c1d] bg-[#241a11]/80" />
            ) : fichaDoComprador?.identidade?.nome_personagem || 'Selecionar'}
          </span>
        </div>
      </div>

      <Search size={13} className="text-[#8c6b41] group-hover:text-[#c5a059] shrink-0 ml-0.5 transition-colors" />
    </button>}

    {/* Saldo Atual do Personagem (Bolsa) */}
    {tenantId && <div className="flex items-center justify-center sm:justify-start gap-2 h-10 bg-[#120f0d]/95 border border-[#5a4225] px-2.5 sm:px-3 rounded-xs shadow-[0_0_10px_rgba(0,0,0,0.8)] min-w-0">
      <Coins size={15} className="text-[#d4af37] shrink-0" />
      <div className="text-left flex flex-col justify-center leading-none min-w-0">
        <span className="text-[7.5px] sm:text-[8px] text-[#8c6b41] uppercase tracking-wider block font-cinzel mb-0.5">Bolsa</span>
        <span className="text-[#f2dfa8] font-mono font-bold text-[11px] sm:text-sm tracking-wider truncate">
          {fichaDoComprador ? saldoAtual : '—'} <span className="text-[8.5px] sm:text-[9px] font-cinzel text-[#8c6b41]">Moedas</span>
        </span>
      </div>
    </div>}

    {/* Botão de Criar Mercadoria (Exclusivo para o Administrador) */}
    {canManageCatalog && (
      <div className="col-span-2 sm:col-span-1 sm:w-auto">
        <GothicButton
          id="btn-criar-mercadoria"
          onClick={onCriarMercadoria}
          variant="primary"
          size="sm"
          width={150}
          height={40}
          className="w-full sm:w-[150px] shrink-0 h-10"
        >
          <Hammer size={14} className="mr-1 text-[#d4af37]" />
          Criar Mercadoria
        </GothicButton>
      </div>
    )}

  </div>
);

export default CabecalhoDoMercado;
