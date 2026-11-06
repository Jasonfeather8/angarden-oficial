import React, { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { BrandMark } from '../components/BrandMark';
import { MedievalFrame } from '../components/MedievalFrame';
import { ROUTES } from '../routes/paths';
import { sessionService } from '../services/sessionService';
import { useSessionStore } from '../store/useSessionStore';

const inputBaseClassName =
  'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 py-2.5 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';

const inputClassName = `${inputBaseClassName} px-3`;

/** Campo de senha: mesmo acabamento, com espaço à direita para o botão de mostrar/ocultar. */
const passwordInputClassName = `${inputBaseClassName} pl-3 pr-11`;

export const LoginPage: React.FC = () => {
  const accountNotice = useSessionStore((state) => state.accountNotice);
  const refreshSession = useSessionStore((state) => state.refresh);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await sessionService.signIn(email.trim(), senha);
      if (result.error || !result.session) {
        setError(result.error || 'Não foi possível entrar. Tente novamente.');
        return;
      }
      // Em caso de sucesso o botão continua em "entrando": a guarda de acesso
      // aguarda o trecho e os dados da tela de entrada antes de navegar, e esta
      // tela é desmontada no redirecionamento.
      await refreshSession();
      return;
    } catch {
      setError('Não foi possível entrar. Tente novamente.');
    }
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] px-4 py-8 text-[#dcd1ba] selection:bg-[#5a4225] selection:text-[#f3ebd3]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <MedievalFrame className="w-full" noHeader contentClassName="pt-7 sm:pt-9">
          <div className="mx-auto w-full max-w-md space-y-5">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="flex items-center justify-center">
                <BrandMark variant="completa" altura={54} larguraMaxima={260} />
              </h1>
              <p className="font-cinzel text-[10px] uppercase tracking-[0.28em] text-[#8c6b41]">Acesso ao seu grimório</p>
            </div>
            <div>
              <h2 className="font-cinzel text-lg font-bold text-[#f0e2c0]">Entrar na conta</h2>
              <p className="mt-1 text-sm text-[#b9aa91]">
                Entre com o email e a senha aprovados pelo administrador.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClassName}
                  autoComplete="email"
                  placeholder="seu@email.com"
                  required
                  maxLength={160}
                />
              </div>

              <div>
                <label htmlFor="login-senha" className="mb-1.5 block text-sm font-semibold text-[#d8c9aa]">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="login-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    className={passwordInputClassName}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    required
                    minLength={6}
                    maxLength={128}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((current) => !current)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-sm text-[#a88d61] transition-colors hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4af37]"
                  >
                    {mostrarSenha ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error && (
                <p id="auth-error" role="alert" className="border border-red-900/80 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}
              {!error && accountNotice && (
                <p role="status" className="border border-amber-800/80 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
                  {accountNotice}
                </p>
              )}

              <GothicButton
                type="submit"
                width="100%"
                height={48}
                disabled={isSubmitting}
                aria-describedby={error ? 'auth-error' : undefined}
                className="w-full focus-visible:ring-2 focus-visible:ring-[#d4af37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#110d09]"
              >
                {isSubmitting ? 'Aguarde...' : 'Entrar'}
              </GothicButton>
            </form>

            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[#3a2c1d] pt-4 text-center">
              <Link
                to={ROUTES.cadastro}
                className="rounded-sm text-sm font-semibold text-[#d4af37] underline decoration-[#8c6b41] underline-offset-4 transition-colors hover:text-[#f3ebd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
              >
                Fazer Cadastro
              </Link>
              <Link
                to={ROUTES.recuperarSenha}
                className="rounded-sm text-sm font-semibold text-[#d4af37] underline decoration-[#8c6b41] underline-offset-4 transition-colors hover:text-[#f3ebd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
              >
                Esqueci minha senha
              </Link>
            </div>
          </div>
        </MedievalFrame>
      </div>
    </main>
  );
};

export default LoginPage;
