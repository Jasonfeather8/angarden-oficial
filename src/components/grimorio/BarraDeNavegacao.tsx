import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { View } from './useNavegacaoDoGrimorio';

interface BarraDeNavegacaoProps {
  schoolName: string;
  branch: string;
  view: View;
  volumeTitle: string;
  onVoltar: () => void;
}

/** Trilha da escola, ramo e tomo abertos, com o retorno à tela anterior. */
export const BarraDeNavegacao = ({ schoolName, branch, view, volumeTitle, onVoltar }: BarraDeNavegacaoProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3a2c1d] pb-4">
    <button type="button" onClick={onVoltar} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#b49768] transition hover:text-[#f0d68b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]"><ArrowLeft size={16} /> Voltar</button>
    <p className="font-cinzel text-xs uppercase tracking-widest text-[#e6ddc5]">{schoolName}{branch ? ` · ${branch}` : ''}{view === 'book' ? ` · ${volumeTitle}` : view === 'element-tree' ? ' · Seleção de elementos' : view === 'mental-tree' ? ' · Seleção de subcategorias' : ' · Árvore de volumes'}</p>
  </div>
);
