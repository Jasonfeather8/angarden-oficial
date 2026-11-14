import React from 'react';
import { Award } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import type { CharacterRow } from './useMesaDoMestre';

export interface XpCondutaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  characters: CharacterRow[];
  destinatario: string;
  onDestinatarioChange: (valor: string) => void;
  quantidade: string;
  onQuantidadeChange: (valor: string) => void;
  motivo: string;
  onMotivoChange: (valor: string) => void;
  erro: string;
  isSaving: boolean;
}

/** Concessão de XP de conduta para toda a mesa ou para uma ficha. */
export const XpCondutaModal: React.FC<XpCondutaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  characters,
  destinatario,
  onDestinatarioChange,
  quantidade,
  onQuantidadeChange,
  motivo,
  onMotivoChange,
  erro,
  isSaving,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Conceder XP de Conduta" subtitle="Reconheça feitos dignos de uma nova crônica" maxWidth="max-w-[560px]">
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label htmlFor="xp-target" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Destinatário</label>
        <select id="xp-target" value={destinatario} onChange={(event) => onDestinatarioChange(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]">
          <option value="all">Toda a Mesa ({characters.length})</option>
          {characters.map((character) => <option key={character.id} value={character.id}>{character.nome}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="xp-amount" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Quantidade de XP</label>
        <input id="xp-amount" type="number" min="1" step="1" required value={quantidade} onChange={(event) => onQuantidadeChange(event.target.value)} className="w-full rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" placeholder="Ex.: 250" />
      </div>
      <div>
        <label htmlFor="xp-reason" className="mb-1.5 block font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Motivo</label>
        <textarea id="xp-reason" required rows={3} value={motivo} onChange={(event) => onMotivoChange(event.target.value)} className="w-full resize-y rounded-xs border border-[#5a4225] bg-[#130d08] px-3 py-2.5 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]" placeholder="Descreva o feito que merece reconhecimento." />
      </div>
      {erro && <p role="alert" className="border-l-2 border-[#a85b45] bg-[#28140f] px-3 py-2 font-serif text-sm text-[#e7b29e]">{erro}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" disabled={isSaving} onClick={onClose} className="rounded-xs border border-[#4b3823] px-4 py-2 font-cinzel text-[10px] uppercase text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-50">Cancelar</button>
        <GothicButton type="submit" size="sm" width={190} height={40} disabled={isSaving} icon={<Award className="h-4 w-4" />} className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]">{isSaving ? 'Salvando...' : 'Conceder XP'}</GothicButton>
      </div>
    </form>
  </Modal>
);

export default XpCondutaModal;
