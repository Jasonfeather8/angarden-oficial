import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfjsWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  List,
  Maximize2,
  RotateCcw,
  Search,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { OverlayLeitor } from './OverlayLeitor';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { rotuloCategoria } from '@/config/biblioteca';
import { bibliotecaService } from '@/services/bibliotecaService';
import type { EntradaIndiceBiblioteca, ItemBiblioteca } from '@/types';

// O pdf.js interpreta o arquivo num worker: ele precisa ser servido como
// arquivo próprio, e é isso que o `?url` do Vite entrega.
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const ESCALA_MINIMA = 0.6;
const ESCALA_MAXIMA = 3;
const PASSO_ESCALA = 0.25;
const MINIMO_BUSCA = 2;
const LIMITE_RESULTADOS = 50;
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]';

interface EntradaSumario extends EntradaIndiceBiblioteca {
  profundidade: number;
}

interface ResultadoBusca {
  pagina: number;
  trecho: string;
}

/** O destino de um item do sumário pode ser um nome ou um array já resolvido. */
async function resolverPaginaDoDestino(
  doc: PDFDocumentProxy,
  destino: string | unknown[] | null,
): Promise<number | null> {
  if (!destino) return null;
  try {
    const explicito = typeof destino === 'string' ? await doc.getDestination(destino) : destino;
    if (!Array.isArray(explicito) || explicito.length === 0) return null;
    const referencia = explicito[0];
    if (typeof referencia === 'number') return referencia + 1;
    if (!referencia || typeof referencia !== 'object') return null;
    const indice = await doc.getPageIndex(referencia as Parameters<PDFDocumentProxy['getPageIndex']>[0]);
    return indice + 1;
  } catch {
    return null;
  }
}

/** Lê o sumário que já existe dentro do PDF, guardando a profundidade de cada item. */
async function lerSumario(doc: PDFDocumentProxy): Promise<EntradaSumario[]> {
  const raiz = await doc.getOutline();
  if (!raiz || raiz.length === 0) return [];

  const entradas: EntradaSumario[] = [];
  const visitar = async (nos: typeof raiz, profundidade: number): Promise<void> => {
    for (const no of nos) {
      const pagina = await resolverPaginaDoDestino(doc, no.dest);
      if (pagina) entradas.push({ titulo: no.title, pagina, profundidade });
      if (no.items && no.items.length > 0) await visitar(no.items as typeof raiz, profundidade + 1);
    }
  };

  await visitar(raiz, 0);
  return entradas;
}

export interface LeitorPdfProps {
  item: ItemBiblioteca;
  onFechar: () => void;
}

/**
 * Lê um manual em PDF. O arquivo vem do bucket privado por URL assinada, e o
 * sumário sai do próprio documento — o índice digitado no formulário só é usado
 * quando o PDF não traz sumário.
 */
export const LeitorPdf: React.FC<LeitorPdfProps> = ({ item, onFechar }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const corpoRef = useRef<HTMLDivElement | null>(null);
  const tarefaRef = useRef<PDFDocumentLoadingTask | null>(null);

  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [escala, setEscala] = useState(1.2);
  const [larguraBase, setLarguraBase] = useState(0);
  const [sumario, setSumario] = useState<EntradaSumario[]>([]);
  const [sumarioAberto, setSumarioAberto] = useState(false);
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [buscaFeita, setBuscaFeita] = useState(false);

  const totalPaginas = doc?.numPages ?? 0;
  const entradasIndice: EntradaSumario[] =
    sumario.length > 0 ? sumario : item.indice.map((entrada) => ({ ...entrada, profundidade: 0 }));

  // Este efeito vem antes do carregamento de propósito: na desmontagem, a
  // renderização em andamento é cancelada antes de o documento ser destruído.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!doc || !canvas) return;

    let cancelado = false;
    let tarefa: RenderTask | null = null;

    void (async () => {
      try {
        const pagina = await doc.getPage(paginaAtual);
        if (cancelado) return;
        const fator = window.devicePixelRatio || 1;
        const viewport = pagina.getViewport({ scale: escala * fator });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / fator)}px`;
        canvas.style.height = `${Math.floor(viewport.height / fator)}px`;
        tarefa = pagina.render({ canvas, viewport });
        await tarefa.promise;
      } catch (causa) {
        // Cancelar a renderização também rejeita a promessa: isso não é falha de leitura.
        if (cancelado) return;
        setErro(causa instanceof Error ? causa.message : 'Não foi possível desenhar a página.');
      }
    })();

    return () => {
      cancelado = true;
      tarefa?.cancel();
    };
  }, [doc, paginaAtual, escala]);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);

    void (async () => {
      try {
        const url = item.arquivoCaminho
          ? await bibliotecaService.assinarArquivo(item.arquivoCaminho)
          : item.arquivoUrl;
        if (!url) throw new Error('Este material não tem arquivo para leitura.');

        const tarefa = pdfjs.getDocument({ url });
        tarefaRef.current = tarefa;
        const documento = await tarefa.promise;
        const primeiraPagina = await documento.getPage(1);
        const largura = primeiraPagina.getViewport({ scale: 1 }).width;
        const indiceDoArquivo = await lerSumario(documento);
        if (!ativo) return;

        setLarguraBase(largura);
        setSumario(indiceDoArquivo);
        setSumarioAberto(indiceDoArquivo.length > 0);
        setPaginaAtual(1);
        setDoc(documento);
      } catch (causa) {
        if (ativo) setErro(causa instanceof Error ? causa.message : 'Não foi possível abrir o PDF.');
      } finally {
        if (ativo) setCarregando(false);
      }
    })();

    return () => {
      ativo = false;
      void tarefaRef.current?.destroy().catch(() => undefined);
      tarefaRef.current = null;
    };
  }, [item.arquivoCaminho, item.arquivoUrl]);

  // Ao abrir o manual, a página nasce ajustada à largura disponível.
  useEffect(() => {
    const corpo = corpoRef.current;
    if (!larguraBase || !corpo) return;
    const disponivel = corpo.clientWidth - 32;
    if (disponivel <= 0) return;
    setEscala(Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, Number((disponivel / larguraBase).toFixed(2)))));
  }, [larguraBase]);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      const alvo = evento.target as HTMLElement | null;
      if (alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA')) return;
      if (evento.key === 'ArrowLeft') setPaginaAtual((atual) => Math.max(1, atual - 1));
      if (evento.key === 'ArrowRight') setPaginaAtual((atual) => Math.min(totalPaginas || 1, atual + 1));
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [totalPaginas]);

  const irParaPagina = useCallback(
    (numero: number) => {
      const limite = totalPaginas || 1;
      const destino = Number.isFinite(numero) ? Math.min(limite, Math.max(1, Math.floor(numero))) : 1;
      setPaginaAtual(destino);
    },
    [totalPaginas],
  );

  const ajustarZoom = (delta: number) =>
    setEscala((atual) => Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, Number((atual + delta).toFixed(2)))));

  const ajustarLargura = () => {
    const corpo = corpoRef.current;
    if (!corpo || !larguraBase) return;
    const disponivel = corpo.clientWidth - 32;
    if (disponivel <= 0) return;
    setEscala(Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, Number((disponivel / larguraBase).toFixed(2)))));
  };

  const executarBusca = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const alvo = termo.trim().toLowerCase();
    setBuscaFeita(false);
    if (!doc || alvo.length < MINIMO_BUSCA) {
      setResultados([]);
      return;
    }

    setBuscando(true);
    try {
      const achados: ResultadoBusca[] = [];
      for (let numero = 1; numero <= doc.numPages && achados.length < LIMITE_RESULTADOS; numero += 1) {
        const pagina = await doc.getPage(numero);
        const texto = await pagina.getTextContent();
        const conteudo = texto.items.map((itemTexto) => ('str' in itemTexto ? itemTexto.str : ' ')).join(' ');
        const posicao = conteudo.toLowerCase().indexOf(alvo);
        if (posicao >= 0) {
          achados.push({
            pagina: numero,
            trecho: conteudo
              .slice(Math.max(0, posicao - 40), posicao + alvo.length + 40)
              .replace(/\s+/g, ' ')
              .trim(),
          });
        }
      }
      setResultados(achados);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível buscar no manual.');
    } finally {
      setBuscando(false);
      setBuscaFeita(true);
    }
  };

  return (
    <OverlayLeitor
      titulo={item.titulo}
      subtitulo={item.subtitulo ? `${rotuloCategoria(item.categoria)} · ${item.subtitulo}` : rotuloCategoria(item.categoria)}
      icone={<FileText className="h-5 w-5" aria-hidden="true" />}
      onFechar={onFechar}
      corpoClassName="flex-col bg-[#24201a]"
      acoes={
        <>
          <div className="flex items-center border border-[#4b3823] bg-[#0e0a07]">
            <button
              type="button"
              onClick={() => ajustarZoom(-PASSO_ESCALA)}
              disabled={escala <= ESCALA_MINIMA}
              title="Diminuir zoom"
              aria-label="Diminuir zoom"
              className={`p-2 text-[#c5a665] transition-colors hover:bg-[#2d1e12] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[3.5rem] border-x border-[#4b3823] px-2 text-center font-serif text-xs text-[#cbb887]" aria-live="polite">
              {Math.round(escala * 100)}%
            </span>
            <button
              type="button"
              onClick={() => ajustarZoom(PASSO_ESCALA)}
              disabled={escala >= ESCALA_MAXIMA}
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
              className={`p-2 text-[#c5a665] transition-colors hover:bg-[#2d1e12] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setEscala(1)}
              title="Restaurar zoom"
              aria-label="Restaurar zoom"
              className={`border-l border-[#4b3823] p-2 text-[#9e8052] transition-colors hover:bg-[#2d1e12] hover:text-[#e0bd71] ${focusRing}`}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={ajustarLargura}
            title="Ajustar à largura"
            aria-label="Ajustar à largura"
            className={`border border-[#4b3823] bg-[#21160d] p-2 text-[#c5a665] transition-colors hover:border-[#a88d61] hover:text-[#ead8ae] ${focusRing}`}
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          <form onSubmit={executarBusca} className="flex min-w-[min(100%,15rem)] flex-1 border border-[#4b3823] bg-[#0e0a07] sm:flex-none">
            <label htmlFor="busca-manual" className="sr-only">
              Buscar no manual
            </label>
            <Search className="m-2 h-4 w-4 shrink-0 text-[#8c6b41]" aria-hidden="true" />
            <input
              id="busca-manual"
              type="search"
              value={termo}
              onChange={(evento) => setTermo(evento.target.value)}
              placeholder="Buscar no manual"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 font-serif text-xs text-[#e6ddc5] placeholder:text-[#756044] focus:outline-none"
            />
            <button
              type="submit"
              disabled={buscando}
              title="Buscar no manual"
              aria-label="Buscar no manual"
              className={`border-l border-[#4b3823] px-2 text-[#c5a665] transition-colors hover:bg-[#2d1e12] hover:text-[#ead8ae] disabled:opacity-50 ${focusRing}`}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {entradasIndice.length > 0 && (
            <button
              type="button"
              onClick={() => setSumarioAberto((aberto) => !aberto)}
              title={sumarioAberto ? 'Ocultar índice' : 'Mostrar índice'}
              aria-label={sumarioAberto ? 'Ocultar índice' : 'Mostrar índice'}
              aria-pressed={sumarioAberto}
              className={`inline-flex items-center gap-2 border border-[#4b3823] bg-[#21160d] px-3 py-2 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c5a665] transition-colors hover:border-[#a88d61] hover:text-[#ead8ae] ${focusRing}`}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Índice</span>
            </button>
          )}
        </>
      }
    >
      {carregando ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <LoadingState label="Abrindo o manual…" />
        </div>
      ) : erro || !doc ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <ErrorState
            title="Não foi possível abrir o manual"
            description={erro ?? 'O arquivo deste material não está disponível.'}
          />
        </div>
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-[#4b3823] bg-[#130e09] px-3 py-2">
            <button
              type="button"
              onClick={() => irParaPagina(paginaAtual - 1)}
              disabled={paginaAtual <= 1}
              title="Página anterior"
              aria-label="Página anterior"
              className={`border border-[#4b3823] bg-[#21160d] p-1.5 text-[#c5a665] transition-colors hover:border-[#a88d61] hover:text-[#ead8ae] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <label htmlFor="pagina-manual" className="sr-only">
              Página
            </label>
            <input
              id="pagina-manual"
              type="number"
              min={1}
              max={totalPaginas}
              value={paginaAtual}
              onChange={(evento) => irParaPagina(Number(evento.target.value))}
              className="w-16 border border-[#4b3823] bg-[#0e0a07] px-2 py-1.5 text-center font-serif text-xs text-[#e6ddc5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
            />
            <span className="font-serif text-xs text-[#9e8052]">de {totalPaginas}</span>

            <button
              type="button"
              onClick={() => irParaPagina(paginaAtual + 1)}
              disabled={paginaAtual >= totalPaginas}
              title="Próxima página"
              aria-label="Próxima página"
              className={`border border-[#4b3823] bg-[#21160d] p-1.5 text-[#c5a665] transition-colors hover:border-[#a88d61] hover:text-[#ead8ae] disabled:cursor-not-allowed disabled:opacity-35 ${focusRing}`}
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {buscaFeita && (
            <div className="shrink-0 border-b border-[#4b3823] bg-[#17100b] px-3 py-2" role="status" aria-live="polite">
              {resultados.length === 0 ? (
                <p className="font-serif text-xs text-[#9e8052]">Nenhuma ocorrência encontrada no manual.</p>
              ) : (
                <ul className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {resultados.map((resultado) => (
                    <li key={`${resultado.pagina}-${resultado.trecho}`}>
                      <button
                        type="button"
                        onClick={() => irParaPagina(resultado.pagina)}
                        className={`border border-[#4b3823] bg-[#0e0a07] px-2 py-1 text-left font-serif text-[11px] text-[#c9b88e] transition-colors hover:border-[#a88d61] hover:text-[#ead8ae] ${focusRing}`}
                      >
                        <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#d1a85a]">
                          pág. {resultado.pagina}
                        </span>{' '}
                        …{resultado.trecho}…
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="relative flex min-h-0 flex-1">
            {sumarioAberto && entradasIndice.length > 0 && (
              <aside
                className="absolute inset-y-0 left-0 z-10 w-full max-w-[20rem] overflow-y-auto border-r border-[#4b3823] bg-[#130e09] p-4 shadow-[0_0_24px_rgba(0,0,0,0.6)] md:static md:z-auto md:w-64 md:max-w-none md:shadow-none"
                aria-label="Índice do manual"
              >
                <div className="mb-4 border-b border-[#3a2c1d] pb-3">
                  <p className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">Índice</p>
                  <p className="mt-1 font-serif text-xs italic text-[#80613d]">
                    {sumario.length > 0 ? 'Sumário do próprio arquivo' : 'Índice cadastrado'}
                  </p>
                </div>
                <nav aria-label={`Capítulos de ${item.titulo}`} className="space-y-1">
                  {entradasIndice.map((entrada, posicao) => (
                    <button
                      key={`${entrada.pagina}-${posicao}-${entrada.titulo}`}
                      type="button"
                      onClick={() => irParaPagina(entrada.pagina)}
                      aria-current={paginaAtual === entrada.pagina ? 'page' : undefined}
                      style={{ paddingLeft: `${0.75 + entrada.profundidade * 0.75}rem` }}
                      className={`flex w-full items-start gap-2 border-l-2 py-2 pr-3 text-left font-serif text-xs transition-colors ${focusRing} ${
                        paginaAtual === entrada.pagina
                          ? 'border-[#d1a85a] bg-[#2b1c10] text-[#e1c681]'
                          : 'border-[#3a2c1d] text-[#9e8b6c] hover:border-[#8c6b41] hover:bg-[#21160d] hover:text-[#d7c69d]'
                      }`}
                    >
                      <span className="mt-0.5 min-w-[1.2rem] font-cinzel text-[10px] text-[#80613d]">{entrada.pagina}</span>
                      <span>{entrada.titulo}</span>
                    </button>
                  ))}
                </nav>
              </aside>
            )}

            <div ref={corpoRef} className="min-w-0 flex-1 overflow-auto p-2 sm:p-5">
              <div className="flex min-h-full justify-center">
                <canvas
                  ref={canvasRef}
                  className="border border-[#5a4225] bg-white shadow-[0_4px_22px_rgba(0,0,0,0.55)]"
                  aria-label={`Página ${paginaAtual} de ${totalPaginas} de ${item.titulo}`}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </OverlayLeitor>
  );
};

export default LeitorPdf;
