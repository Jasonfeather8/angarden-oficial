import React from 'react';
import { Check, Pencil, RefreshCw, ScrollText, ShoppingCart, Sparkles, Store, Wand2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { GothicButton } from '../GothicButton';
import { ToolbarButton } from '../ui/ToolbarButton';
import type { CharacterRow } from './useMesaDoMestre';
import type { CharacterPermissions, PermissionField } from './usePermissoesDaMesa';

const InterruptorPermissao: React.FC<{
  rotulo: string;
  icon: React.ReactNode;
  ativo: boolean;
  disabled: boolean;
  onToggle: (valor: boolean) => void;
}> = ({ rotulo, icon, ativo, disabled, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={ativo}
    disabled={disabled}
    onClick={() => onToggle(!ativo)}
    className={clsx(
      'flex w-full items-center justify-between gap-3 rounded-xs border px-3 py-2.5 text-left font-serif text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:cursor-not-allowed disabled:opacity-60',
      ativo
        ? 'border-[#3e2d1d] bg-[#181008] text-[#dcd1ba] hover:border-[#80652e]'
        : 'border-[#332619] bg-[#140d08] text-[#9b8370] hover:border-[#5a4225]'
    )}
  >
    <span className="flex min-w-0 items-center gap-2">
      <span aria-hidden="true" className={clsx('shrink-0', ativo ? 'text-[#d1a85a]' : 'text-[#7d6a56]')}>{icon}</span>
      <span className="truncate">{rotulo}</span>
    </span>
    <span
      aria-hidden="true"
      className={clsx(
        'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
        ativo ? 'border-[#a88d61] bg-[#5a3d16]' : 'border-[#3e2d1d] bg-[#1b120b]'
      )}
    >
      <span
        className={clsx(
          'absolute top-[3px] h-3 w-3 rounded-full transition-all',
          ativo ? 'left-[19px] bg-[#f3dfaa]' : 'left-[3px] bg-[#7d6a56]'
        )}
      />
    </span>
  </button>
);

export interface PermissoesDaMesaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  characters: CharacterRow[];
  nomesPorJogador: Map<string, string>;
  /** Ficha aberta pelo cartão: sobe para o topo da lista e ganha destaque. */
  focusId: string | null;
  getPermissions: (character: CharacterRow) => CharacterPermissions;
  onUpdatePermission: (character: CharacterRow, field: PermissionField, value: boolean) => void;
  /** Quantas fichas têm permissões editadas e ainda não salvas. */
  alteracoesPendentes: number;
  savingPermissionId: string | null;
  onSalvar: () => void;
  onAbrirFicha: (characterId: string) => void;
}

/** Gaveta lateral de permissões: os cinco interruptores de cada ficha da mesa. */
export const PermissoesDaMesaPanel: React.FC<PermissoesDaMesaPanelProps> = ({
  isOpen,
  onClose,
  characters,
  nomesPorJogador,
  focusId,
  getPermissions,
  onUpdatePermission,
  alteracoesPendentes,
  savingPermissionId,
  onSalvar,
  onAbrirFicha,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/70" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="painel-permissoes-title"
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l-2 border-[#76552f] bg-[#120d09] shadow-[-12px_0_35px_rgba(0,0,0,0.8)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#4b3823] bg-[#21160d] px-5 py-5">
          <div>
            <h2 id="painel-permissoes-title" className="font-cinzel text-base font-bold uppercase tracking-wider text-[#e6ddc5]">Jogadores &amp; Permissões</h2>
            <p className="mt-1 font-serif text-xs text-[#a88d61]">Permissões salvas no servidor</p>
          </div>
          <button type="button" aria-label="Fechar painel de permissões" className="rounded-xs border border-transparent p-2 text-[#a88d61] hover:border-[#5a4225] hover:text-[#f3dfaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {characters.length === 0 ? (
            <p className="font-serif text-sm text-[#a88d61]">Nenhum jogador disponível.</p>
          ) : (
            <div className="space-y-4">
              {[...characters].sort((a, b) => (a.id === focusId ? -1 : b.id === focusId ? 1 : 0)).map((character) => {
                const characterPermissions = getPermissions(character);
                const isSaving = savingPermissionId === 'all' || savingPermissionId === character.id;
                const nomeJogador = character.ownerId ? nomesPorJogador.get(character.ownerId) ?? null : null;
                return (
                  <div
                    key={character.id}
                    className={clsx('rounded-sm border bg-[#150f0a] p-4', character.id === focusId ? 'border-[#a88d61]' : 'border-[#3a2c1d]')}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-cinzel text-sm uppercase text-[#e6ddc5]">{character.nome}</p>
                        <p className="truncate font-serif text-xs text-[#8f795e]">
                          Nível {character.nivel}{nomeJogador ? ` · ${nomeJogador}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <ToolbarButton
                          icon={<ScrollText className="h-3.5 w-3.5" />}
                          onClick={() => onAbrirFicha(character.id)}
                          aria-label={`Abrir ficha de ${character.nome}`}
                        >
                          Abrir ficha
                        </ToolbarButton>
                        {isSaving && <RefreshCw className="h-4 w-4 animate-spin text-[#c6a66d]" aria-label="Salvando permissão" />}
                      </div>
                    </div>

                    <fieldset>
                      <legend className="mb-2 font-cinzel text-[9px] uppercase tracking-[0.18em] text-[#a88d61]">Ficha</legend>
                      <InterruptorPermissao
                        rotulo="Edição liberada"
                        icon={<Pencil className="h-4 w-4" />}
                        ativo={characterPermissions.edicaoLiberada}
                        disabled={isSaving}
                        onToggle={(valor) => onUpdatePermission(character, 'edicaoLiberada', valor)}
                      />
                    </fieldset>

                    <fieldset className="mt-4">
                      <legend className="mb-2 font-cinzel text-[9px] uppercase tracking-[0.18em] text-[#a88d61]">Mercado</legend>
                      <div className="space-y-2">
                        <InterruptorPermissao
                          rotulo="Comprar no Mercado"
                          icon={<ShoppingCart className="h-4 w-4" />}
                          ativo={characterPermissions.podeComprar}
                          disabled={isSaving}
                          onToggle={(valor) => onUpdatePermission(character, 'podeComprar', valor)}
                        />
                        <InterruptorPermissao
                          rotulo="Mercado Épico"
                          icon={<Store className="h-4 w-4" />}
                          ativo={characterPermissions.acessoMercadoEpico}
                          disabled={isSaving}
                          onToggle={(valor) => onUpdatePermission(character, 'acessoMercadoEpico', valor)}
                        />
                        <InterruptorPermissao
                          rotulo="Mercado Arcano"
                          icon={<Wand2 className="h-4 w-4" />}
                          ativo={characterPermissions.acessoMercadoArcano}
                          disabled={isSaving}
                          onToggle={(valor) => onUpdatePermission(character, 'acessoMercadoArcano', valor)}
                        />
                        <InterruptorPermissao
                          rotulo="Mercado Lendário"
                          icon={<Sparkles className="h-4 w-4" />}
                          ativo={characterPermissions.acessoMercadoLendario}
                          disabled={isSaving}
                          onToggle={(valor) => onUpdatePermission(character, 'acessoMercadoLendario', valor)}
                        />
                      </div>
                    </fieldset>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t border-[#4b3823] bg-[#21160d] p-5">
          <p
            role="status"
            aria-live="polite"
            className={clsx('mb-3 font-serif text-xs', alteracoesPendentes > 0 ? 'text-[#e7c56d]' : 'text-[#8f795e]')}
          >
            {alteracoesPendentes > 0
              ? `${alteracoesPendentes} ${alteracoesPendentes === 1 ? 'personagem com alteração não salva' : 'personagens com alterações não salvas'}`
              : 'Nenhuma alteração pendente.'}
          </p>
          <GothicButton
            id="btn-salvar-permissoes"
            type="button"
            width="100%"
            height={42}
            icon={<Check className="h-4 w-4" />}
            disabled={savingPermissionId !== null}
            onClick={onSalvar}
            className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
          >
            {savingPermissionId !== null ? 'Salvando...' : 'Salvar Permissões'}
          </GothicButton>
        </div>
      </aside>
    </div>
  );
};

export default PermissoesDaMesaPanel;
