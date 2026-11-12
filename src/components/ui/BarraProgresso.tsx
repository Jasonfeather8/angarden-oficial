import React from 'react';
import { clsx } from 'clsx';

export interface BarraProgressoProps {
  rotulo: string;
  atual: number;
  max: number;
  /** Substitui o texto do valor à direita; por padrão mostra "atual / max". */
  valorTexto?: React.ReactNode;
  /** Percentual a partir do qual o preenchimento vira bronze-avermelhado. Use 0 para nunca sinalizar. */
  limiarCritico?: number;
  className?: string;
}

/**
 * Barra de progresso da paleta medieval, usada para vitais e progressões.
 * Abaixo do limiar crítico o preenchimento muda de dourado para bronze-avermelhado,
 * o que permite ao Mestre localizar um problema com uma olhada.
 */
export const BarraProgresso: React.FC<BarraProgressoProps> = ({
  rotulo,
  atual,
  max,
  valorTexto,
  limiarCritico = 25,
  className,
}) => {
  const proporcao = max > 0 ? Math.min(100, Math.max(0, (atual / max) * 100)) : 0;
  const critico = limiarCritico > 0 && proporcao <= limiarCritico;

  return (
    <div className={clsx('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#a88d61]">{rotulo}</span>
        <span className="font-serif text-xs text-[#dcd1ba]">
          {valorTexto ?? (
            <>
              {atual} <span className="text-[#88745a]">/ {max}</span>
            </>
          )}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full border border-[#3a2c1d] bg-[#221609]">
        <div
          className={clsx(
            'h-full rounded-full',
            critico ? 'bg-gradient-to-r from-[#7a2f1f] to-[#c9704a]' : 'bg-gradient-to-r from-[#735126] to-[#d1a85a]'
          )}
          style={{ width: `${proporcao}%` }}
        />
      </div>
    </div>
  );
};

export default BarraProgresso;
