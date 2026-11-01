import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { UserRole } from '../types';
import { ROUTES } from '../routes/paths';
import { useSessionStore } from '../store/useSessionStore';
import { LoadingState } from './ui/Skeleton';

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

/** Impede que usuários autenticados permaneçam na tela de acesso. */
export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const status = useSessionStore((state) => state.status);
  const location = useLocation();

  if (status === 'loading') return <SessionLoading />;

  if (status === 'authenticated') {
    const from = (location.state as { from?: string } | null)?.from;
    const destination = from && from !== ROUTES.login ? from : ROUTES.dashboard;
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
