import React from 'react';
import { Lock } from 'lucide-react';
import { grimorioAllSchools, grimorioVolumes } from '../../mocks/grimorio';

interface TreeViewProps {
  school: typeof grimorioAllSchools[number];
  volumes: typeof grimorioVolumes;
  onChooseVolume: (id: string) => void;
  escolaEstaBloqueada: boolean;
  escolasBloqueadas: string[];
  volumesBloqueados: string[];
  podeAbrirBloqueada: boolean;
}

/** Árvore dos tomos da escola selecionada. */
export const TreeView = ({ school, volumes, onChooseVolume, escolaEstaBloqueada, escolasBloqueadas, volumesBloqueados, podeAbrirBloqueada }: TreeViewProps) => (
  <section aria-labelledby="tree-heading" className="space-y-6"><div className="text-center"><p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Árvore de volumes</p><h3 id="tree-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">Os tomos de {school.name}</h3><p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">Selecione um volume para abrir suas páginas e consultar as magias guardadas.</p></div><div className="relative mx-auto max-w-3xl py-5"><div className="absolute bottom-10 left-1/2 top-10 hidden w-px -translate-x-1/2 bg-[#6b4f2d] sm:block" /><div className="space-y-4">{volumes.map((volume, index) => {
    const bloqueado = escolaEstaBloqueada || escolasBloqueadas.includes(volume.schoolId) || volumesBloqueados.includes(volume.id);
    return <div key={volume.id} className={`relative flex items-center gap-3 sm:gap-6 ${index % 2 ? 'sm:flex-row-reverse' : ''}`}><div className="hidden h-px flex-1 bg-[#6b4f2d]/70 sm:block" /><button type="button" onClick={() => onChooseVolume(volume.id)} aria-disabled={bloqueado && !podeAbrirBloqueada} aria-label={`${volume.title}${bloqueado ? ' — Selado pelo Mestre' : ''}`} title={bloqueado ? 'Selado pelo Mestre' : volume.description} className="group relative z-10 flex w-full items-center gap-4 border border-[#654b2c] bg-[#1a120c] p-4 text-left shadow-[0_7px_18px_rgba(0,0,0,0.4)] transition hover:border-[#c19a57] hover:bg-[#25190e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] sm:w-[45%]"><span className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#9b7c43] bg-[#2b1d10] font-cinzel text-xl text-[#d7b866]">{volume.number}</span><span className="min-w-0"><span className="block font-cinzel text-sm uppercase tracking-wider text-[#e6ddc5] group-hover:text-[#f0d68b]">{volume.title}</span><span className="mt-1 block text-xs italic text-[#a88d61]">{volume.subtitle}</span><span className="mt-2 block text-[10px] text-[#8f806a]">{volume.description}</span>{bloqueado && <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[#d6b56a]"><Lock size={12} aria-hidden="true" /> Selado</span>}</span>{bloqueado && <Lock className="ml-auto h-4 w-4 shrink-0 text-[#d6b56a]" aria-hidden="true" />}</button><div className="hidden flex-1 sm:block" /></div>;
  })}</div></div></section>
);
