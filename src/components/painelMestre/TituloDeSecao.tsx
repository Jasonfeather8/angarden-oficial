import React from 'react';

export interface TituloDeSecaoProps {
  children: React.ReactNode;
  /** Conteúdo à direita do filete (contagens e legendas da seção). */
  extra?: React.ReactNode;
}

/** Cabeçalho de seção do painel: título em Cinzel, filete e conteúdo à direita. */
export const TituloDeSecao: React.FC<TituloDeSecaoProps> = ({ children, extra }) => (
  <div className="flex items-center gap-3">
    <h2 className="font-cinzel text-[10px] font-bold uppercase tracking-[0.2em] text-[#d1a85a]">{children}</h2>
    <span aria-hidden="true" className="h-px flex-1 bg-[#3a2c1d]" />
    {extra}
  </div>
);

export default TituloDeSecao;
