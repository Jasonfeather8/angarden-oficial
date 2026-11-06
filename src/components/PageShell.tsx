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

export interface PageShellProps {
  id?: string;
  variant?: PageShellVariant;
  title?: React.ReactNode;
  subtitle?: string;
  headerRight?: React.ReactNode;
  contentClassName?: string;
  noHeader?: boolean;
  className?: string;
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
  children,
}: PageShellProps) {
  const largura = larguraDaPagina(variant);

  // A moldura é o papel do sistema e tem sempre o mesmo formato; varia a largura da variante e a medida do conteúdo dentro dela.
  return (
    <div id={id} className={`mx-auto flex w-full flex-col ${largura} min-h-[calc(100dvh-80px)] sm:min-h-[calc(100dvh-96px)] lg:min-h-[calc(100dvh-112px)] ${className}`}>
      <MedievalFrame
        className="flex-1"
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
