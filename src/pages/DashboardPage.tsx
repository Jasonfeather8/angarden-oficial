import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  CalendarClock,
  Clock3,
  ExternalLink,
  FileText,
  Link2,
  LayoutDashboard,
  ScrollText,
  Shield,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import { GothicButton } from '../components/GothicButton';
import { PageShell } from '../components/PageShell';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { useSessionStore } from '../store/useSessionStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { useAsyncData } from '../hooks/useAsyncData';
import { ROLE_LABELS } from '../auth/policies';
import { cacheKeys } from '../services/cacheKeys';
import { scheduleService } from '../services/scheduleService';
import { ROUTES } from '../routes/paths';

type Chronicle = {
  id: string;
  titulo: string;
  dataSessao: string;
  capa: string;
  relato: string;
};

type SessionForm = {
  dataHora: string;
  titulo: string;
  pauta: string;
  linkVtt: string;
};

// O mural fica vazio até existirem crônicas oficiais; o conteúdo anterior era material de demonstração.
const chronicles: Chronicle[] = [];

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

const formatChronicleDate = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="min-w-[52px] border border-[#5a4225] bg-[#100a06] px-2 py-2 text-center">
    <div className="font-cinzel text-lg font-bold text-[#f0c265]">{String(value).padStart(2, '0')}</div>
    <div className="font-cinzel text-[8px] uppercase tracking-wider text-[#a88d61]">{label}</div>
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
    <div className="border border-[#70552f] bg-[#1b120b] p-3 lg:min-w-[300px]" aria-label="Contagem regressiva para a próxima sessão">
      <p className="mb-2 flex items-center justify-center gap-1.5 font-cinzel text-[10px] uppercase tracking-[0.16em] text-[#b89558]">
        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
        {hasSessionStarted ? 'Sessão em andamento' : 'A mesa começa em'}
      </p>
      {hasSessionStarted ? (
        <p className="text-center font-serif text-sm italic text-[#e0bd71]">Confira os registros da campanha após a aventura.</p>
      ) : (
        <div className="flex justify-center gap-1.5 sm:gap-2">
          <CountdownUnit value={countdown.days} label="dias" />
          <CountdownUnit value={countdown.hours} label="horas" />
          <CountdownUnit value={countdown.minutes} label="min" />
          <CountdownUnit value={countdown.seconds} label="seg" />
        </div>
      )}
    </div>
  );
});

/**
 * Cartão do mural. A capa vem de um CDN externo e só é buscada quando o mural
 * se aproxima da tela, então o cartão mostra a silhueta no lugar da moldura
 * vazia e revela a imagem quando ela chega.
 */
const ChronicleCard: React.FC<{ chronicle: Chronicle; onOpen: (chronicle: Chronicle) => void }> = ({
  chronicle,
  onOpen,
}) => {
  const [capaCarregada, setCapaCarregada] = useState(false);

  const revelarCapa = () => setCapaCarregada(true);

  return (
    <button
      type="button"
      onClick={() => onOpen(chronicle)}
      className="group overflow-hidden border border-[#4b3823] bg-[#120d09] text-left transition-all hover:border-[#b89558] hover:shadow-[0_0_16px_rgba(184,149,88,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c265]"
      aria-label={`Abrir crônica ${chronicle.titulo}`}
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-[#4b3823] bg-[#21130b]">
        {!capaCarregada && <Skeleton className="absolute inset-0 h-full w-full" />}
        <img
          ref={(node) => {
            // Imagem já em cache pode completar antes do evento de load.
            if (node?.complete) revelarCapa();
          }}
          src={chronicle.capa}
          alt={`Capa da crônica ${chronicle.titulo}`}
          loading="lazy"
          decoding="async"
          onLoad={revelarCapa}
          onError={revelarCapa}
          className={clsx(
            'h-full w-full object-cover transition-all duration-300 group-hover:scale-105',
            capaCarregada ? 'opacity-75' : 'opacity-0'
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090403] via-transparent to-[#1b0d05]/20" />
        <span className="absolute bottom-2 left-3 font-cinzel text-[10px] uppercase tracking-wider text-[#f0d79b]">Ler capítulo</span>
      </div>
      <div className="p-3">
        <h3 className="font-cinzel text-sm font-bold uppercase leading-tight text-[#e0c787]">{chronicle.titulo}</h3>
        <p className="mt-1 font-serif text-xs italic text-[#927754]">{formatChronicleDate(chronicle.dataSessao)}</p>
        <p className="mt-2 line-clamp-2 font-serif text-sm leading-relaxed text-[#c4b9a3]">{chronicle.relato}</p>
      </div>
    </button>
  );
};

export const DashboardPage: React.FC = () => {
  const user = useSessionStore((state) => state.session?.user ?? null);
  const { role, isMestre } = useAuthorization();
  const navigate = useNavigate();
  const { data: session, isLoading: isLoadingSessao, error: erroSessao, reload: reloadSessao } = useAsyncData(
    () => scheduleService.getProximaSessao(),
    [],
    { cacheKey: cacheKeys.proximaSessao(user?.tenant_id) }
  );
  const [isScheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [isSavingSessao, setIsSavingSessao] = useState(false);
  const [selectedChronicle, setSelectedChronicle] = useState<Chronicle | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionForm>({
    dataHora: '',
    titulo: '',
    pauta: '',
    linkVtt: '',
  });
  const [formError, setFormError] = useState('');

  const openScheduleModal = () => {
    setSessionForm({ dataHora: '', titulo: '', pauta: '', linkVtt: '' });
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

  return (
      <PageShell id="page-dashboard" variant="padrao"
        title={
          <h2 className="flex items-center gap-2 text-xl font-bold font-cinzel tracking-wider text-[#e6ddc5] uppercase">
            <LayoutDashboard className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Início / Dashboard Geral
          </h2>
        }
        subtitle="Visão panorâmica da campanha e status do reino"
        headerRight={<div className="text-xs text-[#8c6b41] italic font-serif">Reino de Angarden</div>}
        contentClassName="p-3 sm:p-5 lg:p-6"
      >
        <div className="space-y-6">
          <section aria-labelledby="quick-status-title" className="border border-[#5a4225] bg-gradient-to-r from-[#1c130c] via-[#120c08] to-[#1c130c] p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#8c6b41] bg-[#0d0906] shadow-[0_0_14px_rgba(168,141,97,0.2)]">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={`Retrato de ${user.nome_completo}`} className="h-full w-full object-cover" />
                  ) : (
                    <Users className="h-6 w-6 text-[#a88d61]" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <p id="quick-status-title" className="font-cinzel text-[10px] font-bold uppercase tracking-[0.18em] text-[#b89558]">Status rápido</p>
                  <h3 className="truncate font-cinzel text-lg font-bold text-[#f0e2c0]">{user?.nome_completo ?? 'Aventureiro'}</h3>
                  <p className="flex items-center gap-1.5 font-serif text-sm italic text-[#a89071]">
                    <Shield className="h-3.5 w-3.5 text-[#c6a35e]" aria-hidden="true" />
                    Papel: {role ? ROLE_LABELS[role] : '—'}
                  </p>
                </div>
              </div>
              <GothicButton
                id="btn-ver-meus-personagens"
                type="button"
                size="sm"
                width={220}
                height={40}
                icon={<Users className="h-4 w-4" aria-hidden="true" />}
                onClick={() => navigate(ROUTES.personagens)}
                aria-label="Ver meus personagens"
                className="max-w-full focus-visible:ring-2 focus-visible:ring-[#f0c265] focus-visible:ring-offset-2 focus-visible:ring-offset-[#120c08]"
              >
                Ver Meus Personagens
              </GothicButton>
            </div>
          </section>

          <section aria-labelledby="next-session-title" className="border border-[#4b3823] bg-[#100b07]/90 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 border-b border-[#3a2c1d] pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div aria-live="polite">
                <p className="flex items-center gap-2 font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  Próxima sessão
                </p>
                {isLoadingSessao ? (
                  <div aria-hidden="true" className="mt-1 space-y-1">
                    <Skeleton className="h-6 w-52 max-w-full" />
                    <Skeleton className="h-4 w-60 max-w-full" />
                  </div>
                ) : session ? (
                  <>
                    <h3 id="next-session-title" className="mt-1 font-cinzel text-xl font-bold text-[#f0d79b]">{session.titulo}</h3>
                    <p className="mt-1 font-serif text-sm capitalize italic text-[#b39a78]">{formatSessionDate(session.dataHora)}</p>
                  </>
                ) : !isLoadingSessao && !erroSessao ? (
                  <h3 id="next-session-title" className="mt-1 font-cinzel text-xl font-bold text-[#a88d61]">
                    Nenhuma sessão agendada
                  </h3>
                ) : null}
              </div>
              {isMestre && (
                <GothicButton
                  id="btn-agendar-nova-sessao"
                  type="button"
                  size="sm"
                  width={205}
                  height={38}
                  icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
                  onClick={openScheduleModal}
                  aria-label="Agendar nova sessão"
                  className="max-w-full focus-visible:ring-2 focus-visible:ring-[#f0c265] focus-visible:ring-offset-2 focus-visible:ring-offset-[#100b07]"
                >
                  Agendar Nova Sessão
                </GothicButton>
              )}
            </div>

            {isLoadingSessao ? (
              <div role="status" aria-live="polite">
                <span className="sr-only">Carregando a sessão agendada…</span>
                <SessaoSkeleton />
              </div>
            ) : erroSessao ? (
              <ErrorState description={erroSessao} onRetry={reloadSessao} />
            ) : session ? (
              <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="mb-2 flex items-center gap-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#a88d61]">
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" /> Pauta da mesa
                  </p>
                  <p className="font-serif text-base leading-relaxed text-[#d6c4ae]">{session.pauta}</p>
                  {session.linkVtt && (
                    <a
                      href={session.linkVtt}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#d1a85a] underline decoration-[#70552f] underline-offset-4 transition-colors hover:text-[#f0d79b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c265]"
                    >
                      <Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Abrir sala virtual <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  )}
                </div>
                <SessionCountdown dataHora={session.dataHora} />
              </div>
            ) : (
              <EmptyState
                icon={<CalendarClock className="h-8 w-8" aria-hidden="true" />}
                title="Nenhuma sessão agendada"
                description={
                  isMestre
                    ? 'Agende a próxima sessão para que a mesa acompanhe a contagem regressiva, a pauta e a sala virtual.'
                    : 'Aguarde o Mestre agendar a próxima sessão. A pauta e a contagem regressiva aparecerão aqui.'
                }
              />
            )}
          </section>

          <section aria-labelledby="chronicles-title">
            <div className="mb-3 flex items-end justify-between border-b border-[#3a2c1d] pb-2">
              <div>
                <p id="chronicles-title" className="flex items-center gap-2 font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">
                  <ScrollText className="h-4 w-4" aria-hidden="true" />
                  Mural de Crônicas
                </p>
                <p className="mt-1 font-serif text-xs italic text-[#80613d]">Os capítulos mais recentes da campanha</p>
              </div>
              <BookOpen className="h-5 w-5 text-[#8c6b41]" aria-hidden="true" />
            </div>
            {chronicles.length === 0 ? (
              <EmptyState
                title="Nenhuma crônica publicada"
                description={
                  isMestre
                    ? 'Escreva o primeiro relato na tela de Crônicas.'
                    : 'Quando a primeira sessão for narrada, os capítulos aparecerão aqui.'
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {chronicles.slice(0, 3).map((chronicle) => (
                  <ChronicleCard key={chronicle.id} chronicle={chronicle} onOpen={setSelectedChronicle} />
                ))}
              </div>
            )}
          </section>
        </div>

      {isMestre && (
        <Modal
          isOpen={isScheduleModalOpen}
          onClose={() => { if (!isSavingSessao) closeScheduleModal(); }}
          title="Agendar Nova Sessão"
          subtitle="Convide a companhia para o próximo capítulo"
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
                Agendar Sessão
              </GothicButton>
            </div>
          </form>
        </Modal>
      )}

      <Modal
        isOpen={Boolean(selectedChronicle)}
        onClose={() => setSelectedChronicle(null)}
        title={selectedChronicle?.titulo}
        subtitle={selectedChronicle ? formatChronicleDate(selectedChronicle.dataSessao) : undefined}
        maxWidth="max-w-[760px]"
      >
        {selectedChronicle && (
          <article aria-labelledby="chronicle-modal-title" className="space-y-4">
            <div className="overflow-hidden border border-[#8c6b41] bg-[#1b120b]">
              <img
                src={selectedChronicle.capa}
                alt={`Capa da crônica ${selectedChronicle.titulo}`}
                loading="lazy"
                decoding="async"
                className="max-h-[260px] w-full object-cover opacity-80"
              />
            </div>
            <div className="border-[6px] border-[#6e4b2b] bg-[#d3b47b] p-1 shadow-[inset_0_0_22px_rgba(76,42,16,0.55),0_8px_18px_rgba(0,0,0,0.45)]">
              <div className="border border-[#8d6539] bg-[#e2c995] px-5 py-5 text-[#3d2717] shadow-[inset_0_0_16px_rgba(105,63,24,0.3)] sm:px-8 sm:py-7">
                <h3 id="chronicle-modal-title" className="mb-4 border-b border-[#8d6539]/70 pb-3 text-center font-cinzel text-lg font-bold uppercase tracking-wider text-[#4b2e18]">{selectedChronicle.titulo}</h3>
                {selectedChronicle.relato.split('\n\n').map((paragraph, index) => (
                  <p key={`${selectedChronicle.id}-paragraph-${index}`} className="mb-4 last:mb-0 font-garamond text-lg leading-relaxed first-letter:float-left first-letter:mr-1 first-letter:font-cinzel first-letter:text-4xl first-letter:font-bold first-letter:text-[#70431f]">{paragraph}</p>
                ))}
              </div>
            </div>
          </article>
        )}
      </Modal>
      </PageShell>
  );
};

const SessaoSkeleton: React.FC = () => (
  <div aria-hidden="true" className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
    <div>
      <Skeleton className="mb-2 h-3 w-32" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
    <div className="border border-[#70552f] bg-[#1b120b] p-3 lg:min-w-[300px]">
      <Skeleton className="mx-auto mb-2 h-3 w-28" />
      <div className="flex justify-center gap-1.5 sm:gap-2">
        <Skeleton className="h-12 w-[52px]" />
        <Skeleton className="h-12 w-[52px]" />
        <Skeleton className="h-12 w-[52px]" />
        <Skeleton className="h-12 w-[52px]" />
      </div>
    </div>
  </div>
);

export default DashboardPage;
