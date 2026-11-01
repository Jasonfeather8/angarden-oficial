import React, { useState, useMemo } from 'react';
import { Search, X, User, Check, Coins } from 'lucide-react';
import { MedievalFrame } from './MedievalFrame';
import { GothicButton } from './GothicButton';

export interface PersonagemResumo {
  id: string;
  nome: string;
  raca?: string;
  nivel?: number;
  imagem_url?: string;
  dinheiro: number;
}

interface ModalSelecionarCompradorProps {
  isOpen: boolean;
  onClose: () => void;
  personagens: PersonagemResumo[];
  personagemSelecionadoId: string;
  onSelecionar: (personagemId: string) => void;
}

export const ModalSelecionarComprador: React.FC<ModalSelecionarCompradorProps> = ({
  isOpen,
  onClose,
  personagens,
  personagemSelecionadoId,
  onSelecionar,
}) => {
  const [busca, setBusca] = useState<string>('');

  const listaFiltrada = useMemo(() => {
    if (!busca.trim()) return personagens;
    const t = busca.toLowerCase().trim();
    return personagens.filter(
      (p) =>
        p.nome.toLowerCase().includes(t) ||
        (p.raca && p.raca.toLowerCase().includes(t)) ||
        (p.nivel && `nível ${p.nivel}`.includes(t))
    );
  }, [personagens, busca]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-selecionar-comprador-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <MedievalFrame
          id="frame-selecionar-comprador"
          title={
            <div className="flex items-center gap-2">
              <User size={18} className="text-[#c5a059] shrink-0" />
              <span>Selecionar Comprador</span>
            </div>
          }
          subtitle="Defina o titular da bolsa"
          headerRight={
            <button
              type="button"
              onClick={onClose}
              className="text-[#8c6b41] hover:text-[#f2dfa8] p-1 rounded-xs transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>
          }
        >
          <div className="p-2 sm:p-3.5 space-y-3">
            {/* Campo de Pesquisa Interno */}
            <div className="relative">
              <div className="flex items-center h-9 sm:h-10 bg-[#0e0a07] border border-[#5a4225] focus-within:border-[#c5a059] rounded-xs px-3 shadow-[inset_0_1px_4px_rgba(0,0,0,0.9)] transition-colors">
                <Search size={14} className="text-[#8c6b41] shrink-0 mr-2.5" />
                <input
                  id="input-pesquisar-personagem-modal"
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar por nome ou raça..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#f2dfa8] placeholder-[#8c6b41] font-cinzel outline-none tracking-wide"
                  autoFocus
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca('')}
                    className="text-[#8c6b41] hover:text-[#f2dfa8] p-1 transition-colors cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Lista com scroll dos personagens limitada a 50vh para nunca ultrapassar a tela */}
            <div className="max-h-[46vh] sm:max-h-[50vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {listaFiltrada.length === 0 ? (
                <div className="py-6 text-center text-[#8c6b41] font-cinzel text-xs sm:text-sm border border-dashed border-[#3a2818] rounded-xs">
                  Nenhum aventureiro encontrado com esse nome.
                </div>
              ) : (
                listaFiltrada.map((p) => {
                  const isSelected = p.id === personagemSelecionadoId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelecionar(p.id);
                        onClose();
                      }}
                      className={`group flex items-center justify-between p-2 sm:p-2.5 rounded-xs border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2b180d]/90 border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.25)]'
                          : 'bg-[#120e0a]/80 border-[#3a2818] hover:bg-[#1c140d] hover:border-[#8c6b41]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {p.imagem_url ? (
                          <img
                            src={p.imagem_url}
                            alt={p.nome}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xs object-cover border shrink-0 ${
                              isSelected ? 'border-[#c5a059]' : 'border-[#5a4225]'
                            }`}
                          />
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xs bg-[#1f150e] border border-[#5a4225] flex items-center justify-center shrink-0 text-[#8c6b41]">
                            <User size={16} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-cinzel font-bold text-xs sm:text-sm text-[#f2dfa8] truncate">
                              {p.nome}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[8px] sm:text-[9px] uppercase font-cinzel font-bold text-[#d4af37] bg-[#3a2818] px-1.5 py-0.5 rounded-xs border border-[#8c6b41]/60 shrink-0">
                                <Check size={10} /> Ativo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] sm:text-xs text-[#8c6b41] truncate mt-0.5">
                            {p.raca || 'Aventureiro'} {p.nivel ? `• Nível ${p.nivel}` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Saldo de Moedas do Personagem */}
                      <div className="text-right shrink-0 ml-2 sm:ml-3">
                        <span className="text-[8px] sm:text-[9px] uppercase font-cinzel text-[#8c6b41] block leading-none mb-0.5">
                          Bolsa
                        </span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-[#e6ddc5] flex items-center justify-end gap-1">
                          <Coins size={12} className="text-[#d4af37]" />
                          {p.dinheiro} <span className="text-[9px] font-cinzel text-[#8c6b41]">M</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé informativo com botão FECHAR sempre visível */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2a1c12] text-[10px] text-[#8c6b41] font-cinzel">
              <span>{listaFiltrada.length} de {personagens.length} personagens</span>
              <GothicButton
                type="button"
                onClick={onClose}
                variant="secondary"
                size="sm"
                width={90}
                height={30}
              >
                Fechar
              </GothicButton>
            </div>
          </div>
        </MedievalFrame>
      </div>
    </div>
  );
};
