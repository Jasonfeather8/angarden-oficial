import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  BookOpen,
  Scroll,
  ScrollText,
  Crown,
  UserCheck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { ROLE_LABELS } from '../auth/policies';
import { preloadRoute } from '../routes/lazyPages';
import { ROUTES, isFichaRoute } from '../routes/paths';

interface MenuItem {
  id: string;
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  /** Visível apenas para Mestre e Administrador. */
  masterOnly?: boolean;
  /** Visível apenas para o Administrador da plataforma. */
  adminOnly?: boolean;
  /** Exige um cliente (tenant) associado — oculto para o administrador da plataforma. */
  tenantOnly?: boolean;
}

export const Sidebar: React.FC = () => {
  const { isCollapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useAppStore();
  const user = useSessionStore((state) => state.session?.user ?? null);
  const { role, isAdmin, isMestre, tenantId } = useAuthorization();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', to: ROUTES.dashboard, label: 'Início / Dashboard', icon: LayoutDashboard },
    { id: 'personagens', to: ROUTES.personagens, label: 'Personagens', icon: Users, tenantOnly: true },
    { id: 'mercado', to: ROUTES.mercado, label: 'Mercado Global', icon: ShoppingBag },
    { id: 'grimorio', to: ROUTES.grimorio, label: 'Grimório', icon: BookOpen },
    { id: 'biblioteca', to: ROUTES.biblioteca, label: 'Biblioteca', icon: Scroll },
    { id: 'cronicas', to: ROUTES.cronicas, label: 'Crônicas', icon: ScrollText, tenantOnly: true },
    { id: 'painel-mestre', to: ROUTES.painelMestre, label: 'Painel do Mestre', icon: Crown, masterOnly: true, badge: 'Mestre' },
    { id: 'admin', to: ROUTES.admin.root, label: 'Administração', icon: Shield, adminOnly: true, badge: 'Admin' },
    { id: 'perfil', to: ROUTES.perfil, label: 'Meu Perfil', icon: UserCheck },
  ];

  const roleLabel = role ? ROLE_LABELS[role] : 'Visitante';
  const initials = (user?.nome_completo ?? '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const currentPath = pathname === '/' ? ROUTES.dashboard : pathname;

  const isItemActive = (item: MenuItem): boolean =>
    item.to === currentPath || (item.id === 'personagens' && isFichaRoute(pathname));

  return (
    <>
      {/* Overlay Mobile */}
      {mobileOpen && (
        <div 
          id="sidebar-mobile-overlay"
          className="fixed inset-0 bg-black/85 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside 
        id="sidebar-container"
        className={`
          transition-all duration-300 select-none shrink-0 flex flex-col
          /* Mobile: gaveta fixa lateral */
          fixed inset-y-0 left-0 z-50 h-full w-[280px] p-3
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          /* Desktop: dentro do layout flex abaixo da topbar */
          md:relative md:translate-x-0 md:inset-auto md:z-20 md:h-full
          ${isCollapsed ? 'md:w-[78px] md:p-2.5' : 'md:w-[290px] md:p-3.5'}
        `}
      >
        {/* Moldura Texturizada Medieval */}
        <div 
          id="sidebar-frame"
          className={`
            relative w-full h-full flex-1 shadow-[0_0_25px_rgba(0,0,0,0.9)] flex flex-col transition-all duration-300
            ${isCollapsed ? 'p-[6px]' : 'p-[8px] sm:p-[10px]'}
          `}
          style={{
            backgroundImage: `url('https://i.postimg.cc/ydLhG37r/Create-matching-texture-background-202608261823.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Camada interna para escurecer a textura e criar a moldura */}
          <div className="border border-[#5a4225] h-full relative bg-black/75 flex flex-col p-[2px] justify-between text-[#dcd1ba] overflow-hidden">
            
            {/* Bordas duplas internas laterais e inferiores */}
            <div className="absolute inset-0 border-[2px] sm:border-[3px] border-transparent border-l-[#3a2c1d] border-r-[#3a2c1d] border-b-[#3a2c1d] pointer-events-none m-[1px]"></div>

            {/* CABEÇALHO DO SIDEBAR */}
            <div className={`
              border-b border-[#3a2c1d] relative z-10 bg-black/60 shrink-0
              ${isCollapsed ? 'py-3 px-1 flex flex-col items-center justify-center gap-2' : 'py-3 px-3 sm:px-4 flex items-center justify-between'}
            `}>
              {/* Decoração superior esquerda */}
              <div className="absolute top-0 left-[-2px] w-0 h-0 border-t-[7px] border-t-[#3a2c1d] border-r-[7px] border-r-transparent"></div>
              
              {/* Detalhe vertical esquerdo */}
              <div className="absolute left-[-2px] top-1/2 w-[3px] h-[65%] bg-[#8c6b41] transform -translate-y-1/2"></div>
              
              {/* Modo Expandido / Mobile */}
              {(!isCollapsed || mobileOpen) ? (
                <>
                  <div className="flex items-center space-x-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded-full border border-[#8c6b41] bg-[#1a140e] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(140,107,65,0.3)]">
                      <Shield size={16} className="text-[#a88d61]" />
                    </div>
                    <div className="truncate">
                      <h1 className="text-[16px] tracking-widest text-[#e6ddc5] uppercase font-bold font-cinzel truncate leading-tight" style={{ textShadow: '1px 1px 3px black' }}>
                        Angarden
                      </h1>
                      <div className="text-[10px] tracking-widest text-[#8c6b41] uppercase font-serif">
                        RPG System
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Botão de Recolher (Desktop) */}
                    <button 
                      id="btn-toggle-sidebar"
                      onClick={toggleCollapsed}
                      className="hidden md:flex p-1.5 text-[#a88d61] hover:text-[#e6ddc5] hover:bg-[#3a2c1d]/50 transition-colors border border-transparent hover:border-[#5a4225] rounded-xs"
                      title="Recolher Menu"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {/* Botão de Fechar (Mobile) */}
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="md:hidden p-1.5 text-[#a88d61] hover:text-[#e6ddc5] hover:bg-[#3a2c1d]/50 transition-colors border border-[#5a4225] rounded-xs"
                      title="Fechar Menu"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </>
              ) : (
                /* Modo Recolhido (Apenas Ícone/Botão de Expandir Centralizado) */
                <div className="w-full flex flex-col items-center justify-center">
                  <button 
                    id="btn-expand-sidebar"
                    onClick={toggleCollapsed}
                    className="w-10 h-10 rounded-sm border border-[#5a4225] bg-[#1a140e]/90 hover:bg-[#2a1d10] text-[#a88d61] hover:text-[#f3ebd3] flex items-center justify-center transition-all shadow-[0_0_8px_rgba(0,0,0,0.8)] group relative"
                    title="Expandir Menu"
                  >
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              )}

              {/* Decoração superior direita */}
              <div className="absolute top-0 right-[-2px] w-0 h-0 border-t-[7px] border-t-[#3a2c1d] border-l-[7px] border-l-transparent"></div>
            </div>

            {/* Sub-título decorativo (Expandido) */}
            {(!isCollapsed || mobileOpen) && (
              <div className="px-3 py-1.5 text-[10px] tracking-widest text-[#a88d61] uppercase border-b border-[#3a2c1d]/50 bg-black/40 z-10 flex items-center justify-between font-cinzel shrink-0">
                <span className="truncate">Grimório & Regras</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#8c6b41] animate-pulse shrink-0"></span>
              </div>
            )}

            {/* LISTA DE NAVEGAÇÃO DOS MENUS */}
            <div className={`
              flex-1 z-10 bg-black/35 overflow-y-auto custom-scrollbar relative
              ${isCollapsed ? 'px-1.5 py-3 space-y-2' : 'px-2.5 py-3 space-y-1'}
            `}>
              {/* Decoração lateral esquerda sutil */}
              <div className="absolute top-5 left-[-2px] w-[4px] h-[20px] bg-[#3a2c1d] rounded-r-md"></div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item);
                  
                  if (item.masterOnly && !isMestre) {
                    return null;
                  }
                  if (item.adminOnly && !isAdmin) {
                    return null;
                  }
                  // O administrador da plataforma não possui acervo próprio.
                  if (item.tenantOnly && !tenantId) {
                    return null;
                  }

                  return (
                    <button
                      key={item.id}
                      id={`menu-item-${item.id}`}
                      onMouseEnter={() => void preloadRoute(item.to)}
                      onFocus={() => void preloadRoute(item.to)}
                      onClick={() => {
                        navigate(item.to);
                        setMobileOpen(false);
                      }}
                      className={`
                        w-full flex items-center transition-all duration-200 relative group rounded-xs
                        ${isCollapsed 
                          ? 'h-10 justify-center' 
                          : 'h-10 justify-start space-x-3 px-3'
                        }
                        ${isActive 
                          ? 'bg-gradient-to-r from-[#5a4225]/70 to-[#2a1d10]/50 text-[#f3ebd3] border-l-2 border-[#a88d61] shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]' 
                          : 'text-[#c4b9a3] hover:text-[#e6ddc5] hover:bg-black/50 border-l-2 border-transparent hover:border-[#5a4225]'
                        }
                      `}
                    >
                      {/* Efeito Glow para Item Ativo */}
                      {isActive && !isCollapsed && (
                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-[#a88d61] shadow-[0_0_8px_#a88d61]"></div>
                      )}

                      <Icon 
                        size={18} 
                        className={`
                          transition-colors shrink-0
                          ${isActive ? 'text-[#e6ddc5] drop-shadow-[0_0_4px_rgba(168,141,97,0.8)]' : 'text-[#8c6b41] group-hover:text-[#a88d61]'}
                        `} 
                      />

                      {/* Texto no modo Expandido */}
                      {(!isCollapsed || mobileOpen) && (
                        <div className="flex-1 flex items-center justify-between overflow-hidden">
                          <span className="font-serif tracking-wide text-[13.5px] truncate drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-xs border border-[#8c6b41]/60 bg-[#2a1d10]/80 text-[#d4af37] font-cinzel uppercase tracking-wider">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tooltip Medieval Flutuante (quando recolhido) */}
                      {isCollapsed && (
                        <div className="absolute left-[calc(100%+8px)] px-3 py-1.5 bg-[#120f0d] text-[#e6ddc5] text-xs font-serif whitespace-nowrap border border-[#5a4225] shadow-[0_4px_16px_rgba(0,0,0,0.9)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-2 rounded-xs">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <span className="text-[9px] text-[#d4af37] font-cinzel uppercase px-1 py-0.2 bg-[#2a1d10] border border-[#8c6b41]/40 rounded-xs">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* RODAPÉ COM PERFIL SIMULADO */}
            <div className={`
              border-t border-[#3a2c1d] relative z-10 bg-black/65 shrink-0
              ${isCollapsed ? 'p-2 flex justify-center' : 'p-2.5 sm:p-3'}
            `}>
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-2.5'}`}>
                <div className="relative group cursor-pointer" title={user?.nome_completo ?? ''}>
                  <div className="w-8 h-8 rounded-full bg-[#1e1710] border border-[#8c6b41] overflow-hidden flex items-center justify-center shadow-[0_0_6px_rgba(140,107,65,0.4)]">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={`Avatar de ${user.nome_completo}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-bold font-cinzel text-[#a88d61] text-xs">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-600 border border-[#0a0a0a]"></div>

                  {/* Tooltip do Usuário no modo recolhido */}
                  {isCollapsed && (
                    <div className="absolute left-[calc(100%+10px)] bottom-0 px-3 py-1.5 bg-[#120f0d] text-[#e6ddc5] text-xs font-serif whitespace-nowrap border border-[#5a4225] shadow-[0_4px_16px_rgba(0,0,0,0.9)] opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 rounded-xs">
                      <p className="font-bold font-cinzel text-[11px] text-[#e6ddc5]">{user?.nome_completo ?? ''}</p>
                      <p className="text-[10px] text-[#8c6b41]">{roleLabel}</p>
                    </div>
                  )}
                </div>

                {(!isCollapsed || mobileOpen) && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#e6ddc5] truncate font-cinzel leading-tight">{user?.nome_completo ?? ''}</p>
                    <p className="text-[10px] text-[#8c6b41] truncate font-serif">
                      {roleLabel}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Decoração dos cantos */}
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-[2px] border-l-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-[2px] border-r-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t-[2px] border-r-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t-[2px] border-l-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>

          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
