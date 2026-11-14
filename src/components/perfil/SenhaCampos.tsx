import React from 'react';
import { KeyRound } from 'lucide-react';
import { inputClassName } from './formatters';

export interface SenhaCamposProps {
  senha: string;
  confirmacao: string;
  onSenhaChange: (valor: string) => void;
  onConfirmacaoChange: (valor: string) => void;
}

/** Bloco "Alterar senha": nova senha e confirmação, em branco para manter. */
export const SenhaCampos: React.FC<SenhaCamposProps> = ({
  senha,
  confirmacao,
  onSenhaChange,
  onConfirmacaoChange,
}) => (
  <div className="border-t border-[#3a2c1d] pt-5">
    <div className="mb-3 flex items-center gap-2">
      <KeyRound className="h-4 w-4 text-[#a88d61]" aria-hidden="true" />
      <h3 className="font-cinzel text-base font-bold text-[#e6ddc5]">Alterar senha</h3>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="perfil-senha" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Nova senha</label>
        <input id="perfil-senha" type="password" value={senha} onChange={(event) => onSenhaChange(event.target.value)} className={inputClassName} autoComplete="new-password" minLength={6} maxLength={128} placeholder="Deixe em branco para manter" />
      </div>
      <div>
        <label htmlFor="perfil-confirmacao" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Confirmar nova senha</label>
        <input id="perfil-confirmacao" type="password" value={confirmacao} onChange={(event) => onConfirmacaoChange(event.target.value)} className={inputClassName} autoComplete="new-password" minLength={6} maxLength={128} />
      </div>
    </div>
  </div>
);

export default SenhaCampos;
