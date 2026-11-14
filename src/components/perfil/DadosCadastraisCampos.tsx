import React from 'react';
import { Mail } from 'lucide-react';
import { inputClassName } from './formatters';

export interface DadosCadastraisCamposProps {
  nome: string;
  whatsapp: string;
  /** Email da conta: somente leitura. */
  email: string;
  avatarUrl: string;
  onNomeChange: (valor: string) => void;
  onWhatsappChange: (valor: string) => void;
  onAvatarUrlChange: (valor: string) => void;
}

/** Campos cadastrais do perfil: nome, WhatsApp, email e endereço da foto. */
export const DadosCadastraisCampos: React.FC<DadosCadastraisCamposProps> = ({
  nome,
  whatsapp,
  email,
  avatarUrl,
  onNomeChange,
  onWhatsappChange,
  onAvatarUrlChange,
}) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <label htmlFor="perfil-nome" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Nome completo</label>
      <input id="perfil-nome" type="text" value={nome} onChange={(event) => onNomeChange(event.target.value)} className={inputClassName} autoComplete="name" required maxLength={120} />
    </div>
    <div>
      <label htmlFor="perfil-whatsapp" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">WhatsApp</label>
      <input id="perfil-whatsapp" type="tel" value={whatsapp} onChange={(event) => onWhatsappChange(event.target.value)} className={inputClassName} autoComplete="tel" required maxLength={30} />
    </div>
    <div className="sm:col-span-2">
      <label htmlFor="perfil-email" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#d8c9aa]">
        <Mail className="h-3.5 w-3.5 text-[#a88d61]" aria-hidden="true" />
        Email
      </label>
      <input id="perfil-email" type="email" value={email} className={`${inputClassName} cursor-not-allowed opacity-70`} disabled readOnly />
      <p className="mt-1 text-xs text-[#8c6b41]">O email de acesso não pode ser alterado.</p>
    </div>
    <div className="sm:col-span-2">
      <label htmlFor="perfil-avatar-url" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Endereço da foto (opcional)</label>
      <input id="perfil-avatar-url" type="url" value={avatarUrl.startsWith('data:image') ? '' : avatarUrl} onChange={(event) => onAvatarUrlChange(event.target.value)} className={inputClassName} placeholder="https://..." inputMode="url" />
    </div>
  </div>
);

export default DadosCadastraisCampos;
