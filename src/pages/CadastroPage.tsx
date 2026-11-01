import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { MedievalFrame } from '../components/MedievalFrame';
import { supabase } from '../integrations/supabase/client';
import { ROUTES } from '../routes/paths';

const inputClassName = 'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 px-3 py-2.5 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';

export const CadastroPage: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim();
    const normalizedName = nome.trim();
    const normalizedWhatsapp = whatsapp.trim();
    if (senha !== confirmacao) return setError('As senhas não coincidem.');
    if (normalizedName.length < 2 || normalizedName.length > 120) {
      return setError('Informe um nome completo válido.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 160) {
      return setError('Informe um email válido.');
    }
    if (normalizedWhatsapp.length < 8 || normalizedWhatsapp.length > 30) {
      return setError('Informe um WhatsApp válido.');
    }
    if (senha.length < 6 || senha.length > 128) {
      return setError('A senha deve ter entre 6 e 128 caracteres.');
    }

    setIsSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: senha,
        options: {
          data: { nome_completo: normalizedName, whatsapp: normalizedWhatsapp },
          emailRedirectTo: new URL(ROUTES.authCallback, window.location.origin).href,
        },
      });

      if (signUpError) {
        const message = signUpError.message.toLowerCase();
        setError(
          message.includes('already registered') || message.includes('already been registered')
            ? 'Este email já possui uma conta.'
            : 'Não foi possível registrar sua solicitação. Verifique os dados e tente novamente.'
        );
        return;
      }

      setSuccess(
        data.session
          ? 'Cadastro registrado! Aguarde a aprovação do administrador.'
          : 'Cadastro registrado! Confirme o link enviado para o seu email e aguarde a aprovação do administrador.'
      );
      setNome('');
      setEmail('');
      setWhatsapp('');
      setSenha('');
      setConfirmacao('');
    } catch {
      setError('Não foi possível registrar sua solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] px-4 py-8 text-[#dcd1ba] selection:bg-[#5a4225] selection:text-[#f3ebd3]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <MedievalFrame
          className="w-full"
          title={
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-wider text-[#e6ddc5]">
              <Shield className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
              Angarden
            </h1>
          }
          subtitle="Novo registro nas crônicas"
        >
          <div className="mx-auto w-full max-w-md space-y-5">
            <div>
              <h2 className="font-cinzel text-lg font-bold text-[#f0e2c0]">Criar cadastro</h2>
              <p className="mt-1 text-sm text-[#b9aa91]">
                Registre seus dados para solicitar uma conta. O acesso é liberado após a aprovação do administrador.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="cadastro-nome" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Nome completo</label>
                <input id="cadastro-nome" type="text" value={nome} onChange={(event) => setNome(event.target.value)} className={inputClassName} autoComplete="name" required minLength={2} maxLength={120} />
              </div>
              <div>
                <label htmlFor="cadastro-email" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Email</label>
                <input id="cadastro-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClassName} autoComplete="email" required maxLength={160} />
              </div>
              <div>
                <label htmlFor="cadastro-whatsapp" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">WhatsApp</label>
                <input id="cadastro-whatsapp" type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} className={inputClassName} autoComplete="tel" required minLength={8} maxLength={30} />
              </div>
              <div>
                <label htmlFor="cadastro-senha" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Senha</label>
                <input id="cadastro-senha" type="password" value={senha} onChange={(event) => setSenha(event.target.value)} className={inputClassName} autoComplete="new-password" required minLength={6} maxLength={128} />
              </div>
              <div>
                <label htmlFor="cadastro-confirmacao" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">Confirmar senha</label>
                <input id="cadastro-confirmacao" type="password" value={confirmacao} onChange={(event) => setConfirmacao(event.target.value)} className={inputClassName} autoComplete="new-password" required minLength={6} maxLength={128} />
              </div>

              {error && <p role="alert" className="border border-red-900/80 bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>}
              {success && <p role="status" className="border border-emerald-900/80 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">{success}</p>}

              <GothicButton type="submit" width="100%" height={48} disabled={isSubmitting} className="w-full focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]">
                {isSubmitting ? 'Aguarde...' : 'Criar minha conta'}
              </GothicButton>
            </form>

            <p className="border-t border-[#3a2c1d] pt-4 text-center text-sm text-[#b9aa91]">
              Já possui uma conta aprovada?{' '}
              <Link to={ROUTES.login} className="rounded-sm font-semibold text-[#d4af37] underline decoration-[#8c6b41] underline-offset-4 hover:text-[#f3ebd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">
                Voltar para o Login
              </Link>
            </p>
          </div>
        </MedievalFrame>
      </div>
    </main>
  );
};

export default CadastroPage;
