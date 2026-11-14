import React from 'react';
import { GothicButton } from '../GothicButton';
import { formatarMegabytes } from './formatters';

interface AvisoDeImagensPesadasProps {
  total: number;
  bytesPesados: number;
  processando: boolean;
  processadas: number;
  erroOtimizacao: string | null;
  onOtimizar: () => void;
}

/** Aviso de otimização das imagens do grimório ainda no tamanho original. */
export const AvisoDeImagensPesadas = ({ total, bytesPesados, processando, processadas, erroOtimizacao, onOtimizar }: AvisoDeImagensPesadasProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border border-[#5a4225] bg-[#1c140d] px-4 py-3">
    <p className="text-xs text-[#c4b9a3]">
      {total} imagens do grimório ainda estão no tamanho original ({formatarMegabytes(bytesPesados)} MB) e deixam a leitura do livro lenta.
      {processando && <span className="ml-2 uppercase tracking-widest text-[#c6a15b]">Otimizando… {processadas}/{total}</span>}
      {erroOtimizacao && <span className="ml-2 text-[#d98f6a]">{erroOtimizacao}</span>}
    </p>
    <GothicButton type="button" variant="secondary" size="xs" width={170} disabled={processando} onClick={onOtimizar}>
      {processando ? 'Otimizando…' : 'Otimizar imagens'}
    </GothicButton>
  </div>
);
