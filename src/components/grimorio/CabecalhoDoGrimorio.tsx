import React from 'react';
import { Plus, Search, User } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import type { PersonagemResumo } from '../ModalSelecionarComprador';

const ACTIVE_CHARACTER_LABEL = 'Personagem ativo';

interface CabecalhoDoGrimorioProps {
  tenantId: string | null;
  selectedPersonagem?: PersonagemResumo;
  isLoadingPersonagens: boolean;
  exibirRotuloPersonagemAtivo: boolean;
  canManageCatalog: boolean;
  onAbrirSelecaoPersonagem: () => void;
  onCriarMagia: () => void;
}

/** Ações do cabeçalho: personagem das magias aprendidas e inscrição de magia. */
export const CabecalhoDoGrimorio = ({ tenantId, selectedPersonagem, isLoadingPersonagens, exibirRotuloPersonagemAtivo, canManageCatalog, onAbrirSelecaoPersonagem, onCriarMagia }: CabecalhoDoGrimorioProps) => (
  <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
    {tenantId && <button
      id="btn-abrir-modal-personagem-grimorio"
      type="button"
      onClick={onAbrirSelecaoPersonagem}
      aria-label="Selecionar personagem para aprender magias"
      title="Clique para selecionar o personagem das magias aprendidas"
      className="flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-xs border border-[#5a4225] bg-[#120f0d]/95 px-2.5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all hover:border-[#c5a059] hover:bg-[#1c140d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c5a059] sm:w-auto sm:gap-2.5 sm:px-3"
    >
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        {selectedPersonagem?.imagem_url ? (
          <img
            src={selectedPersonagem.imagem_url}
            alt={selectedPersonagem.nome}
            className="h-6 w-6 shrink-0 rounded-xs border border-[#8c6b41] object-cover sm:h-7 sm:w-7"
          />
        ) : (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-[#5a4225] bg-[#24170d] text-[#c5a059] sm:h-7 sm:w-7">
            <User size={13} />
          </div>
        )}
        <div className="min-w-0">
          <span className="mb-0.5 block font-cinzel text-[7.5px] uppercase leading-none tracking-wider text-[#8c6b41] sm:text-[8px]">Personagem</span>
          <span className="block truncate font-cinzel text-[11px] font-bold leading-tight text-[#f2dfa8] sm:text-xs">
            {selectedPersonagem?.nome ?? (isLoadingPersonagens ? 'Carregando…' : 'Selecionar')}
          </span>
        </div>
      </div>
      <Search size={13} className="ml-0.5 shrink-0 text-[#8c6b41]" />
    </button>}
    {tenantId && exibirRotuloPersonagemAtivo && <span className="text-[10px] uppercase tracking-widest text-[#8c6b41]">{ACTIVE_CHARACTER_LABEL}</span>}
    {canManageCatalog && <GothicButton
      type="button"
      onClick={onCriarMagia}
      variant="primary"
      size="xs"
      width="100%"
      height={30}
      className="max-[639px]:!h-11 sm:!w-[125px]"
      icon={<Plus size={14} />}
    >
      Criar magia
    </GothicButton>}
  </div>
);
