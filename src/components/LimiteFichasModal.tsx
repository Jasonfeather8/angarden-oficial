import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from './Modal';
import { GothicButton } from './GothicButton';
import { EmptyState } from './ui/EmptyState';
import { ErrorState } from './ui/ErrorState';
import { Skeleton } from './ui/Skeleton';
import { useAsyncData, invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { useAuthorization } from '../hooks/useAuthorization';
import { cacheKeys } from '../services/cacheKeys';
import { fichaService } from '../services/fichaService';
import { profileService } from '../services/profileService';
import type { PerfilConta } from '../types';

type LimitesData = {
  perfis: PerfilConta[];
  contagens: Record<string, number>;
};

export interface LimiteFichasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LimiteFichasModal: React.FC<LimiteFichasModalProps> = ({ isOpen, onClose }) => {
  const { tenantId } = useAuthorization();
  const [limites, setLimites] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const query = useAsyncData<LimitesData>(
    async () => {
      const [perfis, contagens] = await Promise.all([
        profileService.listarDoCliente(tenantId as string),
        fichaService.contarFichasPorJogador(),
      ]);
      return { perfis, contagens };
    },
    [tenantId],
    { cacheKey: cacheKeys.limitesDeFichas(tenantId), enabled: isOpen && Boolean(tenantId) }
  );

  useEffect(() => {
    if (isOpen) {
      setSaveError('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.data) return;
    setLimites(Object.fromEntries(query.data.perfis
      .filter((perfil) => perfil.role !== 'admin')
      .map((perfil) => [perfil.id, perfil.limite_fichas ?? 10])));
  }, [query.data]);

  const saveLimits = async () => {
    if (!query.data) return;
    const altered = query.data.perfis.filter((perfil) =>
      perfil.role !== 'admin' && limites[perfil.id] !== (perfil.limite_fichas ?? 10)
    );

    setIsSaving(true);
    setSaveError('');
    setSuccessMessage('');
    try {
      await Promise.all(altered.map((perfil) =>
        profileService.atualizarLimiteFichas(perfil.id, limites[perfil.id])
      ));
      invalidateAsyncDataCache(cacheKeys.limitesDeFichas(tenantId));
      query.reload();
      setSuccessMessage('Limites de fichas salvos com sucesso.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar os limites de fichas.');
    } finally {
      setIsSaving(false);
    }
  };

  const jogadores = query.data?.perfis.filter((perfil) => perfil.role !== 'admin') ?? [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { if (!isSaving) onClose(); }}
      title="Limite de Fichas por Jogador"
      subtitle="O limite vale para cada jogador dentro deste cliente."
      maxWidth="max-w-[650px]"
    >
      <div className="space-y-4">
        {query.isLoading ? (
          <div role="status" aria-label="Carregando jogadores" className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}
          </div>
        ) : query.error ? (
          <ErrorState title="Não foi possível carregar os jogadores" description={query.error} onRetry={query.reload} />
        ) : !tenantId ? (
          <EmptyState variant="plano" title="Cliente indisponível" description="Não foi possível identificar o cliente desta mesa." />
        ) : jogadores.length === 0 ? (
          <EmptyState variant="plano" title="Nenhum jogador encontrado" description="Não há jogadores para definir limites de fichas neste cliente." />
        ) : (
          <div className="space-y-2">
            {jogadores.map((perfil) => {
              const limite = perfil.limite_fichas ?? 10;
              return (
                <div key={perfil.id} className="flex flex-col gap-3 border border-[#4b3823] bg-[#1b120b] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-cinzel text-sm uppercase text-[#e6ddc5]">{perfil.nome_completo}</p>
                    <p className="truncate font-serif text-xs text-[#8f795e]">{perfil.email}</p>
                    <p className="mt-1 font-serif text-xs text-[#c6a66d]">{query.data?.contagens[perfil.id] ?? 0} de {limite} fichas em uso</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <label htmlFor={`limite-fichas-${perfil.id}`} className="font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d]">Limite</label>
                    <input
                      id={`limite-fichas-${perfil.id}`}
                      type="number"
                      min={0}
                      max={1000}
                      step={1}
                      value={limites[perfil.id] ?? limite}
                      disabled={isSaving || Boolean(successMessage)}
                      onChange={(event) => setLimites((current) => ({ ...current, [perfil.id]: Number(event.target.value) }))}
                      className="w-24 rounded-xs border border-[#5a4225] bg-[#130d08] px-2 py-2 font-serif text-sm text-[#e6ddc5] outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:opacity-60"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {saveError && <p role="alert" className="border-l-2 border-[#a85b45] bg-[#28140f] px-3 py-2 font-serif text-sm text-[#e7b29e]">{saveError}</p>}
        {successMessage && <p role="status" aria-live="polite" className="border-l-2 border-[#80652e] bg-[#20150c] px-3 py-2 font-serif text-sm text-[#e7c56d]">{successMessage}</p>}

        {!query.isLoading && !query.error && jogadores.length > 0 && (
          <div className="flex justify-end gap-2 pt-1">
            {successMessage ? (
              <button type="button" onClick={onClose} className="rounded-xs border border-[#4b3823] px-4 py-2 font-cinzel text-[10px] uppercase text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]">Fechar</button>
            ) : (
              <GothicButton type="button" size="sm" width={190} height={40} disabled={isSaving} icon={<Check className="h-4 w-4" />} className="focus-visible:ring-2 focus-visible:ring-[#d1a85a]" onClick={saveLimits}>
                {isSaving ? 'Salvando...' : 'Salvar Limites'}
              </GothicButton>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LimiteFichasModal;
