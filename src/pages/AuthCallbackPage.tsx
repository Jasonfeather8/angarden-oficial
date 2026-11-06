import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { MedievalFrame } from '../components/MedievalFrame';
import { LoadingState } from '../components/ui/Skeleton';
import { ROUTES } from '../routes/paths';
import { useSessionStore } from '../store/useSessionStore';

export const AuthCallbackPage: React.FC = () => {
  const status = useSessionStore((state) => state.status);
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const params = new URLSearchParams(location.search);
  const hasAuthError = params.has('error') || params.has('error_description');

  useEffect(() => {
    const timeout = window.setTimeout(() => setTimedOut(true), 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  if (status === 'authenticated') return <Navigate to={ROUTES.dashboard} replace />;

  if (!hasAuthError && !timedOut) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="w-full max-w-md"><LoadingState variant="text" label="Confirmando seu acesso…" /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[#0a0a0a] px-4 py-8 text-[#dcd1ba]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
        <MedievalFrame className="w-full" noHeader contentClassName="pt-7 sm:pt-9">
          <div className="mx-auto w-full max-w-md space-y-4 text-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="flex items-center justify-center">
                <BrandMark variant="completa" altura={54} larguraMaxima={260} />
              </h1>
              <p className="font-cinzel text-[10px] uppercase tracking-[0.28em] text-[#8c6b41]">Confirmação de acesso</p>
            </div>
            <p role="alert" className="border border-amber-800/80 bg-amber-950/40 px-3 py-3 text-sm text-amber-200">
              Não foi possível confirmar seu acesso. O link pode ter expirado ou ser inválido.
            </p>
            <Link to={ROUTES.login} className="inline-block rounded-sm font-semibold text-[#d4af37] underline decoration-[#8c6b41] underline-offset-4 hover:text-[#f3ebd3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]">
              Voltar para o Login
            </Link>
          </div>
        </MedievalFrame>
      </div>
    </main>
  );
};

export default AuthCallbackPage;
