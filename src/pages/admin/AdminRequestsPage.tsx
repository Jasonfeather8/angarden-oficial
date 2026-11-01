import React, { useState } from 'react';
import { Check, ScrollText, X } from 'lucide-react';
import { PerfilConta, Tenant, TenantType, UserRole } from '../../types';
import { GothicButton } from '../../components/GothicButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/Skeleton';
import { useAsyncData } from '../../hooks/useAsyncData';
import { tenantService } from '../../services/tenantService';
import { profileService } from '../../services/profileService';
import { ROLE_LABELS } from '../../auth/policies';

interface RequestsData {
  requests: PerfilConta[];
  tenants: Tenant[];
}

const inputClassName =
  'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 px-3 py-2 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';

const formatDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const AdminRequestsPage: React.FC = () => {
  const { data, isLoading, error, reload } = useAsyncData<RequestsData>(async () => {
    const [requests, tenants] = await Promise.all([
      profileService.listProfiles(),
      tenantService.listTenants(),
    ]);
    return { requests, tenants };
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tipo, setTipo] = useState<TenantType>('individual');
  const [role, setRole] = useState<UserRole>('jogador');
  const [linkMode, setLinkMode] = useState<'novo' | 'existente'>('novo');
  const [nomeTenant, setNomeTenant] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  const requests = data?.requests ?? [];
  const tenants = data?.tenants ?? [];
  const pending = requests.filter((request) => request.status === 'pendente');
  const reviewed = requests.filter((request) => request.status !== 'pendente');

  const openApproval = (request: PerfilConta) => {
    setSelectedId(request.id);
    setTipo('individual');
    setRole('jogador');
    setLinkMode('novo');
    setNomeTenant(request.nome_completo);
    setTenantId(tenants[0]?.id ?? '');
    setMotivo('');
    setFeedback('');
  };

  const handleApprove = async () => {
    if (!selectedId) return;
    if (linkMode === 'existente' && !tenantId) {
      setFeedback('Selecione o cliente existente que receberá esta conta.');
      return;
    }

    setIsWorking(true);
    setFeedback('');
    try {
      const profile = await profileService.approveAccount(selectedId, {
        tipo,
        role,
        nome_tenant: linkMode === 'novo' ? nomeTenant : undefined,
        tenant_id: linkMode === 'existente' ? tenantId : undefined,
      });
      const tenant = profile.tenant_id ? await tenantService.getTenant(profile.tenant_id) : null;
      setFeedback(`Conta de ${profile.nome_completo} aprovada no cliente "${tenant?.nome ?? ''}".`);
      setSelectedId(null);
      reload();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Não foi possível aprovar a solicitação.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    setIsWorking(true);
    setFeedback('');
    try {
      await profileService.rejectAccount(selectedId, motivo);
      setFeedback('Solicitação recusada.');
      setSelectedId(null);
      reload();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Não foi possível recusar a solicitação.');
    } finally {
      setIsWorking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10">
        <LoadingState variant="table" label="Lendo as solicitações de conta…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <ErrorState description={error} onRetry={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 font-cinzel text-xl font-bold uppercase tracking-wider text-[#e6ddc5]">
          <ScrollText className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
          Solicitações de conta
        </h1>
        <p className="font-serif text-xs italic text-[#8c6b41]">
          Aprovar cria a conta do cliente e define o papel e o tipo de cliente
        </p>
      </header>

      {feedback && (
        <p role="status" className="border border-[#5a4225] bg-[#241a11]/90 px-4 py-2 font-serif text-xs text-[#d8c9aa]">
          {feedback}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#d8c9aa]">
          Pendentes ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-8 w-8" aria-hidden="true" />}
            title="Nenhuma solicitação pendente"
            description="Novos cadastros aparecerão aqui para sua análise."
          />
        ) : (
          <ul className="space-y-3">
            {pending.map((request) => (
              <li key={request.id} className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-cinzel text-sm font-bold text-[#e6ddc5]">
                      {request.nome_completo}
                    </p>
                    <p className="font-serif text-xs text-[#c4b9a3]">{request.email}</p>
                    <p className="font-serif text-[11px] text-[#8c6b41]">
                      WhatsApp: {request.whatsapp} · Solicitado em {formatDate(request.data_cadastro)}
                    </p>
                  </div>

                  {selectedId !== request.id && (
                    <div className="flex gap-2">
                      <GothicButton
                        size="xs"
                        icon={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
                        onClick={() => openApproval(request)}
                      >
                        Analisar
                      </GothicButton>
                    </div>
                  )}
                </div>

                {selectedId === request.id && (
                  <div className="mt-4 space-y-4 border-t border-[#3a2c1d] pt-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`tipo-${request.id}`} className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                          Tipo de cliente
                        </label>
                        <select
                          id={`tipo-${request.id}`}
                          value={tipo}
                          onChange={(event) => setTipo(event.target.value as TenantType)}
                          className={inputClassName}
                        >
                          <option value="individual">Individual</option>
                          <option value="organizacao">Organização</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`papel-${request.id}`} className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                          Papel na plataforma
                        </label>
                        <select
                          id={`papel-${request.id}`}
                          value={role}
                          onChange={(event) => setRole(event.target.value as UserRole)}
                          className={inputClassName}
                        >
                          <option value="jogador">{ROLE_LABELS.jogador}</option>
                          <option value="mestre">{ROLE_LABELS.mestre}</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor={`vinculo-${request.id}`} className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                          Vínculo do cliente
                        </label>
                        <select
                          id={`vinculo-${request.id}`}
                          value={linkMode}
                          onChange={(event) => setLinkMode(event.target.value as 'novo' | 'existente')}
                          className={inputClassName}
                        >
                          <option value="novo">Criar novo cliente</option>
                          <option value="existente">Vincular a um cliente existente</option>
                        </select>
                      </div>

                      {linkMode === 'novo' ? (
                        <div>
                          <label htmlFor={`nome-tenant-${request.id}`} className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                            Nome do cliente
                          </label>
                          <input
                            id={`nome-tenant-${request.id}`}
                            type="text"
                            value={nomeTenant}
                            onChange={(event) => setNomeTenant(event.target.value)}
                            className={inputClassName}
                            maxLength={120}
                          />
                        </div>
                      ) : (
                        <div>
                          <label htmlFor={`tenant-${request.id}`} className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                            Cliente existente
                          </label>
                          <select
                            id={`tenant-${request.id}`}
                            value={tenantId}
                            onChange={(event) => setTenantId(event.target.value)}
                            className={inputClassName}
                          >
                            {tenants.length === 0 && <option value="">Nenhum cliente cadastrado</option>}
                            {tenants.map((tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.nome} ({tenant.tipo === 'organizacao' ? 'Organização' : 'Individual'})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`motivo-${request.id}`} className="mb-1.5 block text-xs font-semibold text-[#d8c9aa]">
                        Motivo da recusa (usado apenas se recusar)
                      </label>
                      <input
                        id={`motivo-${request.id}`}
                        type="text"
                        value={motivo}
                        onChange={(event) => setMotivo(event.target.value)}
                        className={inputClassName}
                        maxLength={200}
                        placeholder="Opcional"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <GothicButton
                        size="sm"
                        disabled={isWorking}
                        icon={<Check className="h-4 w-4" aria-hidden="true" />}
                        onClick={handleApprove}
                      >
                        {isWorking ? 'Processando…' : 'Aprovar conta'}
                      </GothicButton>
                      <GothicButton
                        size="sm"
                        variant="danger"
                        disabled={isWorking}
                        icon={<X className="h-4 w-4" aria-hidden="true" />}
                        onClick={handleReject}
                      >
                        Recusar
                      </GothicButton>
                      <GothicButton
                        size="sm"
                        variant="secondary"
                        disabled={isWorking}
                        onClick={() => setSelectedId(null)}
                      >
                        Cancelar
                      </GothicButton>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#d8c9aa]">
            Avaliadas ({reviewed.length})
          </h2>
          <ul className="divide-y divide-[#3a2c1d] border border-[#5a4225] bg-[#0c0806]/80">
            {reviewed.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-serif text-xs text-[#c4b9a3]">
                    {request.nome_completo} · {request.email}
                  </p>
                  <p className="font-serif text-[11px] text-[#8c6b41]">
                    Avaliada em {formatDate(request.updated_at)}
                    {request.motivo_recusa ? ` · Motivo: ${request.motivo_recusa}` : ''}
                  </p>
                </div>
                <span
                  className={
                    request.status === 'ativo'
                      ? 'border border-emerald-800/70 bg-emerald-950/40 px-2 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-emerald-300'
                      : 'border border-red-900/70 bg-red-950/40 px-2 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-red-300'
                  }
                >
                  {request.status === 'ativo' ? 'Aprovada' : 'Recusada'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default AdminRequestsPage;
