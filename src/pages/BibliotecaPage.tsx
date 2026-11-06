import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileText,
  List,
  RotateCcw,
  Search,
  Scroll,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { ROUTES } from '../routes/paths';

interface ManualIndexEntry {
  title: string;
  page: number;
}

interface Manual {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  cover: string;
  pdfUrl: string;
  index: ManualIndexEntry[];
}

/**
 * Catálogo da estante. Fica vazio de propósito: os manuais oficiais ainda não
 * foram publicados, e o que havia aqui era material de demonstração (capas de
 * banco de imagens e um PDF de exemplo de terceiros). Preencha esta lista — ou
 * troque-a pela origem oficial — quando os arquivos chegarem: a estante e o
 * leitor de PDF já estão prontos para recebê-los.
 */
const manuals: Manual[] = [];

const focusRing = 'focus:outline-none focus:ring-2 focus:ring-[#d1a85a] focus:ring-offset-2 focus:ring-offset-[#15100b]';

export const BibliotecaPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedManual, setSelectedManual] = useState<Manual | null>(null);
  const [zoom, setZoom] = useState(100);
  const [selectedPage, setSelectedPage] = useState(1);
  const [isIndexOpen, setIsIndexOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');

  useEffect(() => {
    if (!selectedManual) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedManual(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedManual]);

  const openReader = (manual: Manual) => {
    setSelectedManual(manual);
    setZoom(100);
    setSelectedPage(1);
    setIsIndexOpen(true);
    setSearchTerm('');
    setSubmittedSearch('');
  };

  const closeReader = () => setSelectedManual(null);

  const updateZoom = (amount: number) => {
    setZoom((currentZoom) => Math.min(150, Math.max(75, currentZoom + amount)));
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedSearch(searchTerm.trim());
  };

  const readerUrl = selectedManual
    ? `${selectedManual.pdfUrl}#page=${selectedPage}&zoom=${zoom}${submittedSearch ? `&search=${encodeURIComponent(submittedSearch)}` : ''}`
    : '';

  return (
    <>
      <PageShell id="page-biblioteca" variant="padrao"
        title={
          <h2 className="flex items-center gap-2 text-xl font-bold font-cinzel tracking-wider text-[#e6ddc5] uppercase">
            <Scroll className="w-5 h-5 text-[#a88d61]" />
            Biblioteca da Campanha
          </h2>
        }
        subtitle="Manuais de regras, suplementos e livros de Angarden"
        headerRight={
          <button
            type="button"
            onClick={() => navigate(ROUTES.cronicas)}
            title="Ir para Crônicas"
            aria-label="Ir para Crônicas"
            className={`inline-flex items-center gap-2 border border-[#8c6b41] bg-[#241a11] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#d8bd83] transition-colors hover:border-[#d1a85a] hover:bg-[#3a2917] hover:text-[#f0d79b] ${focusRing}`}
          >
            <BookOpen className="h-4 w-4" />
            Ir para Crônicas
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-2 border-b border-[#3a2c1d] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-cinzel text-sm uppercase tracking-[0.18em] text-[#d1a85a]">Acervo da campanha</p>
              <p className="mt-1 max-w-2xl font-serif text-sm text-[#a99c84]">
                Escolha um tomo para consultar suas regras e referências durante a aventura.
              </p>
            </div>
            <span className="font-serif text-xs italic text-[#80613d]">{manuals.length} volumes catalogados</span>
          </div>

          {manuals.length === 0 ? (
            <EmptyState
              title="Acervo vazio"
              description="Nenhum manual foi catalogado para esta campanha até o momento."
            />
          ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {manuals.map((manual) => (
              <button
                key={manual.id}
                type="button"
                onClick={() => openReader(manual)}
                aria-label={`Abrir o manual ${manual.title}`}
                className={`group flex h-full flex-col overflow-hidden border border-[#4b3823] bg-[#17110c] text-left shadow-[0_8px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:border-[#a88d61] hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] ${focusRing}`}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-[#4b3823] bg-[#2a1b13]">
                  <img
                    src={manual.cover}
                    alt={`Capa do manual ${manual.title}`}
                    className="h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120c08] via-[#1a110c]/35 to-[#110c08]/30" />
                  <div className="absolute inset-x-4 top-4 border border-[#d1a85a]/60 px-2 py-1 text-center font-cinzel text-[9px] uppercase tracking-[0.2em] text-[#e1c681]">
                    Angarden
                  </div>
                  <div className="absolute inset-x-4 bottom-4">
                    <p className="font-cinzel text-base font-bold uppercase leading-tight tracking-wider text-[#f0e2c0] drop-shadow-[1px_1px_2px_#000]">
                      {manual.title}
                    </p>
                    <p className="mt-1 font-serif text-xs italic text-[#c9b88e]">{manual.subtitle}</p>
                  </div>
                  <span className="absolute right-3 top-3 rounded-full border border-[#d1a85a]/60 bg-[#120c08]/80 p-1.5 text-[#e0bd71] opacity-0 transition-opacity group-hover:opacity-100">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="font-serif text-xs leading-relaxed text-[#a99c84]">{manual.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-cinzel text-[10px] font-bold uppercase tracking-widest text-[#b89558] transition-colors group-hover:text-[#e1c681]">
                    Abrir manual
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </button>
            ))}
          </div>
          )}
        </div>
      </PageShell>

      {selectedManual && (
        <div
          className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#0c0906]/[.98] text-[#e6ddc5]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="leitor-manual-titulo"
        >
          <header className="flex shrink-0 flex-col gap-3 border-b border-[#5a4225] bg-[#17100b] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.65)] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden border border-[#6d512e] bg-[#281b11] p-2 text-[#d1a85a] sm:block">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 id="leitor-manual-titulo" className="truncate font-cinzel text-sm font-bold uppercase tracking-wider text-[#ead8ae] sm:text-base">
                  {selectedManual.title}
                </h2>
                <p className="truncate font-serif text-xs italic text-[#9e8052]">{selectedManual.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <div className="flex items-center border border-[#4b3823] bg-[#0e0a07]">
                <button
                  type="button"
                  onClick={() => updateZoom(-25)}
                  disabled={zoom <= 75}
                  title="Diminuir zoom"
                  aria-label="Diminuir zoom"
                  className={`p-2 text-[#c5a665] transition-colors hover:bg-[#2d1e12] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="min-w-[3.5rem] border-x border-[#4b3823] px-2 text-center font-serif text-xs text-[#cbb887]" aria-live="polite">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={() => updateZoom(25)}
                  disabled={zoom >= 150}
                  title="Aumentar zoom"
                  aria-label="Aumentar zoom"
                  className={`p-2 text-[#c5a665] transition-colors hover:bg-[#2d1e12] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  title="Restaurar zoom"
                  aria-label="Restaurar zoom"
                  className={`border-l border-[#4b3823] p-2 text-[#9e8052] transition-colors hover:bg-[#2d1e12] hover:text-[#e0bd71] ${focusRing}`}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              <form onSubmit={handleSearch} className="flex min-w-[min(100%,15rem)] flex-1 border border-[#4b3823] bg-[#0e0a07] sm:flex-none">
                <label htmlFor="busca-manual" className="sr-only">Buscar no manual</label>
                <Search className="m-2 h-4 w-4 shrink-0 text-[#8c6b41]" />
                <input
                  id="busca-manual"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar no manual"
                  title="Buscar no manual"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 font-serif text-xs text-[#e6ddc5] placeholder:text-[#756044] focus:outline-none"
                />
                <button
                  type="submit"
                  title="Buscar no PDF"
                  aria-label="Buscar no PDF"
                  className={`border-l border-[#4b3823] px-2 text-[#c5a665] transition-colors hover:bg-[#2d1e12] hover:text-[#ead8ae] ${focusRing}`}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsIndexOpen((open) => !open)}
                title={isIndexOpen ? 'Ocultar índice' : 'Mostrar índice'}
                aria-label={isIndexOpen ? 'Ocultar índice' : 'Mostrar índice'}
                aria-pressed={isIndexOpen}
                className={`inline-flex items-center gap-2 border border-[#4b3823] bg-[#21160d] px-3 py-2 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c5a665] transition-colors hover:border-[#a88d61] hover:text-[#ead8ae] ${focusRing}`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Índice</span>
              </button>

              <button
                type="button"
                onClick={closeReader}
                title="Fechar leitor"
                aria-label="Fechar leitor"
                className={`border border-[#8c6b41] bg-[#3a2016] p-2 text-[#e1b28a] transition-colors hover:border-[#d1a85a] hover:bg-[#54291a] hover:text-[#ffe0bb] ${focusRing}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            {isIndexOpen && (
              <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-[#4b3823] bg-[#130e09] p-4 md:block" aria-label="Índice do manual">
                <div className="mb-4 border-b border-[#3a2c1d] pb-3">
                  <p className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">Índice</p>
                  <p className="mt-1 font-serif text-xs italic text-[#80613d]">Navegue pelos capítulos</p>
                </div>
                <nav aria-label={`Capítulos de ${selectedManual.title}`} className="space-y-1">
                  {selectedManual.index.map((entry) => (
                    <button
                      key={`${entry.title}-${entry.page}`}
                      type="button"
                      onClick={() => setSelectedPage(entry.page)}
                      aria-current={selectedPage === entry.page ? 'page' : undefined}
                      className={`flex w-full items-start gap-2 border-l-2 px-3 py-2 text-left font-serif text-xs transition-colors ${focusRing} ${selectedPage === entry.page ? 'border-[#d1a85a] bg-[#2b1c10] text-[#e1c681]' : 'border-[#3a2c1d] text-[#9e8b6c] hover:border-[#8c6b41] hover:bg-[#21160d] hover:text-[#d7c69d]'}`}
                    >
                      <span className="mt-0.5 min-w-[1.2rem] font-cinzel text-[10px] text-[#80613d]">{entry.page}</span>
                      <span>{entry.title}</span>
                    </button>
                  ))}
                </nav>
              </aside>
            )}

            <main className="relative min-w-0 flex-1 overflow-auto bg-[#24201a] p-2 sm:p-5" aria-label="Visualizador de PDF">
              {submittedSearch && (
                <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 border border-[#69512f] bg-[#17100b]/95 px-3 py-1.5 font-serif text-xs text-[#d1bd8d] shadow-lg" role="status">
                  Busca enviada ao visualizador: “{submittedSearch}”
                </div>
              )}
              <div className="flex min-h-full min-w-full items-start justify-center overflow-auto">
                <iframe
                  key={readerUrl}
                  src={readerUrl}
                  title={`Leitor de PDF: ${selectedManual.title}`}
                  className="min-h-[calc(100vh-8.5rem)] w-full border border-[#5a4225] bg-white shadow-[0_4px_22px_rgba(0,0,0,0.55)] transition-transform duration-200 sm:min-h-[calc(100vh-7rem)]"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                />
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default BibliotecaPage;
