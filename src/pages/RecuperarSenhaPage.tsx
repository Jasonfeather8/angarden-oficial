import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { MedievalFrame } from '../components/MedievalFrame';
import { supabase } from '../integrations/supabase/client';
import { ROUTES } from '../routes/paths';

const inputClassName = 'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 px-3 py-2.5 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';
const recoveryMessage = 'Se este email estiver cadastrado, enviaremos as instruções de recuperação.';

export const RecuperarSenhaPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: new URL(ROUTES.redefinirSenha, window.location.origin).href,
      });
    } catch {
      // Keep the response neutral whether the address exists or the request fails.
    } finally {
      setMessage(recoveryMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] px-4 py-8 text-[#dcd1ba] selection:bg-[#5a4225] selection:text-[#f3ebd3]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <MedievalFrame
          className="w-full"
          title={<h1 className="flex items-center gap-2 text-xl font-bold tracking-wider text-[#e6ddc5]"><Shield className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />Angarden</h1>}
          subtitle="Recuperar acesso às crônicas"
        >
          <div className="mx-auto w-full max-w-md space-y-5">
            <div>
              <h2 className="font-cinzel text-lg font-bold text-[#f0e2c0]">Esqueci minha senha</h2>
              <p className="mt-1 text-sm text-[#b9aa91]">Informe o email associado à sua conta para receber as instruções.</p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="recuperar-email" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Email</label>
                <input id="recuperar-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} autoComplete="email" required maxLength={160} />
              </div>
              {message && <p role="status" className="border border-emerald-900/80 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">{message}</p>}
              <GothicButton type="submit" width="100%" height={48} disabled={isSubmitting} className="w-full focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]">
                {isSubmitting ? 'Enviando…' : 'Enviar instruções'}
              </GothicButton>
            </form>
            <p className="border-t border-[#3a2c1d] pt-4 text-center text-sm">
              <Link to={ROUTES.login} className="rounded-sm font-semibold text-[#d4af37] underline decoration-[#8c6b41] underline-offset-4 hover:text-[#f3ebd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">Voltar para o Login</Link>
            </p>
          </div>
        </MedievalFrame>
      </div>
    </main>
  );
};

export default RecuperarSenhaPage;
