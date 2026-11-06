import React, { useEffect } from 'react';
import {
  BookMarked,
  BookOpen,
  Brain,
  Check,
  CircleDot,
  Droplets,
  Eye,
  EyeOff,
  Flame,
  HeartPulse,
  Mountain,
  Pencil,
  Shield,
  Skull,
  Sparkles,
  Trash2,
  Wind,
  X,
} from 'lucide-react';
import { grimorioSchools, grimorioVolumes, GrimorioSpell } from '../mocks/grimorio';
import { urlMiniatura } from '../services/mediaService';
import { Portal } from './ui/Portal';

type VisualKind = GrimorioSpell['visual'];

const visualIcon = (visual: VisualKind, size = 26) => {
  const props = { size, strokeWidth: 1.5 };
  switch (visual) {
    case 'fire': return <Flame {...props} />;
    case 'water': return <Droplets {...props} />;
    case 'wind': return <Wind {...props} />;
    case 'earth': return <Mountain {...props} />;
    case 'ward': return <Shield {...props} />;
    case 'summon': return <Sparkles {...props} />;
    case 'mind': return <Brain {...props} />;
    case 'restore': return <HeartPulse {...props} />;
    case 'death': return <Skull {...props} />;
  }
};

const visualTone: Record<VisualKind, string> = {
  fire: 'from-red-950 via-orange-800/60 to-[#241309] text-orange-300',
  water: 'from-blue-950 via-cyan-900/60 to-[#0d1822] text-cyan-300',
  wind: 'from-slate-900 via-sky-900/60 to-[#10151d] text-sky-300',
  earth: 'from-stone-950 via-amber-900/50 to-[#1d160d] text-amber-300',
  ward: 'from-indigo-950 via-slate-800/70 to-[#11121d] text-indigo-300',
  summon: 'from-purple-950 via-fuchsia-900/50 to-[#1c1020] text-fuchsia-300',
  mind: 'from-violet-950 via-blue-900/50 to-[#121127] text-violet-300',
  restore: 'from-emerald-950 via-green-900/50 to-[#101d16] text-emerald-300',
  death: 'from-zinc-950 via-rose-950/60 to-[#1b1017] text-rose-300',
};

export const MagicVisual = ({ spell, large = false }: { spell: GrimorioSpell; large?: boolean }) => (
  <div
    className={`relative ${large ? 'mx-auto h-[214px] w-full max-w-[174px] sm:h-[250px] sm:max-w-[196px] lg:h-[286px] lg:max-w-[220px]' : 'h-20 w-20'} flex shrink-0 items-center justify-center ${large ? 'border-2' : 'overflow-hidden border'} border-[#765b36] bg-gradient-to-br ${visualTone[spell.visual]}`}
    role="img"
    aria-label={`Visual arcano de ${spell.name || '-'}`}
  >
    {spell.image && <img src={large ? spell.image : urlMiniatura(spell.image)} alt={`Imagem da magia ${spell.name || '-'}`} className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />}
    {large && <div className="pointer-events-none absolute inset-1.5 border border-current opacity-30 sm:inset-2.5" aria-hidden="true" />}
    {!spell.image && <CircleDot className="absolute h-[78%] w-[78%] opacity-20" strokeWidth={1} />}
    {!spell.image && <div className="absolute h-[55%] w-[55%] rotate-45 border border-current opacity-30" />}
    {!spell.image && <div className="relative">{visualIcon(spell.visual, large ? 48 : 28)}</div>}
  </div>
);

export interface SpellCardProps {
  key?: React.Key;
  spell: GrimorioSpell;
  learned: boolean;
  hidden?: boolean;
  canManage?: boolean;
  canToggleHidden?: boolean;
  onOpen: () => void;
  onToggleLearned: () => void;
  onEdit?: () => void;
  onToggleHidden?: () => void;
  onDelete?: () => void;
}

export const SpellCard = ({ spell, learned, hidden = false, canManage = false, canToggleHidden = false, onOpen, onToggleLearned, onEdit, onToggleHidden, onDelete }: SpellCardProps) => (
  <article className={`group relative border bg-[#17100b]/90 transition hover:border-[#9d7745] ${learned ? 'border-[#9b7c43]' : 'border-[#3f2e1c]'}`}>
    <div className="flex w-full gap-3 p-3 sm:gap-4 sm:p-4">
      <div className="flex w-20 shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Abrir detalhes de ${spell.name || '-'}`}
          className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a] focus-visible:outline-offset-2"
        >
          <MagicVisual spell={spell} />
        </button>
        <button
          type="button"
          onClick={onToggleLearned}
          aria-pressed={learned}
          className={`flex w-full items-center justify-center gap-0.5 border px-1 py-1 text-[8px] uppercase tracking-wider transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a] sm:text-[9px] ${learned ? 'border-[#a88d61] bg-[#80643c]/30 text-[#f0d68b]' : 'border-[#49351f] text-[#8c6b41] hover:border-[#a88d61] hover:text-[#d6b56a]'}`}
          title={learned ? 'Remover do Grimório do personagem' : 'Adicionar ao Grimório do personagem'}
        >
          {learned ? <Check size={12} /> : <BookMarked size={12} />}
          {learned ? 'Aprendida' : 'Aprender'}
        </button>
        {(canManage || canToggleHidden) && <div className="flex items-center justify-center gap-1" aria-label={`Gerenciar ${spell.name || 'magia'}`}>
          {canManage && <>
            <button type="button" onClick={onEdit} aria-label={`Editar ${spell.name || 'magia'}`} title="Editar" className="border border-[#49351f] p-1 text-[#b49768] transition hover:border-[#c6a15b] hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]"><Pencil size={12} /></button>
            <button type="button" onClick={onDelete} aria-label={`Excluir ${spell.name || 'magia'}`} title="Excluir" className="border border-[#49351f] p-1 text-[#b49768] transition hover:border-[#c6a15b] hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]"><Trash2 size={12} /></button>
          </>}
          {canToggleHidden && <button type="button" onClick={onToggleHidden} aria-label={hidden ? `Mostrar ${spell.name || 'magia'}` : `Ocultar ${spell.name || 'magia'}`} title={hidden ? 'Mostrar magia' : 'Ocultar magia'} className="border border-[#49351f] p-1 text-[#b49768] transition hover:border-[#c6a15b] hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]">{hidden ? <Eye size={12} /> : <EyeOff size={12} />}</button>}
        </div>}
      </div>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a] focus-visible:outline-offset-[-2px]">
        <span className="mb-1 flex flex-wrap items-start justify-between gap-2">
          <span className="font-cinzel text-sm font-bold tracking-wide text-[#eadfc8] group-hover:text-[#f3d98b]">{spell.name || '-'}</span>
          <span className="flex flex-wrap items-center justify-end gap-1"><span className="border border-[#80643c] bg-[#2c2114] px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#d3b56f]">{spell.level || '-'}</span>{canToggleHidden && hidden && <span className="border border-[#9b7c43] bg-[#5a4225]/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#f1d994]">Oculta</span>}</span>
        </span>
        <span className="line-clamp-2 text-xs leading-relaxed text-[#ad9d84]">{spell.description || '-'}</span>
        <span className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-[#8c6b41] sm:grid-cols-3">
          <span><strong className="font-normal text-[#c5ad7c]">Consumo</strong><br />{spell.consumption || '-'}</span>
          <span><strong className="font-normal text-[#c5ad7c]">Tipo</strong><br />{spell.type || '-'}</span>
          <span><strong className="font-normal text-[#c5ad7c]">Dificuldade</strong><br />{spell.difficulty || '-'}</span>
        </span>
      </button>
    </div>
  </article>
);

interface SpellDetailsModalProps {
  spell: GrimorioSpell;
  learned: boolean;
  canManage?: boolean;
  canToggleHidden?: boolean;
  hidden?: boolean;
  onClose: () => void;
  onToggleLearned: () => void;
  onEdit?: () => void;
  onToggleHidden?: () => void;
  onDelete?: () => void;
}

export const SpellDetailsModal = ({ spell, learned, canManage = false, canToggleHidden = false, hidden = false, onClose, onToggleLearned, onEdit, onToggleHidden, onDelete }: SpellDetailsModalProps) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const spellSchool = grimorioSchools.find((item) => item.id === spell.schoolId);
  const schoolName = spellSchool?.name ?? '-';

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050403]/90 p-2 backdrop-blur-sm sm:p-5 text-[#dcd1ba]" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="spell-details-title" className="relative flex max-h-[calc(100dvh-0.75rem)] w-full max-w-[820px] flex-col overflow-visible border-2 border-[#76552f] bg-[#b8945c] p-1 text-[#3b2715] shadow-[0_0_50px_rgba(0,0,0,0.95)] sm:max-h-[calc(100dvh-2rem)] sm:p-1.5" onClick={(event) => event.stopPropagation()}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(246,220,157,0.44)_0%,transparent_58%),repeating-linear-gradient(115deg,rgba(90,54,23,0.11)_0px,rgba(90,54,23,0.11)_1px,transparent_1px,transparent_7px),repeating-linear-gradient(8deg,rgba(255,244,196,0.12)_0px,rgba(255,244,196,0.12)_2px,transparent_2px,transparent_13px)] opacity-90" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-3 top-5 bottom-6 w-5 bg-[#d7b979] shadow-[2px_2px_5px_rgba(52,31,14,0.4)] [clip-path:polygon(0_0,100%_4%,72%_11%,100%_20%,66%_29%,100%_39%,70%_49%,100%_59%,64%_69%,100%_80%,68%_90%,100%_100%,0_94%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-3 top-6 bottom-5 w-5 bg-[#a7834d] shadow-[-2px_2px_5px_rgba(52,31,14,0.4)] [clip-path:polygon(0_0,100%_5%,28%_14%,100%_24%,32%_35%,100%_47%,26%_59%,100%_70%,30%_82%,100%_92%,26%_100%,0_94%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-2 top-2 bottom-2 z-20 flex w-4 flex-col justify-between rounded-full border border-[#8c6537] bg-[linear-gradient(90deg,#74502b_0%,#d6b575_28%,#f0d99b_52%,#a97b43_76%,#674721_100%)] py-1 shadow-[2px_2px_6px_rgba(38,22,10,0.55)]" aria-hidden="true"><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#d9b978]" /><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#8c6537]" /></div>
        <div className="pointer-events-none absolute -right-2 top-2 bottom-2 z-20 flex w-4 flex-col justify-between rounded-full border border-[#76552f] bg-[linear-gradient(90deg,#674721_0%,#a97b43_24%,#f0d99b_48%,#d6b575_72%,#74502b_100%)] py-1 shadow-[-2px_2px_6px_rgba(38,22,10,0.55)]" aria-hidden="true"><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#d9b978]" /><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#8c6537]" /></div>
        <div className="pointer-events-none absolute right-2 top-1 z-30 h-10 w-10 bg-[#f0d99b]/55 shadow-[-4px_4px_8px_rgba(52,31,14,0.25)] [clip-path:polygon(0_0,100%_0,100%_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-1 border border-[#5d4528]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-2 border border-dashed border-[#765b36]/70" aria-hidden="true" />
        <header className="relative mx-0 flex shrink-0 items-center gap-2 border-b border-[#49351f] bg-[#1a110b]/95 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <div className="flex h-10 min-w-10 shrink-0 flex-col items-center justify-center border border-[#b18b4e] bg-[#2a1b0f] px-1 text-center shadow-[inset_0_0_0_1px_rgba(241,217,148,0.12)] sm:h-11 sm:min-w-11"><span className="text-[8px] uppercase tracking-[0.18em] text-[#a88d61]">Escola</span><span className="mt-0.5 font-cinzel text-[10px] uppercase tracking-wider text-[#f1d994]">{schoolName}</span></div>
          <div className="min-w-0 flex-1"><p className="mb-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.24em] text-[#a88d61]"><BookOpen size={13} /> Grimório · {schoolName}</p><h2 id="spell-details-title" className="break-words font-cinzel text-base font-bold uppercase leading-tight tracking-wider text-[#eee3cb] sm:text-lg">{spell.name || '-'}</h2></div>
          {canToggleHidden && hidden && <span className="border border-[#9b7c43] bg-[#5a4225]/40 px-2 py-1 text-[9px] uppercase tracking-widest text-[#f1d994]">Oculta</span>}
          <div className="flex shrink-0 items-center gap-1.5">
            {canManage && <>
              <button type="button" onClick={onEdit} aria-label={`Editar ${spell.name || 'magia'}`} title="Editar" className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"><Pencil size={16} /></button>
              <button type="button" onClick={onDelete} aria-label={`Excluir ${spell.name || 'magia'}`} title="Excluir" className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"><Trash2 size={16} /></button>
            </>}
            {canToggleHidden && <button type="button" onClick={onToggleHidden} aria-label={hidden ? `Mostrar ${spell.name || 'magia'}` : `Ocultar ${spell.name || 'magia'}`} title={hidden ? 'Mostrar magia' : 'Ocultar magia'} className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]">{hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>}
            <button type="button" onClick={onClose} aria-label="Fechar detalhes da magia" title="Fechar" className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#eee3cb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"><X size={18} /></button>
          </div>
        </header>
        <div className="relative min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(245,221,162,0.48),transparent_52%),repeating-linear-gradient(165deg,rgba(91,57,26,0.1)_0px,rgba(91,57,26,0.1)_1px,transparent_1px,transparent_9px)] p-3 pt-8 sm:p-5 sm:pt-9">
          <div className="pointer-events-none absolute inset-x-8 top-2 flex items-center justify-center gap-2 text-[10px] tracking-[0.55em] text-[#8c6537] opacity-80" aria-hidden="true"><span className="h-px flex-1 bg-[#9c7746]/70" />ᚱ ᚢ ᚾ ᛖ<span className="h-px flex-1 bg-[#9c7746]/70" /></div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[9px] tracking-[0.6em] text-[#8c6537] opacity-70 sm:block" aria-hidden="true">ᛗ ᚨ ᚷ ᛁ ᚲ</div>
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(230px,0.72fr)_minmax(0,1.28fr)] lg:gap-6">
            <aside className="order-1 flex min-w-0 flex-col pt-0.5"><div className="relative"><div className="pointer-events-none absolute -inset-x-2 top-2 bottom-3 bg-[#d3b477]/25 shadow-[0_5px_14px_rgba(0,0,0,0.35)] [clip-path:polygon(5%_0,97%_0,100%_12%,96%_25%,100%_39%,96%_53%,100%_68%,95%_82%,100%_92%,92%_100%,6%_96%,0_84%,4%_69%,0_54%,4%_38%,0_20%)]" aria-hidden="true" /><div className="pointer-events-none absolute right-0 top-0 z-30 h-7 w-7 bg-[#e0c88e]/25 [clip-path:polygon(0_0,100%_0,100%_100%)]" aria-hidden="true" /><div className="relative border border-[#b18b4e] bg-[#3a2614] p-1 shadow-[0_8px_25px_rgba(0,0,0,0.55)]"><div className="border border-[#765b36] bg-[#0f0a06] p-1"><div className="relative border border-[#c6a15b]/70"><div className="pointer-events-none absolute inset-1 z-10 border border-[#f1d994]/30 sm:inset-2" aria-hidden="true" /><MagicVisual spell={spell} large /></div></div><div className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l border-t border-[#f1d994]" aria-hidden="true" /><div className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r border-t border-[#f1d994]" aria-hidden="true" /><div className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b border-l border-[#f1d994]" aria-hidden="true" /><div className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b border-r border-[#f1d994]" aria-hidden="true" /></div></div></aside>
            <SpellDetails spell={spell} />
          </div>
        </div>
        <footer className="relative flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#49351f] bg-[#1a110b]/95 px-2.5 py-2 sm:px-4 sm:py-2.5"><p className="text-[9px] uppercase tracking-[0.16em] text-[#80643c]">{learned ? 'Fórmula inscrita no Grimório' : 'Fórmula ainda não aprendida'}</p><div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="flex items-center gap-1.5 border border-[#4a351f] px-3 py-2 text-[10px] uppercase tracking-widest text-[#a88d61] transition hover:border-[#80643c] hover:text-[#e6ddc5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"><X size={14} /> Fechar</button><button type="button" onClick={onToggleLearned} aria-pressed={learned} className={`flex items-center gap-1.5 border px-3 py-2 text-[10px] uppercase tracking-widest transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] ${learned ? 'border-[#a88d61] bg-[#765b36]/40 text-[#f1d994]' : 'border-[#a88d61] bg-[#5a4225]/40 text-[#f1d994] hover:bg-[#765b36]'}`}>{learned ? <Check size={14} /> : <BookMarked size={14} />}{learned ? 'Remover do Grimório' : 'Adicionar ao Grimório'}</button></div></footer>
      </section>
      </div>
    </Portal>
  );
};

export const Field = ({ label, value }: { label: string; value?: string }) => <div className="border border-[#584128] bg-[#1a110b]/90 px-1.5 py-1 shadow-[inset_0_1px_rgba(255,255,255,0.025)] sm:px-2 sm:py-1.5"><dt className="text-[7px] uppercase leading-tight tracking-[0.12em] text-[#a88d61] sm:text-[8px] sm:tracking-[0.14em]">{label}</dt><dd className="mt-0.5 break-words text-[10px] leading-tight text-[#e0d4bb] sm:text-[11px]">{value || '-'}</dd></div>;

const SpellDetails = ({ spell }: { spell: GrimorioSpell }) => {
  const spellSchool = grimorioSchools.find((item) => item.id === spell.schoolId);
  const spellVolume = grimorioVolumes.find((volume) => volume.id === spell.volumeId);
  const hasCustomBookVolume = Object.prototype.hasOwnProperty.call(spell, 'bookVolume');
  const bookVolume = hasCustomBookVolume ? (spell.bookVolume === undefined ? undefined : String(spell.bookVolume)) : spellVolume?.number === 'I' ? '1' : spellVolume?.number === 'II' ? '2' : spellVolume?.number === 'III' ? '3' : undefined;
  return <div className="order-2 min-w-0 space-y-2"><section id="spell-overview" className="border-b border-[#49351f] pb-1.5" aria-labelledby="spell-overview-heading"><h3 id="spell-overview-heading" className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#4a2b12] sm:text-[10px] sm:tracking-[0.16em]"><BookOpen size={12} /> Descrição</h3><blockquote className="relative mt-1 border-l-2 border-[#c6a15b] bg-[#1a110b]/85 px-2 py-1.5 text-[10px] italic leading-3.5 text-[#d8cbb1] shadow-[inset_0_0_18px_rgba(0,0,0,0.2)] sm:text-xs sm:leading-4"><CircleDot className="absolute -left-[8px] top-2 h-3.5 w-3.5 bg-[#100b07] text-[#c6a15b]" size={12} />“{spell.description || '-'}”</blockquote></section><section id="spell-technical" className="border-b border-[#49351f] py-1.5" aria-labelledby="spell-stats-heading"><div className="mb-1.5 flex items-center justify-between gap-2"><h3 id="spell-stats-heading" className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#4a2b12] sm:text-[10px] sm:tracking-[0.16em]"><Sparkles size={12} /> Propriedades Mágicas</h3><span className="text-[7px] uppercase tracking-[0.1em] text-[#80643c] sm:text-[8px] sm:tracking-[0.12em]">Dados do registro</span></div><dl className="grid grid-cols-2 gap-1 sm:grid-cols-3"><Field label="Escola" value={spellSchool?.name} /><Field label="Subcategoria" value={spell.subcategory} /><Field label="Livro Vol" value={bookVolume} /><Field label="Nível" value={spell.level} /><Field label="Consumo" value={spell.consumption} /><Field label="Tipo" value={spell.type} /><Field label="Dificuldade" value={spell.difficulty} /><Field label="Dano" value={spell.damage} /><Field label="Duração" value={spell.duration} /><Field label="Alcance" value={spell.range} /><Field label="Canalização" value={spell.channeling} /><Field label="Condição" value={spell.condition} /></dl></section><section id="spell-effects" className="border border-[#a88d61]/70 bg-gradient-to-br from-[#2a1b0f] via-[#1c130c] to-[#140c08] p-2 shadow-[inset_0_0_24px_rgba(198,161,91,0.08)]" aria-labelledby="spell-effects-heading"><div className="flex items-center gap-1.5 border-b border-[#765b36]/60 pb-1.5"><Sparkles size={13} className="text-[#f1d994]" /><h3 id="spell-effects-heading" className="font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#f1d994] sm:text-[10px] sm:tracking-[0.14em]">Efeitos mágicos</h3><span className="ml-auto text-[7px] uppercase tracking-[0.1em] text-[#a88d61] sm:text-[8px] sm:tracking-[0.12em]">Campo arcano</span></div><p className="mt-1.5 text-[10px] leading-3.5 text-[#e1d4b8] sm:text-xs sm:leading-4">{spell.magicalEffects || '-'}</p></section></div>;
};
