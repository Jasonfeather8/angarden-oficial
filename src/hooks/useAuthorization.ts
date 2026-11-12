import { useMemo } from 'react';
import { Campaign, CampaignMember, UserRole, type FichaCompleta } from '../types';
import { FichaAccessOptions, policies } from '../auth/policies';
import { useSessionStore } from '../store/useSessionStore';

export interface Authorization {
  role: UserRole | null;
  isAdmin: boolean;
  isMestre: boolean;
  isJogador: boolean;
  tenantId: string | null;
  userId: string | null;
  can: {
    accessAdminPanel: boolean;
    manageCatalog: boolean;
    manageSpellVisibility: boolean;
    accessEpicMarket: (ficha?: FichaCompleta | null) => boolean;
    accessArcanoMarket: (ficha?: FichaCompleta | null) => boolean;
    accessLegendaryMarket: (ficha?: FichaCompleta | null) => boolean;
    buyInMarket: (ficha?: FichaCompleta | null) => boolean;
    createCampaign: boolean;
    viewFicha: (ficha: FichaCompleta, options?: FichaAccessOptions) => boolean;
    editFicha: (ficha: FichaCompleta) => boolean;
    viewCampaign: (campaign: Campaign, members?: CampaignMember[]) => boolean;
    manageCampaign: (campaign: Campaign) => boolean;
  };
}

/** Expõe as decisões de autorização do usuário autenticado. */
export function useAuthorization(): Authorization {
  const session = useSessionStore((state) => state.session);

  return useMemo(
    () => ({
      role: session?.user.role ?? null,
      isAdmin: policies.isAdmin(session),
      isMestre: policies.isMestre(session),
      isJogador: policies.isJogador(session),
      tenantId: session?.user.tenant_id ?? null,
      userId: session?.user.id ?? null,
      can: {
        accessAdminPanel: policies.canAccessAdminPanel(session),
        manageCatalog: policies.canManageCatalog(session),
        manageSpellVisibility: policies.canManageSpellVisibility(session),
        accessEpicMarket: (ficha) => policies.canAccessEpicMarket(session, ficha),
        accessArcanoMarket: (ficha) => policies.canAccessArcanoMarket(session, ficha),
        accessLegendaryMarket: (ficha) => policies.canAccessLegendaryMarket(session, ficha),
        buyInMarket: (ficha) => policies.canBuyInMarket(session, ficha),
        createCampaign: policies.canCreateCampaign(session),
        viewFicha: (ficha, options) => policies.canViewFicha(session, ficha, options),
        editFicha: (ficha) => policies.canEditFicha(session, ficha),
        viewCampaign: (campaign, members) => policies.canViewCampaign(session, campaign, members),
        manageCampaign: (campaign) => policies.canManageCampaign(session, campaign),
      },
    }),
    [session]
  );
}

export default useAuthorization;
