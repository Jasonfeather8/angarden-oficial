import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Coins, Crown, LayoutDashboard, LogOut, ScrollText, Shield, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { ROUTES } from '../routes/paths';
import { useSessionStore } from '../store/useSessionStore';

const ADMIN_NAV = [
  { to: ROUTES.admin.root, label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: ROUTES.admin.solicitacoes, label: 'Solicitações', icon: ScrollText, end: false },
  { to: ROUTES.admin.clientes, label: 'Clientes', icon: Users, end: false },
  { to: ROUTES.admin.campanhas, label: 'Campanhas', icon: Coins, end: false },
];

/**
 * Casca da área administrativa da plataforma.
 * Distinta do AppLayout: o administrador não navega pelas telas de jogo.
 */
export const AdminLayout: React.FC = () => {
  const user = useSessionStore((state) => state.session?.user ?? null);
  const signOut = useSessionStore((state) => state.signOut);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-[#dcd1ba] selection:bg-[#5a4225] selection:text-[#f3ebd3]">
      <header className="border-b border-[#3a2c1d] bg-[#120f0d]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8c6b41] bg-[#1a140e] text-[#d4af37]">
              <Crown className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-cinzel text-sm font-bold uppercase tracking-widest text-[#e6ddc5]">
                Angarden
              </p>
              <p className="font-serif text-[10px] uppercase tracking-wider text-[#8c6b41]">
                Administração da plataforma
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="Navegação administrativa" className="flex flex-wrap items-center gap-1">
              {ADMIN_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-1.5 rounded-xs border px-3 py-2 text-[10px] font-cinzel font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]',
                        isActive
                          ? 'border-[#8c6b41] bg-[#2a1d10] text-[#f3ebd3]'
                          : 'border-transparent text-[#a88d61] hover:border-[#5a4225] hover:text-[#e6ddc5]'
                      )
                    }
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            <span className="hidden max-w-[180px] truncate font-serif text-xs text-[#8c6b41] sm:inline">
              {user?.nome_completo ?? 'Administrador'}
            </span>

            <button
              type="button"
              onClick={() => navigate(ROUTES.dashboard)}
              className="flex items-center gap-1.5 rounded-xs border border-[#5a4225] px-3 py-2 text-[10px] font-cinzel uppercase tracking-wider text-[#a88d61] transition-colors hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              Ver app
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-xs border border-[#5a4225] px-3 py-2 text-[10px] font-cinzel uppercase tracking-wider text-[#a88d61] transition-colors hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
