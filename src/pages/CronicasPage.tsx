import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  ImagePlus,
  MapPin,
  Plus,
  ScrollText,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { MedievalFrame } from '../components/MedievalFrame';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/Skeleton';
import { useAuthorization } from '../hooks/useAuthorization';
import { useAsyncData } from '../hooks/useAsyncData';
import { cacheKeys } from '../services/cacheKeys';
import { fichaService } from '../services/fichaService';

type ChronicleStatus = 'PUBLICADA' | 'AGENDADA';

type Chronicle = {
  id: string;
  title: string;
  date: string;
  summary: string;
  progress: number;
  characters: string[];
  location: string;
  status: ChronicleStatus;
  scheduledAt?: string;
  cover?: string;
};

// O catálogo fica vazio de propósito: os relatos oficiais ainda não foram escritos; o conteúdo anterior era material de demonstração, com crônicas inventadas e nomes de personagens de terceiros. A linha do tempo, o leitor e o formulário de criação já estão prontos para receber o conteúdo oficial.
const INITIAL_CHRONICLES: Chronicle[] = [];

const inputClassName =
  'w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2.5 text-sm text-[#e6ddc5] outline-none transition-colors placeholder:text-[#6f5c47] focus:border-[#b89558] focus:ring-1 focus:ring-[#b89558]/50';

const formatSessionDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));

const formatScheduledDate = (date: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

const ChronicleArtwork: React.FC<{ title: string; cover?: string }> = ({ title, cover }) => (
  <div className="relative aspect-[2/3] w-full overflow-hidden border border-[#70552f] bg-[#120b07] shadow-[0_14px_28px_rgba(0,0,0,0.65)]">
    {cover ? (
      <img src={cover} alt={`Capa da crônica ${title}`} className="absolute inset-0 h-full w-full object-cover opacity-75" />
    ) : (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_23%,#f0bb61_0%,#9e5520_25%,#32170d_58%,#090403_100%)]">
        <svg className="h-full w-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M0 355 78 300l84 35 90-60 72 30 76-44v339H0Z" fill="#271207" />
          <path d="M0 410 115 350l108 45 88-55 89 35v285H0Z" fill="#120804" />
          <path d="M-10 478 70 450l80 35 112-51 117 38 41-18v166H-10Z" fill="#050201" />
          <g fill="#080301">
            <path d="M87 321c12-33 56-35 84 2-6 34-16 69-19 105h-15l8-50h-25l-14 50H94l10-61c-16-11-22-25-17-46Z" />
            <path d="M151 314c10-28 27-49 39-36-7 18-15 31-25 45Z" />
            <path d="M126 286c-6-28 5-50 17-48 10 2 10 27 3 48Z" />
            <path d="M266 361c5-28 16-39 24-27 5 24 0 52-6 82h-13l5-30h-9l-8 30h-11Z" />
            <path d="m283 236-16 192" stroke="#080301" strokeWidth="4" />
            <path d="m283 226-6 15h12Z" />
          </g>
          <g fill="#d8a04b" opacity=".4">
            <circle cx="300" cy="122" r="2" />
            <circle cx="327" cy="96" r="1.5" />
            <circle cx="250" cy="154" r="1.5" />
          </g>
        </svg>
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-[#080302] via-transparent to-[#1b0d05]/20" />
    <div className="absolute inset-3 border border-[#d1a85a]/45" />
    <div className="absolute inset-x-6 top-7 text-center font-cinzel text-[9px] uppercase tracking-[0.28em] text-[#e3c77e] drop-shadow-[1px_1px_2px_#000]">
      Angarden
    </div>
    <div className="absolute inset-x-6 bottom-7 text-center">
      <p className="font-cinzel text-base font-bold uppercase leading-tight tracking-wider text-[#f0e2c0] drop-shadow-[1px_1px_2px_#000]">
        {title}
      </p>
      <div className="mx-auto mt-3 h-px w-20 bg-[#d1a85a]/70" />
    </div>
  </div>
);

export const CronicasPage: React.FC = () => {
  const { isAdmin, isMestre, tenantId } = useAuthorization();
  const isMaster = isAdmin || isMestre;
  const [chronicles, setChronicles] = useState<Chronicle[]>(INITIAL_CHRONICLES);
  const [selectedId, setSelectedId] = useState<string>(() => INITIAL_CHRONICLES[0]?.id ?? '');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const {
    data: personagensData,
    isLoading: isLoadingPersonagens,
    error: erroPersonagens,
    reload: reloadPersonagens,
  } = useAsyncData(() => fichaService.getListaPersonagens(), [tenantId], {
    cacheKey: cacheKeys.personagensResumo(tenantId),
    enabled: isCreateModalOpen && Boolean(tenantId),
  });
  const personagens = personagensData ?? [];
  const [expandedCharacters, setExpandedCharacters] = useState(true);
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [form, setForm] = useState({
    title: '',
    date: '',
    summary: '',
    progress: '0',
    location: '',
    scheduledAt: '',
    characters: [] as string[],
    cover: undefined as string | undefined,
  });

  const orderedChronicles = useMemo(
    () => [...chronicles].sort((a, b) => b.date.localeCompare(a.date)),
    [chronicles]
  );
  const selectedChronicle = orderedChronicles.find((chronicle) => chronicle.id === selectedId) ?? orderedChronicles[0];

  const resetForm = () => {
    setForm({
      title: '',
      date: '',
      summary: '',
      progress: '0',
      location: '',
      scheduledAt: '',
      characters: [],
      cover: undefined,
    });
    setPublishMode('now');
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    resetForm();
  };

  const updateForm = (field: 'title' | 'date' | 'summary' | 'progress' | 'location' | 'scheduledAt', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleCharacter = (character: string) => {
    setForm((current) => ({
      ...current,
      characters: current.characters.includes(character)
        ? current.characters.filter((item) => item !== character)
        : [...current.characters, character],
    }));
  };

  const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setForm((current) => ({ ...current, cover: URL.createObjectURL(file) }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newChronicle: Chronicle = {
      id: `cronica-${Date.now()}`,
      title: form.title.trim(),
      date: form.date,
      summary: form.summary.trim(),
      progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
      characters: form.characters,
      location: form.location.trim() || 'Local não registrado',
      status: publishMode === 'now' ? 'PUBLICADA' : 'AGENDADA',
      scheduledAt: publishMode === 'schedule' ? form.scheduledAt : undefined,
      cover: form.cover,
    };

    setChronicles((current) => [...current, newChronicle]);
    setSelectedId(newChronicle.id);
    closeCreateModal();
  };

  return (
    <div id="page-cronicas" className="w-full max-w-[1320px] mx-auto space-y-6">
      <MedievalFrame
        title={
          <h2 className="flex items-center gap-2 text-xl font-bold font-cinzel tracking-wider text-[#e6ddc5] uppercase">
            <ScrollText className="h-5 w-5 text-[#a88d61]" />
            Crônicas da Campanha
          </h2>
        }
        subtitle="Linha do tempo narrativa das sessões de Angarden"
        contentClassName="p-3 sm:p-5 lg:p-6"
        headerRight={
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
            <div className="hidden items-center gap-1.5 border border-[#5a4225] bg-[#1b120b] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#b89558] sm:flex">
              <FileText className="h-3.5 w-3.5" />
              {orderedChronicles.length} registros
            </div>
            {isMaster && (
              <GothicButton
                id="btn-nova-cronica"
                type="button"
                size="sm"
                width={170}
                height={38}
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateModalOpen(true)}
                aria-label="Criar nova crônica"
              >
                Nova Crônica
              </GothicButton>
            )}
          </div>
        }
      >
        {orderedChronicles.length === 0 || !selectedChronicle ? (
          <EmptyState
            title="Nenhuma crônica registrada"
            description={
              isMaster
                ? 'Registre o primeiro relato usando o botão “Nova Crônica” acima.'
                : 'Assim que a primeira sessão for narrada, o relato aparecerá aqui.'
            }
            className="border-none bg-transparent py-8 shadow-none"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(220px,0.85fr)_minmax(300px,1.35fr)_minmax(220px,0.8fr)]">
            <section aria-labelledby="timeline-title" className="min-w-0">
              <div className="mb-3 flex items-end justify-between border-b border-[#3a2c1d] pb-2">
                <div>
                  <p id="timeline-title" className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">Linha do tempo</p>
                  <p className="mt-1 font-serif text-xs italic text-[#80613d]">Sessões mais recentes primeiro</p>
                </div>
                <Clock3 className="h-4 w-4 text-[#8c6b41]" />
              </div>

              <div className="relative space-y-2 pl-3 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-[#5a4225]">
                {orderedChronicles.map((chronicle) => {
                  const isSelected = chronicle.id === selectedChronicle.id;
                  return (
                    <button
                      key={chronicle.id}
                      type="button"
                      onClick={() => setSelectedId(chronicle.id)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`group relative w-full border p-3 text-left transition-all focus:outline-none focus:ring-1 focus:ring-[#d1a85a] ${
                        isSelected
                          ? 'border-[#b89558] bg-gradient-to-r from-[#2b1d10] to-[#17100a] shadow-[0_0_14px_rgba(184,149,88,0.18)]'
                          : 'border-[#332519] bg-[#100b08]/80 hover:border-[#70552f] hover:bg-[#1a120c]'
                      }`}
                    >
                      <span className={`absolute -left-[18px] top-5 h-2.5 w-2.5 rounded-full border-2 ${isSelected ? 'border-[#f0c265] bg-[#8c6b41] shadow-[0_0_8px_#d1a85a]' : 'border-[#70552f] bg-[#120d09]'}`} />
                      <div className="absolute right-3 top-3 h-11 w-8 overflow-hidden border border-[#70552f] bg-[#21130b]">
                        {chronicle.cover ? (
                          <img src={chronicle.cover} alt={`Capa da crônica ${chronicle.title}`} className="h-full w-full object-cover opacity-80" />
                        ) : (
                          <div aria-hidden="true" className="h-full w-full bg-[radial-gradient(circle_at_65%_25%,#d59b4d_0%,#663317_42%,#160805_100%)]" />
                        )}
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <p className={`pr-10 font-cinzel text-[11px] font-bold uppercase leading-tight tracking-wide ${isSelected ? 'text-[#f0d79b]' : 'text-[#c2ae87]'}`}>
                          {chronicle.title}
                        </p>
                        {chronicle.status === 'AGENDADA' && (
                          <span className="shrink-0 border border-[#8c6b41]/70 bg-[#2a1d10] px-1.5 py-0.5 font-cinzel text-[8px] uppercase tracking-wider text-[#e0bd71]">Agendada</span>
                        )}
                      </div>
                      <p className="mt-1 flex items-center gap-1 font-serif text-xs italic text-[#806b53]">
                        <CalendarDays className="h-3 w-3" />
                        {formatSessionDate(chronicle.date)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden bg-[#2b1d13]">
                          <div className="h-full bg-gradient-to-r from-[#735126] to-[#d1a85a]" style={{ width: `${chronicle.progress}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-[#aa8a55]">{chronicle.progress}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="chronicle-detail-title" className="min-w-0 border-x border-[#3a2c1d]/60 px-0 sm:px-5">
              <div className="relative mb-5 border border-[#6b5238] bg-gradient-to-r from-[#21170e] via-[#2b1f14] to-[#17100a] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
                <div className="absolute left-1/2 top-0 h-[2px] w-16 -translate-x-1/2 bg-[#d4a359]" />
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#70552f] bg-[#0d0906] text-[#c6a35e]">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-cinzel text-[10px] uppercase tracking-[0.2em] text-[#9d7c4d]">Registro selecionado</p>
                    <h3 id="chronicle-detail-title" className="mt-1 font-cinzel text-lg font-bold leading-tight tracking-wide text-[#f0c265]">{selectedChronicle.title}</h3>
                    <p className="mt-1 flex items-center gap-1 font-serif text-xs italic text-[#a89071]"><CalendarDays className="h-3.5 w-3.5" />{formatSessionDate(selectedChronicle.date)}</p>
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 h-[2px] w-16 -translate-x-1/2 bg-[#d4a359]" />
              </div>

              <article className="font-garamond text-[16px] leading-relaxed tracking-wide text-[#d6c4ae]">
                <p className="first-letter:mr-1 first-letter:font-cinzel first-letter:text-3xl first-letter:font-bold first-letter:text-[#f0c265]">{selectedChronicle.summary}</p>
              </article>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="border border-[#3d2e20] bg-[#120d09]/80 p-3">
                  <p className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]"><MapPin className="h-3.5 w-3.5" /> Local da aventura</p>
                  <p className="mt-1 font-serif text-sm text-[#d0b98d]">{selectedChronicle.location}</p>
                </div>
                <div className="border border-[#3d2e20] bg-[#120d09]/80 p-3">
                  <p className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]"><Clock3 className="h-3.5 w-3.5" /> Estado do registro</p>
                  <p className="mt-1 font-serif text-sm text-[#d0b98d]">
                    {selectedChronicle.status === 'AGENDADA' && selectedChronicle.scheduledAt
                      ? `Agendada para ${formatScheduledDate(selectedChronicle.scheduledAt)}`
                      : 'Crônica publicada'}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-[#3a2c1d] pt-4">
                <button
                  type="button"
                  onClick={() => setExpandedCharacters((expanded) => !expanded)}
                  aria-expanded={expandedCharacters}
                  className="flex w-full items-center justify-between text-left font-cinzel text-xs font-bold uppercase tracking-[0.16em] text-[#d1a85a] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]"
                >
                  <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Personagens presentes ({selectedChronicle.characters.length})</span>
                  {expandedCharacters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {expandedCharacters && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedChronicle.characters.map((character) => (
                      <span key={character} className="inline-flex items-center gap-1.5 border border-[#5a4225] bg-[#1b120b] px-2.5 py-1 font-serif text-xs text-[#cdb887]"><Check className="h-3 w-3 text-[#c6a35e]" />{character}</span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside aria-label="Resumo da crônica" className="min-w-0">
              <div className="mb-3 flex items-center justify-between border-b border-[#3a2c1d] pb-2">
                <p className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">Capa da sessão</p>
                <Sparkles className="h-4 w-4 text-[#8c6b41]" />
              </div>
              <ChronicleArtwork title={selectedChronicle.title} cover={selectedChronicle.cover} />
              <div className="mt-4 border border-[#4b3823] bg-[#120d09] p-3">
                <div className="flex items-center justify-between font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
                  <span>Progresso da campanha</span>
                  <span className="text-[#e0bd71]">{selectedChronicle.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden border border-[#3a2c1d] bg-[#0a0705] p-px">
                  <div className="h-full bg-gradient-to-r from-[#735126] via-[#b89558] to-[#f0c265]" style={{ width: `${selectedChronicle.progress}%` }} />
                </div>
                <p className="mt-2 font-serif text-xs italic text-[#806b53]">O destino da companhia ainda está sendo escrito.</p>
              </div>
            </aside>
          </div>
        )}
      </MedievalFrame>

      {isMaster && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          title="Nova Crônica"
          subtitle="Redija e publique o próximo capítulo da campanha"
          maxWidth="max-w-[780px]"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Título da crônica</span>
                <input required value={form.title} onChange={(event) => updateForm('title', event.target.value)} className={inputClassName} placeholder="Título do capítulo" />
              </label>
              <label className="space-y-1.5">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Data da aventura</span>
                <input required type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} className={inputClassName} />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <label className="space-y-1.5">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Local da aventura</span>
                <input value={form.location} onChange={(event) => updateForm('location', event.target.value)} className={inputClassName} placeholder="Onde a aventura aconteceu" />
              </label>
              <label className="space-y-1.5">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Progresso (%)</span>
                <input required type="number" min="0" max="100" value={form.progress} onChange={(event) => updateForm('progress', event.target.value)} className={inputClassName} />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Relato narrativo</span>
              <textarea required value={form.summary} onChange={(event) => updateForm('summary', event.target.value)} className={`${inputClassName} min-h-[150px] resize-y font-garamond text-base`} placeholder="Escreva o que aconteceu nesta sessão. Markdown é aceito." />
              <span className="font-serif text-xs italic text-[#806b53]">Descreva os acontecimentos, decisões e consequências deixadas pela mesa.</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Imagem de capa</span>
                <label className="flex min-h-[84px] cursor-pointer items-center justify-center gap-2 border border-dashed border-[#70552f] bg-[#0d0906] px-3 text-center font-serif text-sm text-[#b89558] transition-colors hover:border-[#d1a85a] hover:bg-[#1a110b]">
                  <ImagePlus className="h-5 w-5" />
                  <span>{form.cover ? 'Capa selecionada' : 'Escolher imagem'}</span>
                  <input type="file" accept="image/*" onChange={handleCoverChange} className="sr-only" />
                </label>
                {form.cover && <img src={form.cover} alt="Prévia da capa selecionada" className="h-16 w-12 object-cover border border-[#70552f]" />}
              </div>
              <div className="space-y-2">
                <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Personagens presentes</span>
                {isLoadingPersonagens ? (
                  <LoadingState variant="text" label="Reunindo os personagens do cliente…" />
                ) : erroPersonagens ? (
                  <ErrorState onRetry={reloadPersonagens} description={erroPersonagens} />
                ) : personagens.length === 0 ? (
                  <p className="border border-[#4b3823] bg-[#0d0906] p-3 font-serif text-xs text-[#c4b9a3]">
                    Nenhum personagem do cliente disponível.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 border border-[#4b3823] bg-[#0d0906] p-2">
                    {personagens.map((personagem) => (
                      <label key={personagem.id} className="flex cursor-pointer items-center gap-2 font-serif text-xs text-[#c4b9a3]">
                        <input type="checkbox" checked={form.characters.includes(personagem.nome)} onChange={() => toggleCharacter(personagem.nome)} className="accent-[#b89558]" />
                        <span>{personagem.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#3a2c1d] pt-4">
              <div className="mb-3 flex gap-2" role="group" aria-label="Modo de publicação">
                <button type="button" onClick={() => setPublishMode('now')} className={`flex flex-1 items-center justify-center gap-2 border px-3 py-2 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#d1a85a] ${publishMode === 'now' ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]' : 'border-[#4b3823] bg-[#0d0906] text-[#8d7557]'}`}><Send className="h-3.5 w-3.5" /> Publicar agora</button>
                <button type="button" onClick={() => setPublishMode('schedule')} className={`flex flex-1 items-center justify-center gap-2 border px-3 py-2 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#d1a85a] ${publishMode === 'schedule' ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]' : 'border-[#4b3823] bg-[#0d0906] text-[#8d7557]'}`}><Clock3 className="h-3.5 w-3.5" /> Agendar</button>
              </div>
              {publishMode === 'schedule' && (
                <label className="block space-y-1.5">
                  <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Data e hora da publicação</span>
                  <input required type="datetime-local" value={form.scheduledAt} onChange={(event) => updateForm('scheduledAt', event.target.value)} className={inputClassName} />
                </label>
              )}
            </div>

            <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
              <button type="button" onClick={closeCreateModal} className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]">Cancelar</button>
              <GothicButton type="submit" size="sm" width={190} height={38} icon={publishMode === 'now' ? <Send className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}>
                {publishMode === 'now' ? 'Publicar Crônica' : 'Agendar Crônica'}
              </GothicButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default CronicasPage;
