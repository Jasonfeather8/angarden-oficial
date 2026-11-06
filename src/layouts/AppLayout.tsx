import React, { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { LoadingState } from '../components/ui/Skeleton';
import { scheduleSiblingRoutePreload } from '../routes/lazyPages';
import { useAppStore } from '../store/useAppStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { prewarmAcervoDoCliente, prewarmTelasSecundarias } from '../services/prewarmService';
import { agendarEmOciosidade } from '../utils/idleCallback';

/**
 * Casca da aplicação: Topbar + Sidebar fixas e as páginas filhas
 * renderizadas via <Outlet/> do react-router-dom.
 */
export const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const session = useSessionStore((state) => state.session);
  const { tenantId } = useAuthorization();
  const setMobileOpen = useAppStore((state) => state.setMobileOpen);
  const mainRef = useRef<HTMLElement>(null);
  const prewarmedSessionRef = useRef<string | null>(null);

  // Fecha a gaveta mobile e reposiciona a rolagem ao trocar de rota.
  useEffect(() => {
    setMobileOpen(false);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname, setMobileOpen]);

  useEffect(() => scheduleSiblingRoutePreload(pathname), [pathname]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !tenantId) {
      prewarmedSessionRef.current = null;
      return;
    }

    const sessionKey = `${userId}:${tenantId}`;
    if (prewarmedSessionRef.current !== sessionKey) {
      prewarmedSessionRef.current = sessionKey;
      void prewarmAcervoDoCliente(tenantId);
    }

    return agendarEmOciosidade(() => {
      void prewarmTelasSecundarias(tenantId, userId);
    });
  }, [session?.user.id, tenantId]);

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] text-[#dcd1ba] flex flex-col overflow-hidden selection:bg-[#5a4225] selection:text-[#f3ebd3]">
      {/* Barra de Topo Global */}
      <Topbar />

      {/* Estrutura Principal: Sidebar + Área de Conteúdo */}
      <div className="flex-1 flex flex-row overflow-hidden relative min-h-0">
        <Sidebar />

        <main
          ref={mainRef}
          id="main-content-area"
          className="flex-1 h-full p-3 sm:p-5 lg:p-7 flex items-start justify-center overflow-y-auto custom-scrollbar min-w-0"
        >
          <Suspense fallback={<div className="mx-auto w-full max-w-xl px-4 py-10"><LoadingState label="Preparando esta página…" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
