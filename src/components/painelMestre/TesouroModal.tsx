import React from 'react';
import { Coins, Minus, Plus } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import type { CharacterRow } from './useMesaDoMestre';
import type { OperacaoDeTesouro } from './useTesouroForm';

export interface TesouroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  characters: CharacterRow[];
  personagemId: string;
  onPersonagemChange: (valor: string) => void;
  quantia: string;
  onQuantiaChange: (valor: string) => void;
  operacao: OperacaoDeTesouro;
  onOperacaoChange: (valor: OperacaoDeTesouro) => void;
  erro: string;
  isSaving: boolean;
}

/** Ajuste pontual de tesouro: adicionar ou remover uma quantia de uma ficha. */
export const TesouroModal: React.FC<TesouroModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  characters,
  personagemId,
  onPersonagemChange,
  quantia,
  onQuantiaChange,
  operacao,
  onOperacaoChange,
  erro,
  isSaving,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Ajustar Tesouro" subtitle="Adicionar ou remover dinheiro de uma ficha" maxWidth="max-w-[500px]">
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="money-target" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Personagem</label>
        <select id="money-target" value={personagemId} onChange={(event) => onPersonagemChange(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]">
          {characters.map((character) => <option key={character.id} value={character.id}>{character.nome}</option>)}
        </select>
      </div>
      <fieldset>
        <legend className="mb-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Operação</legend>
        <div className="grid grid-cols-2 gap-2">
          <label className={`flex cursor-pointer items-center gap-2 rounded-xs border px-3 py-2.5 font-serif text-sm ${operacao === 'add' ? 'border-[#a88d61] bg-[#33250f] text-[#f3dfaa]' : 'border-[#4b3823] text-[#a88d61]'} focus-within:ring-2 focus-within:ring-[#d1a85a]`}><input type="radio" name="money-operation" value="add" checked={operacao === 'add'} onChange={() => onOperacaoChange('add')} className="accent-[#b88936]" /><Plus className="h-4 w-4" /> Adicionar</label>
          <label className={`flex cursor-pointer items-center gap-2 rounded-xs border px-3 py-2.5 font-serif text-sm ${operacao === 'remove' ? 'border-[#a88d61] bg-[#33250f] text-[#f3dfaa]' : 'border-[#4b3823] text-[#a88d61]'} focus-within:ring-2 focus-within:ring-[#d1a85a]`}><input type="radio" name="money-operation" value="remove" checked={operacao === 'remove'} onChange={() => onOperacaoChange('remove')} className="accent-[#b88936]" /><Minus className="h-4 w-4" /> Remover</label>
        </div>
      </fieldset>
      <div>
        <label htmlFor="money-amount" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Quantia</label>
        <input id="money-amount" type="number" min="0.01" step="0.01" required value={quantia} onChange={(event) => onQuantiaChange(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" placeholder="Ex.: 50" />
      </div>
      {erro && <p role="alert" className="border-l-2 border-[#a85b45] bg-[#28140f] px-3 py-2 font-serif text-sm text-[#e7b29e]">{erro}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" disabled={isSaving} onClick={onClose} className="rounded-xs border border-[#4b3823] px-4 py-2 font-cinzel text-[10px] uppercase text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-50">Cancelar</button>
        <GothicButton type="submit" size="sm" width={190} height={40} disabled={isSaving} icon={<Coins className="h-4 w-4" />} className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]">{isSaving ? 'Salvando...' : 'Salvar Tesouro'}</GothicButton>
      </div>
    </form>
  </Modal>
);

export default TesouroModal;
