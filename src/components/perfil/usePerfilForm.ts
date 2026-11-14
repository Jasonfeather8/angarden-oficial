import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { authService } from '@/services/authService';
import { enviarImagem } from '@/services/mediaService';
import type { Usuario } from '@/types';

export interface PerfilForm {
  nome: string;
  setNome: (valor: string) => void;
  whatsapp: string;
  setWhatsapp: (valor: string) => void;
  avatarUrl: string;
  setAvatarUrl: (valor: string) => void;
  senha: string;
  setSenha: (valor: string) => void;
  confirmacao: string;
  setConfirmacao: (valor: string) => void;
  /** Aviso de sucesso da última gravação. */
  message: string;
  /** Erro da última validação, do envio da foto ou da gravação. */
  error: string;
  isSaving: boolean;
  handlePhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

interface UsePerfilFormOptions {
  /** Conta da sessão; a tela só existe com sessão, mas o hook aceita a ausência. */
  user: Usuario | null;
  /** Aplica a conta atualizada na sessão depois de salvar. */
  applyUser: (user: Usuario) => void;
}

/**
 * Estado do formulário de perfil: os campos cadastrais, a troca de senha, o
 * envio da foto (com validação de tipo e tamanho) e a gravação pelo serviço.
 * Os campos voltam aos valores da conta sempre que a sessão é atualizada.
 */
export function usePerfilForm({ user, applyUser }: UsePerfilFormOptions): PerfilForm {
  const [nome, setNome] = useState(user?.nome_completo ?? '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setNome(user.nome_completo);
    setWhatsapp(user.whatsapp);
    setAvatarUrl(user.avatar_url || '');
  }, [user]);

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Escolha um arquivo de imagem válido.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('A foto deve ter no máximo 5 MB.');
      return;
    }

    try {
      const imageUrl = await enviarImagem(file, 'perfis', { maxWidth: 420, maxHeight: 420, quality: 0.8 });
      if (!imageUrl) {
        setError('Não foi possível carregar a foto.');
        return;
      }
      setError('');
      setMessage('Foto selecionada. Salve o perfil para confirmar.');
      setAvatarUrl(imageUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível carregar a foto.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (senha && senha !== confirmacao) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!nome.trim() || !whatsapp.trim()) {
      setError('Preencha seu nome completo e WhatsApp.');
      return;
    }

    if (!user) return;
    setIsSaving(true);
    const result = await authService.atualizarUsuario(user.id, {
      nome_completo: nome,
      whatsapp,
      avatar_url: avatarUrl,
      nova_senha: senha || undefined,
    });
    setIsSaving(false);

    if (result.error || !result.user) {
      setError(result.error || 'Não foi possível salvar seu perfil.');
      return;
    }

    applyUser(result.user);
    setSenha('');
    setConfirmacao('');
    setMessage('Perfil atualizado com sucesso.');
  };

  return {
    nome,
    setNome,
    whatsapp,
    setWhatsapp,
    avatarUrl,
    setAvatarUrl,
    senha,
    setSenha,
    confirmacao,
    setConfirmacao,
    message,
    error,
    isSaving,
    handlePhotoChange,
    handleSubmit,
  };
}
