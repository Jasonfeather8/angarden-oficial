export const TAMANHO_MINIMO_BUSCA = 3;

export function normalizarBusca(termo: string): string {
  return termo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[%_\\]/g, '')
    .trim()
    .toLowerCase();
}
