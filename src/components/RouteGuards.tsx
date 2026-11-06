import React, { Suspense } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { UserRole } from '../types';
import { ROUTES } from '../routes/paths';
import { useSessionStore } from '../store/useSessionStore';
import { MedievalFrame } from './MedievalFrame';
import { LoadingState, Skeleton } from './ui/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Restringe a rota aos papéis informados. Sem valor, qualquer usuário autenticado entra. */
  roles?: UserRole[];
}

function SessionLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        <LoadingState variant="text" label="Verificando sua sessão…" />
      </div>
    </div>
  );
}

/**
 * Silhueta da tela de acesso: moldura e marca reais (conteúdo estático) com o
 * formulário em esqueleto. A tela nasce no formato final — sem texto de
 * carregamento e sem salto de layout — enquanto a sessão é verificada e o
 * trecho da rota é baixado.
 */
const AuthScreenSkeleton: React.FC = () => (
  <main className="min-h-screen w-full bg-[#0a0a0a] px-4 py-8 text-[#dcd1ba]">
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center justify-center">
      <MedievalFrame
        className="w-full"
        title={
          <>
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-wider text-[#e6ddc5]">
              <Shield className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
              Angarden
            </h1>
            <Skeleton className="mt-1 h-3 w-40" />
          </>
        }
        headerRight={<Skeleton className="h-5 w-5" />}
      >
        <div role="status" aria-live="polite" className="mx-auto w-full max-w-md space-y-5">
          <span className="sr-only">Carregando a tela de acesso…</span>
          <div aria-hidden="true" className="space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-11 w-full" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-full" />
              </div>
            </div>
            <Skeleton className="h-12 w-full" />
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[#3a2c1d] pt-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </MedievalFrame>
    </div>
  </main>
);

/**
 * Ponto único de verificação de sessão.
 * Ao migrar para o Supabase Auth, troque `useSessionStore` por `supabase.auth.getSession()`
 * aqui — as páginas e os layouts não precisam mudar.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const status = useSessionStore((state) => state.status);
  const role = useSessionStore((state) => state.session?.user.role ?? null);
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;

  if (status === 'recovery') {
    return <Navigate to={ROUTES.redefinirSenha} replace />;
  }

  if (status === 'anonymous') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }

  if (roles && (!role || !roles.includes(role))) {
    return <Navigate to={ROUTES.acessoNegado} replace />;
  }

  return <>{children}</>;
};

/** Área administrativa da plataforma. */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute roles={['admin']}>{children}</ProtectedRoute>
);

/**
 * Impede que usuários autenticados permaneçam na tela de acesso.
 * Enquanto a sessão é verificada e o trecho da rota chega, mostra a silhueta da
 * própria tela de acesso no lugar de um carregamento genérico.
 */
export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const status = useSessionStore((state) => state.status);
  const location = useLocation();

  if (status === 'loading') return <AuthScreenSkeleton />;

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    const destination = from && from !== ROUTES.login ? from : ROUTES.dashboard;
    return <Navigate to={destination} replace />;
  }

  return <Suspense fallback={<AuthScreenSkeleton />}>{children}</Suspense>;
};

export default ProtectedRoute;
