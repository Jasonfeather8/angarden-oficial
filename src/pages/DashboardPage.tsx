import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  Crown,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Link2,
  ListChecks,
  Lock,
  Pencil,
  ScrollText,
  ShoppingBag,
  Sparkles,
  Store,
  Swords,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wand2,
} from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { CardAventureiroMesa } from '../components/CardAventureiroMesa';
import { PageShell } from '../components/PageShell';
import { Modal } from '../components/Modal';
import { PainelSecao } from '../components/ui/PainelSecao';
import { PlacaMetrica } from '../components/ui/PlacaMetrica';
import { ToolbarButton } from '../components/ui/ToolbarButton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { BarraProgresso } from '../components/ui/BarraProgresso';
import { grimorioAllSchools } from '../mocks/grimorio';
import { useSessionStore } from '../store/useSessionStore';
import { useAppStore } from '../store/useAppStore';
import { useAuthorization } from '../hooks/useAuthorization';
import { useAsyncData } from '../hooks/useAsyncData';
import { cacheKeys } from '../services/cacheKeys';
import { cronicaService } from '../services/cronicaService';
import { scheduleService } from '../services/scheduleService';
import { tenantService } from '../services/tenantService';
import { fichaService } from '../services/fichaService';
import { profileService } from '../services/profileService';
import { contarMagias, listarProgressoArcano } from '../services/grimorioService';
import { mercadoService } from '../services/mercadoService';
import { grimorioBloqueioService } from '../services/grimorioBloqueioService';
import type { PerfilConta } from '../types';
import { cronicaPath, fichaPath, ROUTES } from '../routes/paths';

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

const contar = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;
const formatarNumero = (valor: number) => new Intl.NumberFormat('pt-BR').format(valor);
const formatarQuando = (iso: string) => {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';

  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const diaDaEntrada = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(data);
  if (diaDaEntrada.getTime() === hoje.getTime()) return `Hoje às ${hora}`;
  hoje.setDate(hoje.getDate() - 1);
  if (diaDaEntrada.getTime() === hoje.getTime()) return `Ontem às ${hora}`;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(data);
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
    <div className="mt-1 font-cinzel text-[9px] uppercase tracking-wider text-[#a88d61]">{label}</div>
  </div>
);

const SessionCountdown = React.memo(({ dataHora }: { dataHora: string }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const alvo = Date.parse(dataHora);
    if (alvo <= Date.now()) return;

    const intervalId = window.setInterval(() => {
      if (alvo <= Date.now()) window.clearInterval(intervalId);
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [dataHora]);

  const countdown = formatCountdown(Date.parse(dataHora) - now);
  const hasSessionStarted = Date.parse(dataHora) <= now;

  return (
    <div
      role="timer"
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
  const { isMestre, tenantId, userId, role } = useAuthorization();
  const navigate = useNavigate();
  const lastCharacterId = useAppStore((state) => state.lastCharacterId);
  const papelMestre = isMestre || role === 'admin';

  const resumoQuery = useAsyncData(
    () => fichaService.getResumoDaMesa(),
    [tenantId],
    { cacheKey: cacheKeys.mestreResumo(tenantId), enabled: Boolean(tenantId) }
  );
  const limitesQuery = useAsyncData<{ perfis: PerfilConta[]; contagens: Record<string, number> }>(
    async () => {
      const [perfis, contagens] = await Promise.all([
        profileService.listarDoCliente(tenantId as string),
        fichaService.contarFichasPorJogador(),
      ]);
      return { perfis, contagens };
    },
    [tenantId],
    { cacheKey: cacheKeys.limitesDeFichas(tenantId), enabled: papelMestre && Boolean(tenantId) }
  );
  const limiteQuery = useAsyncData(
    () => userId ? profileService.getLimiteFichas(userId) : Promise.resolve(10),
    [userId],
    { cacheKey: cacheKeys.limiteFichasDoJogador(userId), enabled: !papelMestre && Boolean(userId) }
  );
  const bloqueiosQuery = useAsyncData(
    () => grimorioBloqueioService.listar(),
    [tenantId],
    { cacheKey: cacheKeys.grimorioBloqueios(tenantId), enabled: Boolean(tenantId) }
  );
  const catalogoQuery = useAsyncData(
    async () => {
      const [magias, mercadorias] = await Promise.all([contarMagias(), mercadoService.contarItens()]);
      return { magias, mercadorias };
    },
    [tenantId, role],
    { cacheKey: cacheKeys.catalogoDoReino(`${tenantId ?? ''}:${role ?? ''}`), enabled: Boolean(tenantId) }
  );

  const mesaResumo = useMemo(() => resumoQuery.data ?? [], [resumoQuery.data]);
  const fichasVisiveis = useMemo(
    () => papelMestre ? mesaResumo : mesaResumo.filter((item) => item.ownerId === userId),
    [mesaResumo, papelMestre, userId]
  );
  const idsArcanos = useMemo(() => fichasVisiveis.map((ficha) => ficha.id).join(','), [fichasVisiveis]);
  const arcanoQuery = useAsyncData(
    () => listarProgressoArcano(papelMestre ? undefined : fichasVisiveis.map((ficha) => ficha.id)),
    [tenantId, papelMestre, idsArcanos],
    {
      cacheKey: cacheKeys.progressoArcano(`${tenantId ?? ''}:${userId ?? ''}`),
      enabled: Boolean(tenantId) && (papelMestre || fichasVisiveis.length > 0),
    }
  );
  const novidadesQuery = useAsyncData(
    () => mercadoService.listarNovidades(6),
    [],
    { cacheKey: cacheKeys.mercadoNovidades() }
  );
  const cronicasQuery = useAsyncData(
    () => cronicaService.listarRecentes(3),
    [tenantId],
    { cacheKey: cacheKeys.cronicasRecentes(tenantId), enabled: Boolean(tenantId) }
  );
  const progressoPorFicha = useMemo(() => {
    const progressoMap = new Map((arcanoQuery.data ?? []).map((progresso) => [progresso.characterId, progresso]));
    return fichasVisiveis.map((ficha) => ({
      ...ficha,
      progresso: progressoMap.get(ficha.id) ?? { characterId: ficha.id, aprendidas: 0, porEscola: {} as Record<string, number> },
    })).sort((a, b) => b.progresso.aprendidas - a.progresso.aprendidas || a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [fichasVisiveis, arcanoQuery.data]);
  const nomesPorEscola = useMemo(
    () => new Map(grimorioAllSchools.map((escola) => [escola.id, escola.name])),
    []
  );
  const jogadores = useMemo(
    () => (limitesQuery.data?.perfis ?? []).filter((perfil) => perfil.role !== 'admin'),
    [limitesQuery.data?.perfis]
  );
  const contagens = useMemo(() => limitesQuery.data?.contagens ?? {}, [limitesQuery.data?.contagens]);
  const nomesPorJogador = useMemo(
    () => new Map(jogadores.map((perfil) => [perfil.id, perfil.nome_completo])),
    [jogadores]
  );
  const idsDoHistorico = useMemo(() => fichasVisiveis.map((ficha) => ficha.id).join(','), [fichasVisiveis]);
  const nomesPorFicha = useMemo(
    () => new Map(mesaResumo.map((ficha) => [ficha.id, ficha.nome])),
    [mesaResumo]
  );
  const historicoQuery = useAsyncData(
    () => fichaService.listarHistoricoXp({
      characterIds: papelMestre ? undefined : fichasVisiveis.map((ficha) => ficha.id),
      limite: 6,
    }),
    [tenantId, papelMestre, idsDoHistorico],
    {
      cacheKey: cacheKeys.historicoXp(`${tenantId ?? ''}:${userId ?? ''}`),
      enabled: Boolean(tenantId) && (papelMestre || fichasVisiveis.length > 0),
    }
  );
  const continuar = useMemo(
    () => fichasVisiveis.find((item) => item.id === lastCharacterId) ?? (fichasVisiveis.length === 1 ? fichasVisiveis[0] : null),
    [fichasVisiveis, lastCharacterId]
  );
  const partesSeladas = useMemo(() => {
    const escolas = bloqueiosQuery.data?.escolas.length ?? 0;
    const tomos = bloqueiosQuery.data?.volumes.length ?? 0;
    return [escolas ? contar(escolas, 'escola', 'escolas') : '', tomos ? contar(tomos, 'tomo', 'tomos') : ''].filter(Boolean);
  }, [bloqueiosQuery.data]);
  const nivelMaisAlto = useMemo(() => Math.max(0, ...fichasVisiveis.map((ficha) => ficha.nivel)), [fichasVisiveis]);
  const tesouroTotal = useMemo(() => fichasVisiveis.reduce((total, ficha) => total + ficha.dinheiro, 0), [fichasVisiveis]);
  const pendencias = useMemo(() => {
    const itens: Array<{ id: string; texto: string; icon: React.ReactNode; acao: string; to: string }> = [];
    const semEdicao = fichasVisiveis.filter((ficha) => !ficha.edicaoLiberada).length;
    if (semEdicao > 0) {
      itens.push({
        id: 'sem-edicao',
        texto: papelMestre ? `${contar(semEdicao, 'ficha', 'fichas')} sem edição liberada` : `${contar(semEdicao, 'ficha sua', 'fichas suas')} sem edição liberada`,
        icon: <Pencil className="h-3.5 w-3.5" />,
        acao: papelMestre ? 'Ajustar permissões' : 'Ver fichas',
        to: papelMestre ? ROUTES.painelMestre : ROUTES.personagens,
      });
    }
    if (papelMestre) {
      const noTeto = jogadores.filter((perfil) => (contagens[perfil.id] ?? 0) >= (perfil.limite_fichas ?? 10)).length;
      const semFicha = jogadores.filter((perfil) => (contagens[perfil.id] ?? 0) === 0).length;
      if (noTeto > 0) itens.push({ id: 'teto-fichas', texto: `${contar(noTeto, 'jogador', 'jogadores')} no teto de fichas`, icon: <Users className="h-3.5 w-3.5" />, acao: 'Ajustar limites', to: ROUTES.painelMestre });
      if (semFicha > 0) itens.push({ id: 'sem-ficha', texto: `${contar(semFicha, 'jogador', 'jogadores')} ainda sem ficha criada`, icon: <UserPlus className="h-3.5 w-3.5" />, acao: 'Ver jogadores', to: ROUTES.painelMestre });
    } else {
      if (limiteQuery.data !== null && fichasVisiveis.length >= (limiteQuery.data ?? 10)) {
        itens.push({ id: 'limite-atingido', texto: `Limite de ${contar(limiteQuery.data ?? 10, 'ficha', 'fichas')} atingido`, icon: <Users className="h-3.5 w-3.5" />, acao: 'Ver fichas', to: ROUTES.personagens });
      }
      if (partesSeladas.length) {
        itens.push({ id: 'grimorio-selado', texto: `O Mestre selou ${partesSeladas.join(' e ')} do Grimório`, icon: <Lock className="h-3.5 w-3.5" />, acao: 'Ver Grimório', to: ROUTES.grimorio });
      }
    }
    return itens;
  }, [fichasVisiveis, papelMestre, jogadores, contagens, limiteQuery.data, partesSeladas]);
  const erroPendencias = papelMestre
    ? resumoQuery.error || limitesQuery.error
    : resumoQuery.error || limiteQuery.error || bloqueiosQuery.error;
  const recarregarPendencias = () => {
    resumoQuery.reload();
    if (papelMestre) limitesQuery.reload();
    else {
      limiteQuery.reload();
      bloqueiosQuery.reload();
    }
  };

  const { data: session, isLoading: isLoadingSessao, error: erroSessao, reload: reloadSessao } = useAsyncData(
    () => scheduleService.getProximaSessao(),
    [tenantId],
    { cacheKey: cacheKeys.proximaSessao(tenantId), enabled: Boolean(tenantId) }
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

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-4">
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
                          <span className="sr-only"> (abre em nova aba)</span>
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
                id="companhia-titulo"
                icon={<Users className="h-4 w-4" />}
                title="A companhia"
                hint={papelMestre ? `${contar(fichasVisiveis.length, 'ficha', 'fichas')} na mesa` : `${contar(fichasVisiveis.length, 'ficha sua', 'fichas suas')}`}
                contentClassName="p-4"
              >
                {resumoQuery.isLoading ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando a companhia…</span>
                    <div className="grid gap-3 xl:grid-cols-2">
                      <Skeleton className="h-[190px] w-full" />
                      <Skeleton className="h-[190px] w-full" />
                    </div>
                  </div>
                ) : resumoQuery.error ? (
                  <ErrorState description={resumoQuery.error} onRetry={resumoQuery.reload} />
                ) : fichasVisiveis.length === 0 ? (
                  <EmptyState
                    variant="plano"
                    icon={<Users className="h-8 w-8" />}
                    title={papelMestre ? 'Nenhuma ficha na mesa' : 'Você ainda não tem ficha'}
                    description={papelMestre ? 'Quando os jogadores criarem personagens, eles aparecerão aqui.' : 'Crie seu primeiro aventureiro para começar a jornada.'}
                    action={
                      <ToolbarButton variant="primary" onClick={() => navigate(ROUTES.personagens)}>
                        {papelMestre ? 'Ir para Personagens' : 'Criar ficha'}
                      </ToolbarButton>
                    }
                  />
                ) : (
                  <div className="grid gap-3 xl:grid-cols-2">
                    {fichasVisiveis.map((item) => (
                      <CardAventureiroMesa
                        key={item.id}
                        aventureiro={{
                          ...item,
                          jogador: nomesPorJogador.get(item.ownerId ?? '') ?? null,
                          status: item.status ?? { vidaAtual: 0, vidaMax: 0, vigorAtual: 0, vigorMax: 0, north: 0 },
                        }}
                        onAbrirFicha={(id) => navigate(fichaPath(id))}
                      />
                    ))}
                  </div>
                )}
              </PainelSecao>

              <PainelSecao
                id="progresso-arcano-titulo"
                icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
                title="Progresso arcano"
                hint={papelMestre ? 'magias aprendidas na mesa' : 'suas magias aprendidas'}
                contentClassName="p-4"
              >
                {arcanoQuery.isLoading || resumoQuery.isLoading || catalogoQuery.isLoading ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando o progresso arcano…</span>
                    <div className="space-y-2">
                      <Skeleton className="h-[68px] w-full" />
                      <Skeleton className="h-[68px] w-full" />
                    </div>
                  </div>
                ) : arcanoQuery.error || resumoQuery.error || catalogoQuery.error ? (
                  <ErrorState
                    description={arcanoQuery.error ?? resumoQuery.error ?? catalogoQuery.error ?? ''}
                    onRetry={() => {
                      arcanoQuery.reload();
                      resumoQuery.reload();
                      catalogoQuery.reload();
                    }}
                  />
                ) : fichasVisiveis.length === 0 ? (
                  <EmptyState
                    variant="plano"
                    icon={<Wand2 className="h-8 w-8" aria-hidden="true" />}
                    title="Sem progresso arcano"
                    description={papelMestre ? 'As magias aprendidas de cada ficha aparecerão aqui.' : 'Aprenda magias no Grimório para acompanhar sua evolução aqui.'}
                  />
                ) : (
                  <ul className="space-y-2">
                    {progressoPorFicha.map((ficha) => {
                      const escolas = (Object.entries(ficha.progresso.porEscola) as Array<[string, number]>)
                        .sort((a, b) => b[1] - a[1])
                        .map(([id, quantidade]) => ({ nome: nomesPorEscola.get(id) ?? id, quantidade }));
                      const textoEscolas = escolas.length === 0
                        ? 'Nenhuma magia aprendida ainda'
                        : `${escolas.slice(0, 3).map((escola) => `${escola.nome} ${escola.quantidade}`).join(' · ')}${escolas.length > 3 ? ` · +${escolas.length - 3} ${escolas.length - 3 === 1 ? 'escola' : 'escolas'}` : ''}`;
                      return (
                        <li key={ficha.id} className="rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-3 py-2.5">
                          <p className="truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{ficha.nome}</p>
                          <BarraProgresso className="mt-1.5" rotulo="Magias aprendidas" atual={ficha.progresso.aprendidas} max={catalogoQuery.data?.magias ?? 0} limiarCritico={0} />
                          <span className="mt-1.5 block font-serif text-[11px] italic text-[#8f795e]">{textoEscolas}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PainelSecao>

              <PainelSecao
                id="mercado-titulo"
                icon={<Store className="h-4 w-4" aria-hidden="true" />}
                title="Novidades do Mercado"
                hint="últimas mercadorias do catálogo"
                contentClassName="p-4"
                extra={<ToolbarButton icon={<ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => navigate(ROUTES.mercado)}>Ver Mercado</ToolbarButton>}
              >
                {novidadesQuery.isLoading ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando as novidades do Mercado…</span>
                    <div className="space-y-2">
                      <Skeleton className="h-[60px] w-full" />
                      <Skeleton className="h-[60px] w-full" />
                      <Skeleton className="h-[60px] w-full" />
                    </div>
                  </div>
                ) : novidadesQuery.error ? (
                  <ErrorState description={novidadesQuery.error} onRetry={novidadesQuery.reload} />
                ) : (novidadesQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    variant="plano"
                    icon={<Store className="h-8 w-8" aria-hidden="true" />}
                    title="Catálogo vazio"
                    description="As mercadorias cadastradas no Mercado aparecerão aqui."
                  />
                ) : (
                  <ul className="space-y-2">
                    {(novidadesQuery.data ?? []).map((novidade) => {
                      const { item } = novidade;
                      return (
                        <li key={item.id} className="flex items-start gap-3 rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-3 py-2.5">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-[#5a4225] bg-[#241a11]">
                            {item.imagem_url ? (
                              <img src={item.imagem_url} alt={`Imagem de ${item.nome}`} loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              <Store className="h-4 w-4 text-[#c6a66d]" aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{item.nome}</p>
                              <span className="flex shrink-0 items-center gap-1 font-serif text-[11px] text-[#d8b86b]">
                                <Coins className="h-3 w-3" aria-hidden="true" />
                                {formatarNumero(item.preco)}
                                <span className="sr-only">moedas</span>
                              </span>
                            </div>
                            <p className="mt-0.5 font-serif text-[11px] italic text-[#8f795e]">
                              {item.is_epico ? 'Épico · ' : ''}{item.subcategoria || item.tipo || 'Mercadoria'} · {formatarQuando(novidade.criadoEm)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PainelSecao>

              <PainelSecao
                id="cronicas-titulo"
                icon={<ScrollText className="h-4 w-4" aria-hidden="true" />}
                title="Crônicas recentes"
                hint="relatos da mesa"
                contentClassName="p-4"
                extra={<ToolbarButton icon={<ScrollText className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => navigate(ROUTES.cronicas)}>Ver Crônicas</ToolbarButton>}
              >
                {cronicasQuery.isLoading ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando as crônicas recentes…</span>
                    <div className="space-y-2">
                      <Skeleton className="h-[60px] w-full" />
                      <Skeleton className="h-[60px] w-full" />
                      <Skeleton className="h-[60px] w-full" />
                    </div>
                  </div>
                ) : cronicasQuery.error ? (
                  <ErrorState description={cronicasQuery.error} onRetry={cronicasQuery.reload} />
                ) : (cronicasQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    variant="plano"
                    icon={<ScrollText className="h-8 w-8" aria-hidden="true" />}
                    title="Ainda não há crônicas"
                    description={papelMestre
                      ? 'Registre o primeiro relato na tela de Crônicas para guardar as memórias da mesa.'
                      : 'O relato aparecerá aqui quando a primeira sessão for narrada.'}
                  />
                ) : (
                  <ul className="space-y-2">
                    {(cronicasQuery.data ?? []).slice(0, 3).map((cronica) => (
                      <li key={cronica.id}>
                        <Link
                          to={cronicaPath(cronica.id)}
                          className="flex items-start gap-3 rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-3 py-2.5 transition-colors hover:border-[#5a4225] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-[#5a4225] bg-[#241a11]">
                            {cronica.capaUrl ? (
                              <img src={cronica.capaUrl} alt={`Capa da crônica ${cronica.titulo}`} loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              <ScrollText className="h-4 w-4 text-[#c6a66d]" aria-hidden="true" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{cronica.titulo}</span>
                              {cronica.status === 'AGENDADA' && (
                                <span className="shrink-0 rounded-xs border border-[#5a4225] px-1.5 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#d8b86b]">
                                  Agendada{cronica.agendadaPara ? ` · ${formatSessionDate(cronica.agendadaPara)}` : ''}
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block font-serif text-[11px] text-[#d8b86b]">
                              {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${cronica.dataAventura}T00:00:00Z`))}
                            </span>
                            <span className="mt-0.5 line-clamp-2 font-serif text-[11px] italic text-[#8f795e]">{cronica.relato}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </PainelSecao>
            </div>

            <div className="space-y-4">
              <PainelSecao
                id="continuar-titulo"
                icon={<Bookmark className="h-4 w-4" />}
                title="Continuar de onde parei"
                contentClassName="p-3.5"
              >
                {resumoQuery.isLoading ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando o último personagem…</span>
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : resumoQuery.error ? (
                  <ErrorState description={resumoQuery.error} onRetry={resumoQuery.reload} />
                ) : continuar ? (
                  <div className="space-y-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-[#5a4225] bg-[#241a11]">
                        {continuar.imagemUrl ? (
                          <img src={continuar.imagemUrl} alt={`Retrato de ${continuar.nome}`} className="h-full w-full object-cover" />
                        ) : (
                          <span aria-hidden="true" className="font-cinzel text-lg font-bold text-[#c6a66d]">{continuar.nome.trim().charAt(0).toUpperCase() || '?'}</span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-cinzel text-sm font-bold text-[#e6ddc5]">{continuar.nome}</p>
                        <p className="font-serif text-[11px] text-[#a88d61]">Nível {continuar.nivel} · {formatarNumero(continuar.xp)} XP</p>
                      </div>
                    </div>
                    <ToolbarButton variant="primary" className="w-full justify-center" icon={<ScrollText className="h-3.5 w-3.5" />} onClick={() => navigate(fichaPath(continuar.id))} aria-label={`Abrir ficha de ${continuar.nome}`}>
                      Abrir ficha
                    </ToolbarButton>
                  </div>
                ) : (
                  <p className="font-serif text-xs text-[#8f795e]">Abra uma ficha e ela ficará aqui para retomar a jornada.</p>
                )}
              </PainelSecao>

              <PainelSecao
                id="pendencias-titulo"
                icon={<ListChecks className="h-4 w-4" />}
                title="Pendências"
                contentClassName="p-3.5"
              >
                {resumoQuery.isLoading || (papelMestre ? limitesQuery.isLoading : limiteQuery.isLoading || bloqueiosQuery.isLoading) ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando as pendências…</span>
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                ) : erroPendencias ? (
                  <ErrorState description={erroPendencias} onRetry={recarregarPendencias} />
                ) : pendencias.length ? (
                  <ul className="space-y-2">
                    {pendencias.map((pendencia) => (
                      <li key={pendencia.id} className="flex items-start gap-2.5 rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-2.5 py-2.5">
                        <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-[#4b3823] bg-[#1d140c] text-[#d1a85a]">{pendencia.icon}</span>
                        <div className="min-w-0">
                          <p className="font-serif text-[13px] leading-snug text-[#d6c4ae]">{pendencia.texto}</p>
                          <Link to={pendencia.to} className="mt-1 inline-flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#d1a85a] hover:text-[#f0d79b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]">
                            {pendencia.acao}
                            <ChevronRight className="h-3 w-3" aria-hidden="true" />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState variant="plano" icon={<CheckCircle2 className="h-8 w-8" />} title="Nada pendente" description={papelMestre ? 'A mesa está em ordem.' : 'Suas fichas estão em ordem.'} />
                )}
              </PainelSecao>

              <PainelSecao
                id="historico-xp-titulo"
                icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
                title="Histórico de XP"
                hint={papelMestre ? 'recompensas da mesa' : 'suas recompensas'}
                contentClassName="p-3.5"
                extra={papelMestre ? <ToolbarButton icon={<Award className="h-3.5 w-3.5" aria-hidden="true" />} onClick={() => navigate(ROUTES.painelMestre)}>Conceder XP</ToolbarButton> : undefined}
              >
                {historicoQuery.isLoading || resumoQuery.isLoading ? (
                  <div role="status" aria-live="polite">
                    <span className="sr-only">Carregando o histórico de XP…</span>
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </div>
                ) : historicoQuery.error || resumoQuery.error ? (
                  <ErrorState
                    description={historicoQuery.error ?? resumoQuery.error ?? ''}
                    onRetry={() => {
                      historicoQuery.reload();
                      resumoQuery.reload();
                    }}
                  />
                ) : (historicoQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    variant="plano"
                    icon={<Sparkles className="h-8 w-8" aria-hidden="true" />}
                    title="Sem recompensas ainda"
                    description={papelMestre ? 'Quando você conceder XP, o registro aparecerá aqui.' : 'As recompensas concedidas pelo Mestre aparecerão aqui.'}
                  />
                ) : (
                  <ul className="space-y-2">
                    {(historicoQuery.data ?? []).map((entrada) => {
                      const nome = nomesPorFicha.get(entrada.characterId) ?? 'Aventureiro';
                      const autor = entrada.grantedBy === userId
                        ? 'você'
                        : entrada.grantedBy ? nomesPorJogador.get(entrada.grantedBy) : undefined;
                      const quando = formatarQuando(entrada.createdAt);
                      return (
                        <li key={entrada.id}>
                          <Link
                            to={fichaPath(entrada.characterId)}
                            className="block rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-2.5 py-2.5 transition-colors hover:border-[#5a4225] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                          >
                            <span className="flex items-start justify-between gap-2">
                              <span className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{nome}</span>
                              <span className="shrink-0 font-cinzel text-[11px] font-bold text-[#e0c98e]">+{formatarNumero(entrada.amount)} XP</span>
                            </span>
                            <span className="mt-1 block font-serif text-[12px] leading-snug text-[#d6c4ae]">{entrada.reason}</span>
                            <span className="mt-0.5 block font-serif text-[10px] text-[#8f795e]">
                              {quando}{papelMestre && autor ? ` · por ${autor}` : ''}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </PainelSecao>

              <PainelSecao id="atalhos-titulo" icon={<ScrollText className="h-4 w-4" />} title="Atalhos" contentClassName="p-2.5">
                <ul className="space-y-1">
                  {atalhos.map((atalho) => (
                    <li key={atalho.id}>
                      <Link
                        to={atalho.to}
                        className="group flex items-center gap-3 rounded-xs border border-transparent px-2.5 py-2.5 transition-colors hover:border-[#4b3823] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                      >
                        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs border border-[#4b3823] bg-[#1d140c] text-[#c6a66d] transition-colors group-hover:border-[#8c6b41] group-hover:text-[#f3dfaa]">
                          {atalho.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba] group-hover:text-[#f3dfaa]">{atalho.label}</span>
                          <span className="block truncate font-serif text-[11px] italic text-[#8f795e]">{atalho.hint}</span>
                        </span>
                        <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7d6a56] transition-colors group-hover:text-[#d1a85a]" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </PainelSecao>
            </div>
          </div>

          <PainelSecao id="metricas-titulo" icon={<TrendingUp className="h-4 w-4" />} title="O reino em números" hint="métricas do cliente" contentClassName="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {(papelMestre ? [
                { rotulo: 'Fichas na mesa', icon: <Swords className="h-4 w-4" />, valor: fichasVisiveis.length, hint: 'no cliente', loading: resumoQuery.isLoading, error: resumoQuery.error },
                { rotulo: 'Jogadores', icon: <Users className="h-4 w-4" />, valor: jogadores.length, hint: 'contas no cliente', loading: limitesQuery.isLoading, error: limitesQuery.error },
                { rotulo: 'Magias no Grimório', icon: <BookOpen className="h-4 w-4" />, valor: catalogoQuery.data?.magias ?? 0, hint: 'catalogadas', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
                { rotulo: 'Mercadorias', icon: <Store className="h-4 w-4" />, valor: catalogoQuery.data?.mercadorias ?? 0, hint: 'no mercado global', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
                { rotulo: 'Conteúdo selado', icon: <Lock className="h-4 w-4" />, valor: (bloqueiosQuery.data?.escolas.length ?? 0) + (bloqueiosQuery.data?.volumes.length ?? 0), hint: partesSeladas.join(' · ') || 'nada selado', loading: bloqueiosQuery.isLoading, error: bloqueiosQuery.error },
              ] : [
                { rotulo: 'Suas fichas', icon: <Swords className="h-4 w-4" />, valor: fichasVisiveis.length, hint: limiteQuery.data !== null ? `limite de ${formatarNumero(limiteQuery.data ?? 10)} fichas` : '', loading: resumoQuery.isLoading, error: resumoQuery.error },
                { rotulo: 'Nível mais alto', icon: <Trophy className="h-4 w-4" />, valor: nivelMaisAlto, hint: 'entre suas fichas', loading: resumoQuery.isLoading, error: resumoQuery.error },
                { rotulo: 'Seu tesouro', icon: <Coins className="h-4 w-4" />, valor: tesouroTotal, hint: 'moedas somadas', loading: resumoQuery.isLoading, error: resumoQuery.error },
                { rotulo: 'Magias no Grimório', icon: <BookOpen className="h-4 w-4" />, valor: catalogoQuery.data?.magias ?? 0, hint: 'visíveis a você', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
                { rotulo: 'Mercadorias', icon: <Store className="h-4 w-4" />, valor: catalogoQuery.data?.mercadorias ?? 0, hint: 'no mercado global', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
              ]).map((metrica) => (
                <PlacaMetrica
                  key={metrica.rotulo}
                  icon={metrica.icon}
                  rotulo={metrica.rotulo}
                  valor={metrica.error ? '—' : metrica.loading ? <Skeleton className="h-5 w-10" /> : formatarNumero(metrica.valor)}
                  hint={metrica.error ? 'indisponível agora' : metrica.hint}
                />
              ))}
            </div>
          </PainelSecao>
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
