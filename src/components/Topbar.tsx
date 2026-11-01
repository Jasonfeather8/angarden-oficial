import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Menu, Shield, Sparkles, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { useAsyncData } from '../hooks/useAsyncData';
import { campaignService } from '../services/campaignService';
import { ROLE_LABELS } from '../auth/policies';
import { ROUTES } from '../routes/paths';

export const Topbar: React.FC = () => {
  const toggleMobileOpen = useAppStore((state) => state.toggleMobileOpen);
  const activeCampaignId = useAppStore((state) => state.activeCampaignId);
  const setActiveCampaignId = useAppStore((state) => state.setActiveCampaignId);
  const session = useSessionStore((state) => state.session);
  const { role, isAdmin, isMestre } = useAuthorization();
  const navigate = useNavigate();

  // Campanhas reais acessíveis ao usuário (do seu cliente ou por convite).
  const { data } = useAsyncData(
    () => campaignService.listAccessible(),
    [session?.user.id],
    { enabled: Boolean(session), cacheKey: `campanhas-acessiveis:${session?.user.id ?? ''}` }
  );
  const campaigns = data?.campaigns ?? [];
  const activeCampaign = campaigns.find((campaign) => campaign.id === activeCampaignId) ?? null;

  useEffect(() => {
    if (!activeCampaign && campaigns.length > 0) {
      setActiveCampaignId(campaigns[0].id);
    }
  }, [activeCampaign, campaigns, setActiveCampaignId]);

  const user = session?.user ?? null;
  const initials = (user?.nome_completo ?? '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      id="angarden-topbar"
      className="w-full h-14 shrink-0 bg-[#120f0d]/95 border-b border-[#3a2c1d] px-4 sm:px-6 flex items-center justify-between z-30 relative backdrop-blur-md text-[#dcd1ba]"
    >
      {/* Esquerda: Logo + Botão Mobile */}
      <div className="flex items-center space-x-3">
        <button
          id="btn-mobile-sidebar-toggle"
          onClick={toggleMobileOpen}
          className="md:hidden p-2 border border-[#5a4225] bg-[#1a140e] text-[#a88d61] hover:text-[#e6ddc5] transition-colors rounded-xs"
          title="Alternar Menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full border border-[#8c6b41] bg-[#1a140e] flex items-center justify-center shadow-[0_0_8px_rgba(140,107,65,0.4)]">
            <Shield className="w-4 h-4 text-[#a88d61]" />
          </div>
          <div>
            <span className="font-bold tracking-widest text-[#e6ddc5] uppercase font-cinzel text-sm sm:text-base">
              Angarden
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] text-[#8c6b41] uppercase tracking-wider font-serif">
              RPG System
            </span>
          </div>
        </div>
      </div>

      {/* Centro: Campanha Ativa */}
      <div className="hidden lg:flex items-center space-x-2 px-3 py-1 border border-[#3a2c1d] bg-black/40 rounded-sm">
        <Sparkles className="w-3.5 h-3.5 text-[#a88d61]" aria-hidden="true" />
        {campaigns.length > 1 ? (
          <>
            <label htmlFor="topbar-active-campaign" className="sr-only">
              Selecionar campanha ativa
            </label>
            <select
              id="topbar-active-campaign"
              value={activeCampaignId ?? ''}
              onChange={(event) => setActiveCampaignId(event.target.value)}
              className="max-w-[220px] bg-transparent text-xs font-serif italic text-[#c4b9a3] outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
            >
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id} className="bg-[#120f0d] not-italic">
                  {campaign.nome}
                </option>
              ))}
            </select>
          </>
        ) : (
          <span className="text-xs font-serif text-[#c4b9a3] italic">
            {activeCampaign ? activeCampaign.nome : 'Nenhuma campanha'}
          </span>
        )}
      </div>

      {/* Direita: Perfil + Papel na plataforma */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <button
          id="btn-topbar-current-user"
          type="button"
          onClick={() => navigate(ROUTES.perfil)}
          className="flex items-center gap-2 rounded-sm border border-transparent px-1.5 py-1 text-left transition-colors hover:border-[#5a4225] hover:bg-[#1a140e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
          title="Abrir meu perfil"
        >
          <span className="h-7 w-7 overflow-hidden rounded-full border border-[#8c6b41] bg-[#1e1710]">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={`Avatar de ${user.nome_completo}`} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-cinzel text-[10px] font-bold text-[#a88d61]">
                {initials}
              </span>
            )}
          </span>
          <span className="hidden max-w-[110px] truncate text-xs font-cinzel text-[#e6ddc5] xl:inline">
            {user?.nome_completo ?? ''}
          </span>
        </button>

        {/* Papel real na plataforma (definido pelo administrador, não alternável) */}
        <span
          className="hidden items-center gap-1.5 rounded-xs border border-[#5a4225] bg-[#120f0d] px-2.5 py-1 text-[10px] font-cinzel uppercase tracking-wider text-[#a88d61] sm:flex"
          title="Seu papel na plataforma"
        >
          {isMestre ? (
            <Crown size={13} aria-hidden="true" />
          ) : isAdmin ? (
            <Shield size={13} aria-hidden="true" />
          ) : (
            <User size={13} aria-hidden="true" />
          )}
          {role ? ROLE_LABELS[role] : '—'}
        </span>
      </div>
    </header>
  );
};

export default Topbar;
