import type { Campaign, CampaignMember } from '../types';
import { prewarmAsyncDataCache } from '../hooks/useAsyncData';
import { useSessionStore } from '../store/useSessionStore';
import { useAppStore } from '../store/useAppStore';
import { campaignService } from './campaignService';
import { cacheKeys } from './cacheKeys';

export async function loadCampaignPageData(): Promise<{
  campaigns: Campaign[];
  members: CampaignMember[];
  userNames: Record<string, string>;
}> {
  const { profileService } = await import('./profileService');
  const [access, profiles] = await Promise.all([
    campaignService.listAccessible(),
    profileService.listProfiles(),
  ]);
  return {
    campaigns: access.campaigns,
    members: access.members,
    userNames: Object.fromEntries(profiles.map((profile) => [profile.id, profile.nome_completo])),
  };
}

export async function prewarmAcervoDoCliente(tenantId: string): Promise<void> {
  try {
    const { fichaService } = await import('./fichaService');
    const load = async () => {
      if (useSessionStore.getState().session?.user.tenant_id !== tenantId) throw new Error('Escopo do acervo alterado.');
      const characters = await fichaService.getTenantCharacters();
      if (useSessionStore.getState().session?.user.tenant_id !== tenantId) throw new Error('Escopo do acervo alterado.');
      return characters;
    };
    await prewarmAsyncDataCache(cacheKeys.acervoPersonagens(tenantId), load);
  } catch {
    // Falhas de carregamento em segundo plano são silenciosas.
  }
}

export async function prewarmTelasSecundarias(tenantId: string, userId: string): Promise<void> {
  try {
    const { fichaService } = await import('./fichaService');
    const isSessionCurrent = () => {
      const user = useSessionStore.getState().session?.user;
      return user?.id === userId && user.tenant_id === tenantId;
    };
    if (!isSessionCurrent()) return;

    await prewarmAsyncDataCache(cacheKeys.personagensResumo(tenantId), async () => {
      if (!isSessionCurrent()) throw new Error('Escopo do acervo alterado.');
      const characters = await fichaService.getListaPersonagens();
      if (!isSessionCurrent()) throw new Error('Escopo do acervo alterado.');
      return characters;
    });
    await prewarmAsyncDataCache(cacheKeys.campanhas(userId), async () => {
      if (!isSessionCurrent()) throw new Error('Sessão alterada.');
      const campaigns = await loadCampaignPageData();
      if (!isSessionCurrent()) throw new Error('Sessão alterada.');
      return campaigns;
    });

    if (!isSessionCurrent()) return;
    const characters = await fichaService.getTenantCharacters();
    if (!isSessionCurrent() || characters.length === 0) return;
    const lastCharacterId = useAppStore.getState().lastCharacterId;
    const characterToPrewarm = characters.find((character) => character.id === lastCharacterId) ?? characters[0];
    const { useFichaStore } = await import('../store/useFichaStore');
    if (!isSessionCurrent()) return;
    await useFichaStore.getState().prewarmFicha(characterToPrewarm.id);
  } catch {
    // Falhas de carregamento em segundo plano são silenciosas.
  }
}
