import { Session, UserRole, type FichaCompleta } from '../types';

/** Rótulos de exibição dos papéis da plataforma. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  mestre: 'Mestre',
  jogador: 'Jogador',
};

/**
 * Camada única de autorização.
 *
 * Mapa para o Supabase (migração futura): cada função vira uma policy RLS.
 *
 * | Função                     | Policy RLS equivalente                                                                 |
 * |----------------------------|----------------------------------------------------------------------------------------|
 * | canAccessAdminPanel        | `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')`                |
 * | canManageCatalog           | `role = 'admin'`                                                                       |
 * | canManageSpellVisibility   | `role IN ('admin','mestre')`                                                           |
 * | canManageLibrary           | `role = 'admin'`                                                                       |
 * | canAccessEpicMarket        | `role IN ('admin','mestre') OR ficha.identidade.acesso_mercado_epico`                  |
 * | canAccessArcanoMarket      | `role IN ('admin','mestre') OR ficha.identidade.acesso_mercado_arcano`                |
 * | canAccessLegendaryMarket   | `role IN ('admin','mestre') OR ficha.identidade.acesso_mercado_lendario`              |
 * | canBuyInMarket             | `role IN ('admin','mestre') OR ficha.identidade.pode_comprar`                         |
 * | canViewFicha               | `user_id = auth.uid() OR (is_mestre AND tenant_id = current_tenant())`                 |
 * | canEditFicha               | `canViewFicha AND (edicao_liberada OR is_mestre OR is_admin)`                          |
 */

const isAdmin = (session: Session | null): boolean => session?.user.role === 'admin';
const isMestre = (session: Session | null): boolean => session?.user.role === 'mestre';

export const policies = {
  isAdmin,
  isMestre,
  isJogador: (session: Session | null): boolean => session?.user.role === 'jogador',

  /** Área administrativa: exclusiva do administrador da plataforma. */
  canAccessAdminPanel: isAdmin,

  /** Catálogo global do sistema (mercadorias do Mercado e magias do Grimório), exclusivo do administrador da plataforma. */
  canManageCatalog: isAdmin,

  /** Ver e alternar as magias ocultas dos jogadores. */
  canManageSpellVisibility: (session: Session | null): boolean => isAdmin(session) || isMestre(session),

  /** Catálogo da Biblioteca (manuais oficiais e pergaminhos), exclusivo do administrador da plataforma. */
  canManageLibrary: isAdmin,

  /** Acesso ao Arsenal Épico do Mercado. */
  canAccessEpicMarket: (session: Session | null, ficha?: FichaCompleta | null): boolean =>
    isAdmin(session) || isMestre(session) || Boolean(ficha?.identidade?.acesso_mercado_epico),

  /** Acesso ao Mercado Arcano; antes da ficha carregar, a seção permanece aberta. */
  canAccessArcanoMarket: (session: Session | null, ficha?: FichaCompleta | null): boolean =>
    isAdmin(session) || isMestre(session) || (ficha ? ficha.identidade?.acesso_mercado_arcano !== false : true),

  /** O Mercado Lendário ainda não existe; a flag fica pronta para quando a seção nascer. */
  canAccessLegendaryMarket: (session: Session | null, ficha?: FichaCompleta | null): boolean =>
    isAdmin(session) || isMestre(session) || Boolean(ficha?.identidade?.acesso_mercado_lendario),

  /** Autorização para comprar no Mercado; antes da ficha carregar, mantém o acesso atual. */
  canBuyInMarket: (session: Session | null, ficha?: FichaCompleta | null): boolean =>
    isAdmin(session) || isMestre(session) || (ficha ? ficha.identidade?.pode_comprar !== false : true),

  canViewFicha: (session: Session | null, ficha: FichaCompleta): boolean => {
    if (!session) return false;
    if (isAdmin(session)) return true;

    const identidade = ficha.identidade;
    if (identidade.user_id === session.user.id) return true;

    if (isMestre(session) && identidade.tenant_id && identidade.tenant_id === session.user.tenant_id) {
      return true;
    }

    return false;
  },

  canEditFicha: (session: Session | null, ficha: FichaCompleta): boolean => {
    if (!session) return false;
    if (isAdmin(session)) return true;

    const identidade = ficha.identidade;

    if (identidade.user_id === session.user.id) {
      // O mestre da mesa pode congelar a edição do jogador.
      return identidade.edicao_liberada !== false;
    }

    if (isMestre(session) && identidade.tenant_id === session.user.tenant_id) return true;

    return false;
  },
};

export default policies;
