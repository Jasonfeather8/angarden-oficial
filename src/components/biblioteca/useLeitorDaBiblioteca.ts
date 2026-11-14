import { useCallback, useState } from 'react';
import type { ItemBiblioteca } from '@/types';

/**
 * Material aberto no leitor. Fica fora da estante para que abrir um tomo não
 * remonte a lista, e o leitor só monta (e baixa o pdf.js) quando há material.
 */
export function useLeitorDaBiblioteca() {
  const [materialAberto, setMaterialAberto] = useState<ItemBiblioteca | null>(null);

  const abrirMaterial = useCallback((item: ItemBiblioteca) => setMaterialAberto(item), []);
  const fecharMaterial = useCallback(() => setMaterialAberto(null), []);

  return { materialAberto, abrirMaterial, fecharMaterial };
}
