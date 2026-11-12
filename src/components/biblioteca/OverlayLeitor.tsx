import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface OverlayLeitorProps {
  titulo: string;
  subtitulo?: string;
  icone: React.ReactNode;
  /** Controles do cabeçalho, à esquerda do botão de fechar. */
  acoes?: React.ReactNode;
  onFechar: () => void;
  children: React.ReactNode;
  /** Faixa do corpo: o PDF rola sobre superfície escura, o pergaminho sobre o papel. */
  corpoClassName?: string;
}

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]';

/**
 * Casca dos leitores da Biblioteca: tela cheia, título, ações e fechamento por
 * `Esc`. Cada leitor decide a superfície e o conteúdo do corpo.
 */
export const OverlayLeitor: React.FC<OverlayLeitorProps> = ({
  titulo,
  subtitulo,
  icone,
  acoes,
  onFechar,
  children,
  corpoClassName,
}) => {
  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onFechar();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex h-screen w-screen flex-col bg-[#0c0906]/[.98] text-[#e6ddc5]"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <header className="flex shrink-0 flex-col gap-3 border-b border-[#5a4225] bg-[#17100b] px-4 py-3 shadow-[0_4px_18px_rgba(0,0,0,0.65)] sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden border border-[#6d512e] bg-[#281b11] p-2 text-[#d1a85a] sm:block">{icone}</div>
          <div className="min-w-0">
            <h2 className="truncate font-cinzel text-sm font-bold uppercase tracking-wider text-[#ead8ae] sm:text-base">
              {titulo}
            </h2>
            {subtitulo && <p className="truncate font-serif text-xs italic text-[#9e8052]">{subtitulo}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {acoes}
          <button
            type="button"
            onClick={onFechar}
            title="Fechar leitor"
            aria-label="Fechar leitor"
            className={`border border-[#8c6b41] bg-[#3a2016] p-2 text-[#e1b28a] transition-colors hover:border-[#d1a85a] hover:bg-[#54291a] hover:text-[#ffe0bb] ${focusRing}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className={clsx('flex min-h-0 flex-1', corpoClassName)}>{children}</div>
    </div>
  );
};

export default OverlayLeitor;
