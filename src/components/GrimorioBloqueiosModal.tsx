import React, { useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { Modal } from './Modal';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { Skeleton } from './ui/Skeleton';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuthorization } from '../hooks/useAuthorization';
import { cacheKeys } from '../services/cacheKeys';
import { grimorioBloqueioService } from '../services/grimorioBloqueioService';
import { getSchoolVolumes, grimorioAllSchools } from '../mocks/grimorio';

export interface GrimorioBloqueiosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrimorioBloqueiosModal: React.FC<GrimorioBloqueiosModalProps> = ({ isOpen, onClose }) => {
  const { tenantId } = useAuthorization();
  const [mutating, setMutating] = useState<Record<string, boolean>>({});
  const [mutationError, setMutationError] = useState('');

  const query = useAsyncData(
    () => grimorioBloqueioService.listar(),
    [tenantId],
    { cacheKey: cacheKeys.grimorioBloqueios(tenantId), enabled: isOpen && Boolean(tenantId) }
  );

  const toggleSchool = async (schoolId: string) => {
    const blocked = query.data?.escolas.includes(schoolId) ?? false;
    setMutating((current) => ({ ...current, [schoolId]: true }));
    setMutationError('');
    try {
      if (blocked) await grimorioBloqueioService.desbloquearEscola(schoolId);
      else await grimorioBloqueioService.bloquearEscola(schoolId);
      query.reload();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Não foi possível atualizar o bloqueio da escola.');
    } finally {
      setMutating((current) => ({ ...current, [schoolId]: false }));
    }
  };

  const toggleVolume = async (volumeId: string) => {
    const blocked = query.data?.volumes.includes(volumeId) ?? false;
    setMutating((current) => ({ ...current, [volumeId]: true }));
    setMutationError('');
    try {
      if (blocked) await grimorioBloqueioService.desbloquearVolume(volumeId);
      else await grimorioBloqueioService.bloquearVolume(volumeId);
      query.reload();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'Não foi possível atualizar o bloqueio do tomo.');
    } finally {
      setMutating((current) => ({ ...current, [volumeId]: false }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bloqueios do Grimório"
      subtitle="Escolas e tomos bloqueados ficam selados para os jogadores do cliente; o Mestre continua enxergando-os."
      maxWidth="max-w-[720px]"
    >
      <div className="space-y-4">
        {mutationError && <p role="alert" className="border-l-2 border-[#a85b45] bg-[#28140f] px-3 py-2 font-serif text-sm text-[#e7b29e]">{mutationError}</p>}

        {query.isLoading ? (
          <div role="status" aria-label="Carregando bloqueios do Grimório" className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}
          </div>
        ) : query.error ? (
          <ErrorState title="Não foi possível carregar os bloqueios" description={query.error} onRetry={query.reload} />
        ) : !tenantId ? (
          <EmptyState variant="plano" title="Cliente indisponível" description="Não foi possível identificar o cliente desta mesa." />
        ) : grimorioAllSchools.length === 0 ? (
          <EmptyState variant="plano" title="Nenhuma escola disponível" description="Não há escolas do Grimório para configurar." />
        ) : (
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
            {grimorioAllSchools.map((school) => {
              const schoolBlocked = query.data?.escolas.includes(school.id) ?? false;
              const volumes = getSchoolVolumes(school.id);
              return (
                <section key={school.id} className="border border-[#4b3823] bg-[#1b120b] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#e6ddc5]">{school.name}</h3>
                      <p className="font-serif text-xs text-[#8f795e]">{school.subtitle}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`${schoolBlocked ? 'Desbloquear' : 'Bloquear'} escola ${school.name}`}
                      title={schoolBlocked ? 'Desbloquear escola' : 'Bloquear escola'}
                      disabled={Boolean(mutating[school.id])}
                      onClick={() => void toggleSchool(school.id)}
                      className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xs border border-[#5a4225] bg-[#130d08] text-[#c6a66d] transition-colors hover:border-[#a88d61] hover:text-[#f3dfaa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:cursor-wait disabled:opacity-50"
                    >
                      {schoolBlocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
                    </button>
                  </div>
                  {volumes.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[#3a2c1d] pt-3">
                      {volumes.map((volume) => {
                        const volumeBlocked = query.data?.volumes.includes(volume.id) ?? false;
                        const sealed = schoolBlocked || volumeBlocked;
                        return (
                          <button
                            key={volume.id}
                            type="button"
                            aria-label={`${volumeBlocked ? 'Desbloquear' : 'Bloquear'} tomo ${volume.number}: ${volume.title}`}
                            title={volumeBlocked ? 'Desbloquear tomo' : 'Bloquear tomo'}
                            disabled={Boolean(mutating[volume.id])}
                            onClick={() => void toggleVolume(volume.id)}
                            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-xs border px-2.5 py-1.5 font-serif text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:cursor-wait disabled:opacity-50 ${sealed ? 'border-[#80652e] bg-[#33250f] text-[#e7c56d]' : 'border-[#3e2d1d] bg-[#130d08] text-[#a88d61] hover:border-[#80652e] hover:text-[#e6ddc5]'}`}
                          >
                            {sealed ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                            <span>{volume.number} · {volume.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GrimorioBloqueiosModal;
