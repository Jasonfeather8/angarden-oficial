import { useMemo } from 'react';
import { UserRole, type FichaCompleta } from '../types';
import { policies } from '../auth/policies';
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
    manageLibrary: boolean;
    accessEpicMarket: (ficha?: FichaCompleta | null) => boolean;
    accessArcanoMarket: (ficha?: FichaCompleta | null) => boolean;
    accessLegendaryMarket: (ficha?: FichaCompleta | null) => boolean;
    buyInMarket: (ficha?: FichaCompleta | null) => boolean;
    viewFicha: (ficha: FichaCompleta) => boolean;
    editFicha: (ficha: FichaCompleta) => boolean;
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
        manageLibrary: policies.canManageLibrary(session),
        accessEpicMarket: (ficha) => policies.canAccessEpicMarket(session, ficha),
        accessArcanoMarket: (ficha) => policies.canAccessArcanoMarket(session, ficha),
        accessLegendaryMarket: (ficha) => policies.canAccessLegendaryMarket(session, ficha),
        buyInMarket: (ficha) => policies.canBuyInMarket(session, ficha),
        viewFicha: (ficha) => policies.canViewFicha(session, ficha),
        editFicha: (ficha) => policies.canEditFicha(session, ficha),
      },
    }),
    [session]
  );
}

export default useAuthorization;
