import React from 'react';
import { Camera } from 'lucide-react';

export interface RetratoDoPerfilProps {
  avatarUrl: string;
  /** Nome em edição no formulário; entra no texto alternativo da foto. */
  nome: string;
  /** Nome gravado na conta, usado quando o campo de nome está vazio. */
  nomeCompleto: string;
  /** Iniciais exibidas quando não há foto escolhida. */
  iniciais: string;
  onFotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Bloco do retrato: prévia do avatar e a escolha de uma imagem local. */
export const RetratoDoPerfil: React.FC<RetratoDoPerfilProps> = ({
  avatarUrl,
  nome,
  nomeCompleto,
  iniciais,
  onFotoChange,
}) => (
  <div className="flex flex-col items-center gap-3 border-b border-[#3a2c1d] pb-5 sm:flex-row sm:items-start">
    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#8c6b41] bg-[#1e1710] shadow-[0_0_12px_rgba(140,107,65,0.35)]">
      {avatarUrl ? (
        <img src={avatarUrl} alt={`Avatar de ${nome || nomeCompleto}`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-cinzel text-xl font-bold text-[#a88d61]">{iniciais}</div>
      )}
    </div>
    <div className="space-y-2 text-center sm:text-left">
      <p className="font-cinzel text-base font-bold text-[#f0e2c0]">Retrato do aventureiro</p>
      <p className="text-sm text-[#b9aa91]">Escolha uma imagem local para atualizar seu avatar.</p>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#5a4225] bg-[#1a140e] px-3 py-2 text-sm text-[#d4af37] transition-colors hover:border-[#a88d61] hover:text-[#f3ebd3] focus-within:ring-2 focus-within:ring-[#d4af37]">
        <Camera className="h-4 w-4" aria-hidden="true" />
        Escolher foto
        <input type="file" accept="image/*" onChange={onFotoChange} className="sr-only" />
      </label>
    </div>
  </div>
);

export default RetratoDoPerfil;
