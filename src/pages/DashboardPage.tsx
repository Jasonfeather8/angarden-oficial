import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarClock,
  ChevronRight,
  Clock3,
  Crown,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Link2,
  Pencil,
  ScrollText,
  Store,
  Users,
} from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { PageShell } from '../components/PageShell';
import { Modal } from '../components/Modal';
import { PainelSecao } from '../components/ui/PainelSecao';
import { ToolbarButton } from '../components/ui/ToolbarButton';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { useAsyncData } from '../hooks/useAsyncData';
import { cacheKeys } from '../services/cacheKeys';
import { scheduleService } from '../services/scheduleService';
import { tenantService } from '../services/tenantService';
import { ROUTES } from '../routes/paths';

type SessionForm = {
  dataHora: string;
  titulo: string;
  pauta: string;
  linkVtt: string;
};

type SessionFormMode = 'agendar' | 'editar';

type Atalho = {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  to: string;
};

const fieldClassName =
  'w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2.5 text-sm text-[#e6ddc5] outline-none transition-colors focus:border-[#b89558] focus:ring-1 focus:ring-[#b89558]/50';

const pad = (value: number) => String(value).padStart(2, '0');

const toDatetimeLocal = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const isHttpUrl = (value: string) => {
  try {
    const link = new URL(value);
    return ['http:', 'https:'].includes(link.protocol);
  } catch {
    return false;
  }
};

const formatSessionDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatToday = (date: Date) =>
  new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(date);

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="min-w-[62px] rounded-xs border border-[#5a4225] bg-[#100a06] px-2.5 py-2.5 text-center">
    <div className="font-cinzel text-2xl font-bold leading-none text-[#f0c265]">{String(value).padStart(2, '0')}</div>
    <div className="mt-1 font-cinzel text-[8px] uppercase tracking-wider text-[#a88d61]">{label}</div>
  </div>
);

const SessionCountdown = React.memo(({ dataHora }: { dataHora: string }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const countdown = formatCountdown(Date.parse(dataHora) - now);
  const hasSessionStarted = Date.parse(dataHora) <= now;

  return (
    <div
      aria-label="Contagem regressiva para a próxima sessão"
      className="rounded-xs border border-[#70552f] bg-[#1b120b] p-3 xl:min-w-[320px]"
    >
      <p className="mb-2 flex items-center justify-center gap-1.5 font-cinzel text-[10px] uppercase tracking-[0.16em] text-[#b89558]">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {hasSessionStarted ? 'Sessão em andamento' : 'A mesa começa em'}
      </p>
      {hasSessionStarted ? (
        <p className="text-center font-serif text-sm italic text-[#e0bd71]">
          Confira os registros da campanha após a aventura.
        </p>
      ) : (
        <div className="flex justify-center gap-2">
          <CountdownUnit value={countdown.days} label="dias" />
          <CountdownUnit value={countdown.hours} label="horas" />
          <CountdownUnit value={countdown.minutes} label="min" />
          <CountdownUnit value={countdown.seconds} label="seg" />
        </div>
      )}
    </div>
  );
});

const SessaoSkeleton: React.FC = () => (
  <div aria-hidden="true" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
    <div>
      <Skeleton className="h-7 w-64 max-w-full" />
      <Skeleton className="mt-2 h-4 w-52 max-w-full" />
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
      </div>
    </div>
    <div className="rounded-xs border border-[#70552f] bg-[#1b120b] p-3 xl:min-w-[320px]">
      <Skeleton className="mx-auto mb-2 h-3 w-28" />
      <div className="flex justify-center gap-2">
        <Skeleton className="h-14 w-[62px]" />
        <Skeleton className="h-14 w-[62px]" />
        <Skeleton className="h-14 w-[62px]" />
        <Skeleton className="h-14 w-[62px]" />
      </div>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const user = useSessionStore((state) => state.session?.user ?? null);
  const { isMestre, tenantId } = useAuthorization();

  const { data: session, isLoading: isLoadingSessao, error: erroSessao, reload: reloadSessao } = useAsyncData(
    () => scheduleService.getProximaSessao(),
    [],
    { cacheKey: cacheKeys.proximaSessao(user?.tenant_id) }
  );

  const { data: cliente } = useAsyncData(
    () => (tenantId ? tenantService.getTenant(tenantId) : Promise.resolve(null)),
    [tenantId],
    { cacheKey: cacheKeys.cliente(tenantId), enabled: Boolean(tenantId) }
  );

  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [sessionFormMode, setSessionFormMode] = useState<SessionFormMode>('agendar');
  const [isSavingSessao, setIsSavingSessao] = useState(false);
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    dataHora: '',
    titulo: '',
    pauta: '',
    linkVtt: '',
  });
  const [formError, setFormError] = useState('');

  const primeiroNome = useMemo(() => {
    const nome = user?.nome_completo?.trim();
    return nome ? nome.split(/\s+/)[0] : '';
  }, [user?.nome_completo]);

  const hoje = useMemo(() => formatToday(new Date()), []);

  const atalhos = useMemo<Atalho[]>(() => {
    const lista: Atalho[] = [
      {
        id: 'personagens',
        label: 'Personagens',
        hint: isMestre ? 'Todas as fichas da mesa' : 'Suas fichas e sua evolução',
        icon: <Users className="h-4 w-4" />,
        to: ROUTES.personagens,
      },
      {
        id: 'mercado',
        label: 'Mercado Global',
        hint: 'Mercadorias, preços e compras',
        icon: <Store className="h-4 w-4" />,
        to: ROUTES.mercado,
      },
      {
        id: 'grimorio',
        label: 'Grimório',
        hint: 'Escolas, tomos e magias',
        icon: <BookOpen className="h-4 w-4" />,
        to: ROUTES.grimorio,
      },
      {
        id: 'cronicas',
        label: 'Crônicas',
        hint: 'Relatos das sessões',
        icon: <ScrollText className="h-4 w-4" />,
        to: ROUTES.cronicas,
      },
    ];

    if (isMestre) {
      lista.push({
        id: 'painel-mestre',
        label: 'Painel do Mestre',
        hint: 'Permissões, limites e selos',
        icon: <Crown className="h-4 w-4" />,
        to: ROUTES.painelMestre,
      });
    }

    return lista;
  }, [isMestre]);

  const openScheduleModal = () => {
    setSessionFormMode('agendar');
    setSessionForm({ dataHora: '', titulo: '', pauta: '', linkVtt: '' });
    setFormError('');
    setScheduleModalOpen(true);
  };

  const openEditModal = () => {
    if (!session) return;
    setSessionFormMode('editar');
    setSessionForm({
      dataHora: toDatetimeLocal(new Date(session.dataHora)),
      titulo: session.titulo,
      pauta: session.pauta,
      linkVtt: session.linkVtt ?? '',
    });
    setFormError('');
    setScheduleModalOpen(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalOpen(false);
    setFormError('');
  };

  const updateSessionForm = (field: keyof SessionForm, value: string) => {
    setSessionForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const handleScheduleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingSessao) return;

    const title = sessionForm.titulo.trim();
    const agenda = sessionForm.pauta.trim();
    const scheduledDate = Date.parse(sessionForm.dataHora);

    if (!sessionForm.dataHora || !title || !agenda) {
      setFormError('Preencha a data e hora, o título e a pauta da sessão.');
      return;
    }
    if (!Number.isFinite(scheduledDate) || scheduledDate <= Date.now()) {
      setFormError('A sessão deve ser agendada para uma data e hora futuras.');
      return;
    }
    if (sessionForm.linkVtt.trim() && !isHttpUrl(sessionForm.linkVtt.trim())) {
      setFormError('Informe um link válido começando com http:// ou https://.');
      return;
    }

    setIsSavingSessao(true);
    try {
      await scheduleService.salvarProximaSessao({
        dataHora: new Date(sessionForm.dataHora).toISOString(),
        titulo: title,
        pauta: agenda,
        linkVtt: sessionForm.linkVtt.trim() || undefined,
      });
      reloadSessao();
      closeScheduleModal();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Não foi possível agendar a sessão.');
    } finally {
      setIsSavingSessao(false);
    }
  };

  const modoEdicao = sessionFormMode === 'editar';

  return (
    <>
      <PageShell
        id="page-dashboard"
        variant="amplo"
        title={
          <h2 className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Início / Dashboard Geral
          </h2>
        }
        subtitle="Visão panorâmica da campanha e status do reino"
        headerRight={
          cliente ? (
            <div className="text-xs italic font-serif text-[#8c6b41]">Cliente · {cliente.nome}</div>
          ) : undefined
        }
      >
        <div className="space-y-5">
          <section
            aria-label="Contexto da mesa"
            className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#3a2c1d] bg-gradient-to-r from-[#1c130c] via-[#120c08] to-[#1c130c] px-4 py-3"
          >
            <p className="min-w-0 truncate font-cinzel text-base font-bold text-[#f0e2c0]">
              {primeiroNome ? `Bem-vindo de volta, ${primeiroNome}` : 'Bem-vindo de volta'}
            </p>
            <p className="font-serif text-xs capitalize italic text-[#8f795e]">{hoje}</p>
          </section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <PainelSecao
              id="proxima-sessao-titulo"
              icon={<CalendarClock className="h-4 w-4" />}
              title="Próxima sessão"
              extra={
                isMestre && session && !isLoadingSessao ? (
                  <ToolbarButton icon={<Pencil className="h-3.5 w-3.5" />} onClick={openEditModal}>
                    Editar sessão
                  </ToolbarButton>
                ) : undefined
              }
              contentClassName="p-4 sm:p-5"
            >
              {isLoadingSessao ? (
                <div role="status" aria-live="polite">
                  <span className="sr-only">Carregando a sessão agendada…</span>
                  <SessaoSkeleton />
                </div>
              ) : erroSessao ? (
                <ErrorState description={erroSessao} onRetry={reloadSessao} />
              ) : session ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                  <div className="min-w-0">
                    <h3 className="font-cinzel text-xl font-bold text-[#f0d79b] sm:text-2xl">{session.titulo}</h3>
                    <p className="mt-1 font-serif text-sm capitalize italic text-[#b39a78]">
                      {formatSessionDate(session.dataHora)}
                    </p>
                    <div className="mt-4">
                      <p className="mb-1.5 flex items-center gap-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#a88d61]">
                        <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Pauta da mesa
                      </p>
                      <p className="font-serif text-base leading-relaxed text-[#d6c4ae]">{session.pauta}</p>
                    </div>
                    {session.linkVtt && (
                      <a
                        href={session.linkVtt}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#d1a85a] underline decoration-[#70552f] underline-offset-4 transition-colors hover:text-[#f0d79b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c265]"
                      >
                        <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Abrir sala virtual
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <SessionCountdown dataHora={session.dataHora} />
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 font-serif text-sm text-[#a88d61]">
                    {isMestre
                      ? 'Nenhuma sessão agendada — a mesa ainda não tem contagem regressiva nem pauta.'
                      : 'O Mestre ainda não agendou a próxima sessão. A pauta e a contagem regressiva aparecerão aqui.'}
                  </p>
                  {isMestre && (
                    <ToolbarButton
                      id="btn-agendar-nova-sessao"
                      variant="primary"
                      icon={<CalendarClock className="h-3.5 w-3.5" />}
                      onClick={openScheduleModal}
                    >
                      Agendar sessão
                    </ToolbarButton>
                  )}
                </div>
              )}
            </PainelSecao>

            <PainelSecao
              icon={<ScrollText className="h-4 w-4" />}
              title="Atalhos"
              contentClassName="p-2.5"
            >
              <ul className="space-y-1">
                {atalhos.map((atalho) => (
                  <li key={atalho.id}>
                    <Link
                      to={atalho.to}
                      className="group flex items-center gap-3 rounded-xs border border-transparent px-2.5 py-2.5 transition-colors hover:border-[#4b3823] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                    >
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs border border-[#4b3823] bg-[#1d140c] text-[#c6a66d] transition-colors group-hover:border-[#8c6b41] group-hover:text-[#f3dfaa]"
                      >
                        {atalho.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba] group-hover:text-[#f3dfaa]">
                          {atalho.label}
                        </span>
                        <span className="block truncate font-serif text-[11px] italic text-[#8f795e]">{atalho.hint}</span>
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="h-4 w-4 shrink-0 text-[#7d6a56] transition-colors group-hover:text-[#d1a85a]"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </PainelSecao>
          </div>
        </div>
      </PageShell>

      {isMestre && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => { if (!isSavingSessao) closeScheduleModal(); }}
          title={modoEdicao ? 'Editar Sessão' : 'Agendar Nova Sessão'}
          subtitle={modoEdicao ? 'Ajuste a data, a pauta ou a sala virtual' : 'Convide a companhia para o próximo capítulo'}
          maxWidth="max-w-[680px]"
        >
          <form onSubmit={handleScheduleSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Data e Hora</span>
                <input
                  required
                  type="datetime-local"
                  value={sessionForm.dataHora}
                  min={toDatetimeLocal(new Date(Date.now() + 60000))}
                  onChange={(event) => updateSessionForm('dataHora', event.target.value)}
                  className={fieldClassName}
                  aria-describedby="schedule-form-error"
                />
              </label>
              <label className="space-y-1.5">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Título da Sessão</span>
                <input
                  required
                  type="text"
                  value={sessionForm.titulo}
                  onChange={(event) => updateSessionForm('titulo', event.target.value)}
                  className={fieldClassName}
                  aria-describedby="schedule-form-error"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Pauta / Preparação</span>
              <textarea
                required
                value={sessionForm.pauta}
                onChange={(event) => updateSessionForm('pauta', event.target.value)}
                className={`${fieldClassName} min-h-[120px] resize-y`}
                aria-describedby="schedule-form-error"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center gap-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]"><Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Link do Servidor de Voz / VTT (opcional)</span>
              <input
                type="url"
                value={sessionForm.linkVtt}
                onChange={(event) => updateSessionForm('linkVtt', event.target.value)}
                className={fieldClassName}
                aria-describedby="schedule-form-error"
              />
            </label>

            {formError && <p id="schedule-form-error" role="alert" className="border border-[#7f3d2d] bg-[#2a110d] px-3 py-2 font-serif text-sm text-[#f0b09b]">{formError}</p>}

            <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
              <button
                type="button"
                disabled={isSavingSessao}
                onClick={closeScheduleModal}
                className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c265] disabled:opacity-50"
              >
                Cancelar
              </button>
              <GothicButton
                type="submit"
                size="sm"
                width={190}
                height={38}
                disabled={isSavingSessao}
                icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
                className="max-w-full focus-visible:ring-2 focus-visible:ring-[#f0c265]"
              >
                {isSavingSessao ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Agendar Sessão'}
              </GothicButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default DashboardPage;
