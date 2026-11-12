import { Campaign, CampaignMember, Session, UserRole, type FichaCompleta } from '../types';

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
 * | canAccessEpicMarket        | `role IN ('admin','mestre') OR ficha.identidade.acesso_mercado_epico`                  |
 * | canAccessArcanoMarket      | `role IN ('admin','mestre') OR ficha.identidade.acesso_mercado_arcano`                |
 * | canAccessLegendaryMarket   | `role IN ('admin','mestre') OR ficha.identidade.acesso_mercado_lendario`              |
 * | canBuyInMarket             | `role IN ('admin','mestre') OR ficha.identidade.pode_comprar`                         |
 * | canCreateCampaign          | `role IN ('admin','mestre') AND tenant_id IS NOT NULL`                                 |
 * | canViewFicha               | `user_id = auth.uid() OR (is_mestre AND tenant_id = current_tenant())`                 |
 * | canEditFicha               | `canViewFicha AND (edicao_liberada OR is_mestre OR is_admin)`                          |
 * | canViewCampaign            | `tenant_id = current_tenant() OR EXISTS (member ativo)`                                |
 * | canManageCampaign          | `mestre_user_id = auth.uid() OR tenant_id = current_tenant()`                          |
 */

export interface FichaAccessOptions {
  /** Campanhas em que o usuário atua como mestre — libera ver a ficha de participantes. */
  mestreCampaignIds?: string[];
}

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

  /**
   * Campanhas pertencem a um cliente (tenant). Só quem tem cliente vinculado cria —
   * o administrador da plataforma não possui tenant (`profiles_admin_sem_tenant`).
   */
  canCreateCampaign: (session: Session | null): boolean =>
    (isAdmin(session) || isMestre(session)) && Boolean(session?.user.tenant_id),

  canViewFicha: (
    session: Session | null,
    ficha: FichaCompleta,
    options: FichaAccessOptions = {}
  ): boolean => {
    if (!session) return false;
    if (isAdmin(session)) return true;

    const identidade = ficha.identidade;
    if (identidade.user_id === session.user.id) return true;

    if (isMestre(session) && identidade.tenant_id && identidade.tenant_id === session.user.tenant_id) {
      return true;
    }

    if (
      isMestre(session) &&
      identidade.campanha_id &&
      options.mestreCampaignIds?.includes(identidade.campanha_id)
    ) {
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

  canViewCampaign: (
    session: Session | null,
    campaign: Campaign,
    members: CampaignMember[] = []
  ): boolean => {
    if (!session) return false;
    if (isAdmin(session)) return true;
    if (campaign.tenant_id === session.user.tenant_id) return true;
    return members.some(
      (member) => member.campaign_id === campaign.id && member.user_id === session.user.id
    );
  },

  canManageCampaign: (session: Session | null, campaign: Campaign): boolean => {
    if (!session) return false;
    if (isAdmin(session)) return true;
    if (campaign.mestre_user_id === session.user.id) return true;
    return isMestre(session) && campaign.tenant_id === session.user.tenant_id;
  },
};

export default policies;
