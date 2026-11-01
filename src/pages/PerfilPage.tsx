import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Camera, Crown, KeyRound, LogOut, Mail, Save, UserCheck } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { MedievalFrame } from '../components/MedievalFrame';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { ROLE_LABELS } from '../auth/policies';
import { ROUTES } from '../routes/paths';
import { enviarImagem } from '../services/mediaService';

export const PerfilPage: React.FC = () => {
  const user = useSessionStore((state) => state.session?.user ?? null);
  const applyUser = useSessionStore((state) => state.applyUser);
  const signOut = useSessionStore((state) => state.signOut);
  const { role, isMestre } = useAuthorization();
  const navigate = useNavigate();

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

  const initials = (user?.nome_completo ?? '')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.login, { replace: true });
  };

  if (!user) return null;

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

  const inputClassName = 'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 px-3 py-2.5 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';

  return (
    <div id="page-perfil" className="w-full max-w-[860px] mx-auto space-y-6">
      <MedievalFrame
        title={
          <h2 className="flex items-center gap-2 text-xl font-bold font-cinzel tracking-wider text-[#e6ddc5] uppercase">
            <UserCheck className="w-5 h-5 text-[#a88d61]" />
            Meu Perfil & Configurações
          </h2>
        }
        subtitle="Gerenciamento de credenciais, dados cadastrais e preferências"
        headerRight={
          <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#8c6b41]/70 bg-[#2a1d10]/80 px-2.5 py-1 text-xs font-cinzel uppercase tracking-wider text-[#d4af37]">
            {isMestre ? <Crown className="h-3.5 w-3.5" aria-hidden="true" /> : <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />}
            {role ? ROLE_LABELS[role] : 'Visitante'}
          </span>
        }
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="flex flex-col items-center gap-3 border-b border-[#3a2c1d] pb-5 sm:flex-row sm:items-start">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#8c6b41] bg-[#1e1710] shadow-[0_0_12px_rgba(140,107,65,0.35)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`Avatar de ${nome || user.nome_completo}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-cinzel text-xl font-bold text-[#a88d61]">{initials}</div>
              )}
            </div>
            <div className="space-y-2 text-center sm:text-left">
              <p className="font-cinzel text-base font-bold text-[#f0e2c0]">Retrato do aventureiro</p>
              <p className="text-sm text-[#b9aa91]">Escolha uma imagem local para atualizar seu avatar.</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[#5a4225] bg-[#1a140e] px-3 py-2 text-sm text-[#d4af37] transition-colors hover:border-[#a88d61] hover:text-[#f3ebd3] focus-within:ring-2 focus-within:ring-[#d4af37]">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Escolher foto
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="perfil-nome" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Nome completo</label>
              <input id="perfil-nome" type="text" value={nome} onChange={(event) => setNome(event.target.value)} className={inputClassName} autoComplete="name" required maxLength={120} />
            </div>
            <div>
              <label htmlFor="perfil-whatsapp" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">WhatsApp</label>
              <input id="perfil-whatsapp" type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className={inputClassName} autoComplete="tel" required maxLength={30} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="perfil-email" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#d8c9aa]">
                <Mail className="h-3.5 w-3.5 text-[#a88d61]" aria-hidden="true" />
                Email
              </label>
              <input id="perfil-email" type="email" value={user.email} className={`${inputClassName} cursor-not-allowed opacity-70`} disabled readOnly />
              <p className="mt-1 text-xs text-[#8c6b41]">O email de acesso não pode ser alterado.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="perfil-avatar-url" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Endereço da foto (opcional)</label>
              <input id="perfil-avatar-url" type="url" value={avatarUrl.startsWith('data:image') ? '' : avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} className={inputClassName} placeholder="https://..." inputMode="url" />
            </div>
          </div>

          <div className="border-t border-[#3a2c1d] pt-5">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#a88d61]" aria-hidden="true" />
              <h3 className="font-cinzel text-base font-bold text-[#e6ddc5]">Alterar senha</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="perfil-senha" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Nova senha</label>
                <input id="perfil-senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} className={inputClassName} autoComplete="new-password" minLength={6} maxLength={128} placeholder="Deixe em branco para manter" />
              </div>
              <div>
                <label htmlFor="perfil-confirmacao" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Confirmar nova senha</label>
                <input id="perfil-confirmacao" type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} className={inputClassName} autoComplete="new-password" minLength={6} maxLength={128} />
              </div>
            </div>
          </div>

          {error && <p role="alert" className="border border-red-900/80 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="border border-emerald-900/80 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">{message}</p>}

          <div className="flex flex-col gap-3 border-t border-[#3a2c1d] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <GothicButton type="button" variant="danger" size="sm" width={170} icon={<LogOut className="h-4 w-4" aria-hidden="true" />} onClick={handleSignOut} className="focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]">
              Sair da conta
            </GothicButton>
            <GothicButton type="submit" size="sm" width={190} disabled={isSaving} icon={<Save className="h-4 w-4" aria-hidden="true" />} className="focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]">
              {isSaving ? 'Salvando...' : 'Salvar alterações'}
            </GothicButton>
          </div>
        </form>
      </MedievalFrame>
    </div>
  );
};

export default PerfilPage;
