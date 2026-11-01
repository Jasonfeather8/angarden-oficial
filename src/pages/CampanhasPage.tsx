import React, { useState } from 'react';
import { Check, Copy, Link2, Plus, Swords, UserMinus, Users } from 'lucide-react';
import { Campaign, CampaignMember } from '../types';
import { GothicButton } from '../components/GothicButton';
import { MedievalFrame } from '../components/MedievalFrame';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/Skeleton';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuthorization } from '../hooks/useAuthorization';
import { useSessionStore } from '../store/useSessionStore';
import { campaignService } from '../services/campaignService';
import { profileService } from '../services/profileService';
import { convitePath } from '../routes/paths';

interface CampaignData {
  campaigns: Campaign[];
  members: CampaignMember[];
  userNames: Record<string, string>;
}

const inputClassName =
  'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 px-3 py-2.5 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';

/** Extrai o token de um link de convite colado ou de um token puro. */
function extractToken(value: string): string {
  const trimmed = value.trim();
  const marker = '/convites/';
  const index = trimmed.indexOf(marker);
  const raw = index >= 0 ? trimmed.slice(index + marker.length) : trimmed;
  return raw.split(/[?#/]/)[0] ?? '';
}

export const CampanhasPage: React.FC = () => {
  const session = useSessionStore((state) => state.session);
  const { can } = useAuthorization();

  const { data, isLoading, error, reload } = useAsyncData<CampaignData>(
    async () => {
      const [access, profiles] = await Promise.all([
        campaignService.listAccessible(),
        profileService.listProfiles(),
      ]);
      return {
        campaigns: access.campaigns,
        members: access.members,
        userNames: Object.fromEntries(profiles.map((profile) => [profile.id, profile.nome_completo])),
      };
    },
    [session?.user.id],
    { enabled: Boolean(session) }
  );

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [copiedCampaignId, setCopiedCampaignId] = useState<string | null>(null);
  const [joinToken, setJoinToken] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const campaigns = data?.campaigns ?? [];
  const members = data?.members ?? [];
  const userNames = data?.userNames ?? {};

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;

    const titulo = nome.trim();
    if (titulo.length < 3) {
      setFormError('Informe um nome de campanha com pelo menos 3 caracteres.');
      return;
    }

    setFormError('');
    setStatusMessage('');
    setIsCreating(true);
    try {
      await campaignService.createCampaign({ nome: titulo, descricao }, session);
      setNome('');
      setDescricao('');
      setStatusMessage('Campanha criada. Gere um link de convite para chamar os jogadores.');
      reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Não foi possível criar a campanha.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateInvite = async (campaignId: string) => {
    if (!session) return;
    try {
      const invite = await campaignService.createInvite(campaignId);
      const url = new URL(convitePath(invite.token), window.location.origin).href;
      setInviteLinks((current) => ({ ...current, [campaignId]: url }));
      setStatusMessage('Link de convite gerado. Compartilhe com os jogadores.');
    } catch {
      setStatusMessage('Não foi possível gerar o link de convite.');
    }
  };

  const handleCopyInvite = async (campaignId: string) => {
    const url = inviteLinks[campaignId];
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCampaignId(campaignId);
      window.setTimeout(() => setCopiedCampaignId(null), 2000);
    } catch {
      setStatusMessage('Não foi possível copiar automaticamente. Selecione o link e copie manualmente.');
    }
  };

  const handleJoin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) return;

    const token = extractToken(joinToken);
    if (!token) {
      setStatusMessage('Informe o link ou o código do convite.');
      return;
    }

    setIsJoining(true);
    try {
      await campaignService.acceptInvite(token, session);
      setJoinToken('');
      setStatusMessage('Você entrou na campanha.');
      reload();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Convite inválido.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async (campaignId: string) => {
    if (!session) return;
    await campaignService.removeMember(campaignId, session.user.id);
    reload();
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[900px] py-10">
        <LoadingState variant="cards" label="Consultando as campanhas do reino…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[900px] py-10">
        <ErrorState description={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div id="page-campanhas" className="mx-auto w-full max-w-[900px] space-y-6">
      <MedievalFrame
        title={
          <h2 className="flex items-center gap-2 font-cinzel text-xl font-bold uppercase tracking-wider text-[#e6ddc5]">
            <Swords className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Campanhas
          </h2>
        }
        subtitle="Mesas acessíveis ao seu cliente e convites por link"
        headerRight={
          <span className="font-serif text-xs italic text-[#8c6b41]">
            {campaigns.length} campanha{campaigns.length === 1 ? '' : 's'}
          </span>
        }
      >
        <div className="space-y-6">
          {statusMessage && (
            <p role="status" className="border border-[#5a4225] bg-[#241a11]/90 px-3 py-2 font-serif text-xs text-[#d8c9aa]">
              {statusMessage}
            </p>
          )}

          {/* Entrar por convite */}
          <form onSubmit={handleJoin} className="space-y-2 border border-[#3a2c1d] bg-black/40 p-4">
            <label htmlFor="campanha-convite" className="flex items-center gap-1.5 font-cinzel text-xs font-bold uppercase tracking-wider text-[#d8c9aa]">
              <Link2 className="h-3.5 w-3.5 text-[#a88d61]" aria-hidden="true" />
              Entrar com um convite
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="campanha-convite"
                type="text"
                value={joinToken}
                onChange={(event) => setJoinToken(event.target.value)}
                className={inputClassName}
                placeholder="Cole o link do convite ou o código"
              />
              <GothicButton type="submit" size="sm" disabled={isJoining} className="shrink-0">
                {isJoining ? 'Entrando…' : 'Entrar'}
              </GothicButton>
            </div>
          </form>

          {/* Criar campanha */}
          {can.createCampaign ? (
            <form onSubmit={handleCreate} className="space-y-3 border border-[#3a2c1d] bg-black/40 p-4">
              <h3 className="flex items-center gap-1.5 font-cinzel text-xs font-bold uppercase tracking-wider text-[#d8c9aa]">
                <Plus className="h-3.5 w-3.5 text-[#a88d61]" aria-hidden="true" />
                Nova campanha
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="campanha-nome" className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                    Nome da campanha
                  </label>
                  <input
                    id="campanha-nome"
                    type="text"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    className={inputClassName}
                    maxLength={120}
                    placeholder="Ex.: As Crônicas de Angarden"
                  />
                </div>
                <div>
                  <label htmlFor="campanha-descricao" className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                    Descrição (opcional)
                  </label>
                  <input
                    id="campanha-descricao"
                    type="text"
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    className={inputClassName}
                    maxLength={200}
                    placeholder="Uma frase sobre a mesa"
                  />
                </div>
              </div>
              {formError && (
                <p role="alert" className="border border-red-900/80 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                  {formError}
                </p>
              )}
              <GothicButton type="submit" size="sm" disabled={isCreating}>
                {isCreating ? 'Criando…' : 'Criar campanha'}
              </GothicButton>
            </form>
          ) : (
            <p className="border border-[#3a2c1d] bg-black/30 px-4 py-3 font-serif text-xs text-[#a88d61]">
              Apenas mestres com um cliente vinculado podem criar campanhas. Entre em uma mesa existente
              usando um link de convite.
            </p>
          )}

          {/* Lista de campanhas */}
          {campaigns.length === 0 ? (
            <EmptyState
              icon={<Swords className="h-8 w-8" aria-hidden="true" />}
              title="Nenhuma campanha disponível"
              description={
                can.createCampaign
                  ? 'Crie a primeira campanha do seu cliente para começar a reunir a mesa.'
                  : 'Aguarde um convite do Mestre da mesa para participar de uma campanha.'
              }
            />
          ) : (
            <ul className="space-y-4">
              {campaigns.map((campaign) => {
                const campaignMembers = members.filter(
                  (member) => member.campaign_id === campaign.id
                );
                const canManage = can.manageCampaign(campaign);
                const inviteUrl = inviteLinks[campaign.id];

                return (
                  <li
                    key={campaign.id}
                    className="space-y-3 border border-[#5a4225] bg-[#0c0806]/80 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-cinzel text-base font-bold text-[#f0e2c0]">
                          {campaign.nome}
                        </h3>
                        {campaign.descricao && (
                          <p className="font-serif text-xs italic text-[#a88d61]">
                            {campaign.descricao}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <span className="border border-[#8c6b41]/70 bg-[#2a1d10]/80 px-2 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#d4af37]">
                          Você administra
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#a88d61]">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        Mesa ({campaignMembers.length})
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {campaignMembers.map((member) => (
                          <li
                            key={`${member.campaign_id}-${member.user_id}`}
                            className="border border-[#3a2c1d] bg-black/40 px-2 py-1 font-serif text-[11px] text-[#c4b9a3]"
                          >
                            {userNames[member.user_id] ?? 'Aventureiro'}
                            <span className="ml-1.5 text-[9px] uppercase tracking-wider text-[#8c6b41]">
                              {member.papel}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canManage && (
                        <GothicButton
                          size="xs"
                          variant="secondary"
                          onClick={() => handleGenerateInvite(campaign.id)}
                        >
                          Gerar link de convite
                        </GothicButton>
                      )}

                      {session && campaignMembers.some((m) => m.user_id === session.user.id) && (
                        <GothicButton
                          size="xs"
                          variant="danger"
                          icon={<UserMinus className="h-3.5 w-3.5" aria-hidden="true" />}
                          onClick={() => handleLeave(campaign.id)}
                        >
                          Sair da campanha
                        </GothicButton>
                      )}
                    </div>

                    {inviteUrl && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label htmlFor={`convite-${campaign.id}`} className="sr-only">
                          Link de convite da campanha {campaign.nome}
                        </label>
                        <input
                          id={`convite-${campaign.id}`}
                          type="text"
                          readOnly
                          value={inviteUrl}
                          onFocus={(event) => event.target.select()}
                          className={`${inputClassName} text-xs`}
                        />
                        <GothicButton
                          size="xs"
                          variant="secondary"
                          className="shrink-0"
                          icon={
                            copiedCampaignId === campaign.id ? (
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                            )
                          }
                          onClick={() => handleCopyInvite(campaign.id)}
                        >
                          {copiedCampaignId === campaign.id ? 'Copiado' : 'Copiar'}
                        </GothicButton>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </MedievalFrame>
    </div>
  );
};

export default CampanhasPage;
