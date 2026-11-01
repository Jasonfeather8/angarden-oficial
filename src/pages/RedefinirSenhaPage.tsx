import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { MedievalFrame } from '../components/MedievalFrame';
import { LoadingState } from '../components/ui/Skeleton';
import { supabase } from '../integrations/supabase/client';
import { ROUTES } from '../routes/paths';
import { useSessionStore } from '../store/useSessionStore';

const inputClassName = 'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 px-3 py-2.5 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';

export const RedefinirSenhaPage: React.FC = () => {
  const status = useSessionStore((state) => state.status);
  const endRecovery = useSessionStore((state) => state.endRecovery);
  const navigate = useNavigate();
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (senha !== confirmacao) return setError('As senhas não coincidem.');
    if (senha.length < 6 || senha.length > 128) return setError('A senha deve ter entre 6 e 128 caracteres.');

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: senha });
      if (updateError) {
        setError('Não foi possível atualizar sua senha. Solicite um novo link de recuperação.');
        return;
      }
      endRecovery();
      navigate(ROUTES.dashboard, { replace: true });
    } catch {
      setError('Não foi possível atualizar sua senha. Solicite um novo link de recuperação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md"><LoadingState variant="text" label="Validando o link…" /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] px-4 py-8 text-[#dcd1ba] selection:bg-[#5a4225] selection:text-[#f3ebd3]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <MedievalFrame
          className="w-full"
          title={<h1 className="flex items-center gap-2 text-xl font-bold tracking-wider text-[#e6ddc5]"><Shield className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />Angarden</h1>}
          subtitle="Restaurar acesso às crônicas"
        >
          {status !== 'anonymous' ? (
            <div className="mx-auto w-full max-w-md space-y-5">
              <div>
                <h2 className="font-cinzel text-lg font-bold text-[#f0e2c0]">Definir nova senha</h2>
                <p className="mt-1 text-sm text-[#b9aa91]">Escolha uma nova senha para sua conta.</p>
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="nova-senha" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Nova senha</label>
                  <input id="nova-senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} className={inputClassName} autoComplete="new-password" required minLength={6} maxLength={128} />
                </div>
                <div>
                  <label htmlFor="confirmar-senha" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Confirmar nova senha</label>
                  <input id="confirmar-senha" type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} className={inputClassName} autoComplete="new-password" required minLength={6} maxLength={128} />
                </div>
                {error && <p role="alert" className="border border-red-900/80 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}
                <GothicButton type="submit" width="100%" height={48} disabled={isSubmitting} className="w-full focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]">
                  {isSubmitting ? 'Atualizando…' : 'Definir nova senha'}
                </GothicButton>
              </form>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-md space-y-4 text-center">
              <p role="alert" className="border border-amber-800/80 bg-amber-950/40 px-3 py-3 text-sm text-amber-200">Este link de recuperação é inválido ou expirou.</p>
              <div className="flex justify-center gap-5 text-sm">
                <Link to={ROUTES.recuperarSenha} className="font-semibold text-[#d4af37] underline decoration-[#8c6b41] underline-offset-4 hover:text-[#f3ebd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">Solicitar novo link</Link>
                <Link to={ROUTES.login} className="font-semibold text-[#d4af37] underline decoration-[#8c6b41] underline-offset-4 hover:text-[#f3ebd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">Voltar ao login</Link>
              </div>
            </div>
          )}
        </MedievalFrame>
      </div>
    </main>
  );
};

export default RedefinirSenhaPage;
