import React from 'react';
import { MedievalFrame } from './MedievalFrame';

export type PageShellVariant = 'estreito' | 'padrao' | 'amplo';

export function larguraDaPagina(variant: PageShellVariant): string {
  switch (variant) {
    case 'estreito':
      return 'max-w-[720px]';
    case 'padrao':
      return 'max-w-[1200px]';
    case 'amplo':
      return 'max-w-[1440px]';
  }
}

export function variantDaRota(pathname: string): PageShellVariant {
  return pathname === '/personagens' || pathname.startsWith('/ficha') ? 'amplo' : 'padrao';
}

/**
 * Faixa vertical da moldura dentro da casca: topo (56 px) mais os gutters da <main>.
 * Sem altura fixa, a moldura cresce com o conteúdo e a <main> é quem rola.
 */
const faixaMinima = 'min-h-[calc(100dvh-80px)] sm:min-h-[calc(100dvh-96px)] lg:min-h-[calc(100dvh-112px)]';

/**
 * Exceção documentada das duas telas densas (Personagens e Ficha Técnica): a partir de
 * `lg` a moldura trava na faixa exata e o conteúdo rola por dentro dela, para os painéis
 * de 3 colunas terem altura previsível. Abaixo de `lg` ela volta a crescer e quem rola
 * é a <main>, como nas demais telas.
 */
const faixaFixa = 'min-h-[640px] sm:min-h-[calc(100dvh-96px)] lg:h-[calc(100dvh-112px)] lg:min-h-[calc(100dvh-112px)]';

export interface PageShellProps {
  id?: string;
  variant?: PageShellVariant;
  title?: React.ReactNode;
  subtitle?: string;
  headerRight?: React.ReactNode;
  contentClassName?: string;
  noHeader?: boolean;
  className?: string;
  /** Altura fixa a partir de `lg` com rolagem interna: só para as telas densas. */
  fill?: boolean;
  children: React.ReactNode;
}

export function PageShell({
  id,
  variant = 'padrao',
  title,
  subtitle,
  headerRight,
  contentClassName,
  noHeader,
  className = '',
  fill = false,
  children,
}: PageShellProps) {
  const largura = larguraDaPagina(variant);

  // A moldura é o papel do sistema e tem sempre o mesmo formato; varia a largura da variante e a medida do conteúdo dentro dela.
  return (
    <div id={id} className={`mx-auto flex w-full flex-col ${largura} ${fill ? faixaFixa : faixaMinima} ${className}`}>
      <MedievalFrame
        className="flex-1"
        scrollable={fill}
        title={title}
        subtitle={subtitle}
        headerRight={headerRight}
        contentClassName={contentClassName}
        noHeader={noHeader}
      >
        {children}
      </MedievalFrame>
    </div>
  );
}

export default PageShell;
