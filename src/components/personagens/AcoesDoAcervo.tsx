import React, { useState } from 'react';
import { Search, Trash2, UserPlus, X } from 'lucide-react';
import type { TenantCharacter } from '../../types';
import { GothicButton } from '../GothicButton';

export interface AcoesDoAcervoProps {
  minhasFichas: number;
  limite: number;
  limiteAtingido: boolean;
  /** Quando false, a contagem "X de Y fichas suas" fica oculta. */
  mostrarContagem: boolean;
  searchTerm: string;
  onBuscar: (valor: string) => void;
  onCriarPersonagem: () => void;
  personagemAtivo: TenantCharacter | null;
  onExcluir: (id: string) => Promise<void>;
}

/**
 * Barra de ações do cabeçalho da galeria: status do limite, busca por nome,
 * criação de personagem e a confirmação de exclusão em dois passos.
 */
export const AcoesDoAcervo: React.FC<AcoesDoAcervoProps> = ({
  minhasFichas,
  limite,
  limiteAtingido,
  mostrarContagem,
  searchTerm,
  onBuscar,
  onCriarPersonagem,
  personagemAtivo,
  onExcluir,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const confirmarExclusao = async () => {
    if (!personagemAtivo) return;
    await onExcluir(personagemAtivo.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
      {limiteAtingido ? (
        <p role="status" className="w-full text-xs text-[#c4b9a3]">Limite de {limite} fichas por jogador atingido. O Mestre pode ampliá-lo.</p>
      ) : mostrarContagem ? (
        <p role="status" className="text-xs text-[#8c6b41]">{minhasFichas} de {limite} fichas suas</p>
      ) : null}
      <div className="relative flex items-center flex-1 sm:flex-initial min-w-[140px]">
        <Search size={14} className="absolute left-2.5 text-[#8c6b41] pointer-events-none" />
        <input
          id="search-personagens"
          type="text"
          value={searchTerm}
          onChange={(e) => onBuscar(e.target.value)}
          placeholder="Pesquisar por nome..."
          className="bg-[#120f0d]/90 border border-[#5a4225] focus:border-[#a88d61] text-[#e6ddc5] placeholder-[#8c6b41] text-xs font-serif pl-8 pr-7 py-1.5 rounded-xs outline-none w-full sm:w-44 md:w-52 transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => onBuscar('')}
            className="absolute right-2 text-[#8c6b41] hover:text-[#e6ddc5]"
            title="Limpar pesquisa"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <GothicButton
        id="btn-novo-personagem"
        onClick={onCriarPersonagem}
        disabled={limiteAtingido}
        size="sm"
        variant="primary"
        width={170}
        height={34}
        icon={<UserPlus size={13} />}
      >
        Novo Personagem
      </GothicButton>
      {personagemAtivo && (
        !showDeleteConfirm ? (
          <GothicButton
            id="btn-excluir-personagem"
            onClick={() => setShowDeleteConfirm(true)}
            size="sm"
            variant="secondary"
            width={95}
            height={34}
            icon={<Trash2 size={13} />}
            title="Excluir Personagem Ativo"
          >
            Excluir
          </GothicButton>
        ) : (
          <div className="flex items-center space-x-1.5 bg-[#1a140e] border border-[#8c6b41] px-2 py-1 rounded-xs shadow-[0_0_10px_rgba(0,0,0,0.8)] h-[34px]">
            <span className="text-[11px] text-[#e6ddc5] font-serif">Excluir?</span>
            <button
              id="btn-confirmar-exclusao"
              onClick={() => void confirmarExclusao()}
              className="px-2 py-0.5 text-[10px] bg-[#3a2818] hover:bg-[#5a4225] text-[#f2dfa8] font-bold rounded-xs font-cinzel border border-[#8c6b41]"
            >
              Sim
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-1.5 py-0.5 text-[10px] bg-[#120f0d] hover:bg-[#2a1d10] text-[#a88d61] rounded-xs font-cinzel border border-[#5a4225]"
            >
              Não
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default AcoesDoAcervo;
