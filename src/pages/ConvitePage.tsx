import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Link2, Swords } from 'lucide-react';
import { CampaignInvitePreview } from '../types';
import { GothicButton } from '../components/GothicButton';
import { larguraDaPagina, PageShell } from '../components/PageShell';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/Skeleton';
import { invalidateAsyncDataCache, useAsyncData } from '../hooks/useAsyncData';
import { useSessionStore } from '../store/useSessionStore';
import { campaignService } from '../services/campaignService';
import { ROUTES } from '../routes/paths';

export const ConvitePage: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const session = useSessionStore((state) => state.session);
  const navigate = useNavigate();

  const { data, isLoading, error, reload } = useAsyncData<CampaignInvitePreview>(
    () => campaignService.getInvitePreview(token),
    [token, session?.user.id],
    { enabled: Boolean(session && token), cacheKey: `convite:${token}:${session?.user.id ?? ''}` }
  );

  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleAccept = async () => {
    if (!session) return;
    setIsJoining(true);
    setJoinError('');
    try {
      await campaignService.acceptInvite(token, session);
      invalidateAsyncDataCache(`convite:${token}:${session.user.id}`);
      invalidateAsyncDataCache('campanhas');
      navigate(ROUTES.campanhas, { replace: true });
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Não foi possível aceitar o convite.');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`mx-auto w-full ${larguraDaPagina('estreito')} py-10`}>
        <LoadingState label="Lendo o convite da campanha…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`mx-auto w-full ${larguraDaPagina('estreito')} py-10`}>
        <ErrorState title="Convite indisponível" description={error} onRetry={reload} />
      </div>
    );
  }

  const preview = data ?? null;

  return (
      <PageShell id="page-convite" variant="estreito"
        title={
          <h2 className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Convite de campanha
          </h2>
        }
        subtitle="Um chamado para se juntar à mesa"
      >
        <div className="space-y-6">
          <div className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
            {preview ? (
              <>
                <h3 className="flex items-center gap-2 font-cinzel text-lg font-bold text-[#f0e2c0]">
                  <Swords className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
                  {preview.nome}
                </h3>
                <p className="mt-1 font-serif text-sm italic text-[#a88d61]">
                  {preview.descricao || 'Aceite o convite para participar desta mesa.'}
                </p>
              </>
            ) : (
              <p className="font-serif text-sm italic text-[#a88d61]">
                Entre na sua conta para ver os detalhes deste convite.
              </p>
            )}
          </div>

          {joinError && (
            <p role="alert" className="border border-red-900/80 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {joinError}
            </p>
          )}

          {preview?.ja_membro ? (
            <div className="space-y-4">
              <p className="flex items-center gap-2 border border-emerald-900/80 bg-emerald-950/30 px-3 py-2 font-serif text-sm text-emerald-200">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Você já participa desta campanha.
              </p>
              <GothicButton size="sm" onClick={() => navigate(ROUTES.campanhas)}>
                Ver minhas campanhas
              </GothicButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <GothicButton size="sm" disabled={isJoining || !session} onClick={handleAccept}>
                {isJoining ? 'Entrando…' : 'Aceitar convite'}
              </GothicButton>
              <GothicButton size="sm" variant="secondary" onClick={() => navigate(ROUTES.campanhas)}>
                Voltar às campanhas
              </GothicButton>
            </div>
          )}
        </div>
      </PageShell>
  );
};

export default ConvitePage;
