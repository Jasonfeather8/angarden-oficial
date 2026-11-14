import React from 'react';
import { LogOut, Save } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import { DadosCadastraisCampos } from './DadosCadastraisCampos';
import { RetratoDoPerfil } from './RetratoDoPerfil';
import { SenhaCampos } from './SenhaCampos';
import type { PerfilForm } from './usePerfilForm';
import type { Usuario } from '@/types';

export interface FormularioDePerfilProps {
  /** Conta da sessão: email somente leitura e nome gravado. */
  usuario: Usuario;
  iniciais: string;
  /** Estado e ações do formulário (`usePerfilForm`). */
  form: PerfilForm;
  onSair: () => void;
}

/**
 * Formulário do perfil: retrato, dados cadastrais, troca de senha, os avisos de
 * erro e sucesso e as ações de sair da conta e salvar.
 */
export const FormularioDePerfil: React.FC<FormularioDePerfilProps> = ({
  usuario,
  iniciais,
  form,
  onSair,
}) => (
  <form className="space-y-6" onSubmit={form.handleSubmit}>
    <RetratoDoPerfil
      avatarUrl={form.avatarUrl}
      nome={form.nome}
      nomeCompleto={usuario.nome_completo}
      iniciais={iniciais}
      onFotoChange={form.handlePhotoChange}
    />

    <DadosCadastraisCampos
      nome={form.nome}
      whatsapp={form.whatsapp}
      email={usuario.email}
      avatarUrl={form.avatarUrl}
      onNomeChange={form.setNome}
      onWhatsappChange={form.setWhatsapp}
      onAvatarUrlChange={form.setAvatarUrl}
    />

    <SenhaCampos
      senha={form.senha}
      confirmacao={form.confirmacao}
      onSenhaChange={form.setSenha}
      onConfirmacaoChange={form.setConfirmacao}
    />

    {form.error && <p role="alert" className="border border-red-900/80 bg-red-950/40 px-3 py-2 text-sm text-red-200">{form.error}</p>}
    {form.message && <p role="status" className="border border-emerald-900/80 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">{form.message}</p>}

    <div className="flex flex-col gap-3 border-t border-[#3a2c1d] pt-5 sm:flex-row sm:items-center sm:justify-between">
      <GothicButton type="button" variant="danger" size="sm" width={170} icon={<LogOut className="h-4 w-4" aria-hidden="true" />} onClick={onSair} className="focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]">
        Sair da conta
      </GothicButton>
      <GothicButton type="submit" size="sm" width={190} disabled={form.isSaving} icon={<Save className="h-4 w-4" aria-hidden="true" />} className="focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]">
        {form.isSaving ? 'Salvando...' : 'Salvar alterações'}
      </GothicButton>
    </div>
  </form>
);

export default FormularioDePerfil;
