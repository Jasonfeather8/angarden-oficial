import type { GrimorioSpell } from '../mocks/grimorio';
import { getSchoolVolumes } from '../mocks/grimorio';
import { buscarMagias, listarMagiasDoVolume } from './grimorioService';
import { withTimeout } from '../utils/withTimeout';

export const TAMANHO_FOLIO = 10;
export const ESCOLA_INICIAL_DO_GRIMORIO = 'elementar';

export interface FolioGrimorioParams {
  volumeId?: string;
  busca?: string;
  page: number;
}

export type PaginaGrimorio = { magias: GrimorioSpell[]; ocultas: string[]; total: number };

export const chaveFolioGrimorio = ({ volumeId, busca, page }: FolioGrimorioParams) => [
  'grimorio',
  busca
    ? { busca, page, pageSize: TAMANHO_FOLIO }
    : { volumeId, page, pageSize: TAMANHO_FOLIO },
];

export const carregarFolioGrimorio = ({ volumeId, busca, page }: FolioGrimorioParams) => withTimeout(
  busca
    ? buscarMagias(busca, { page, pageSize: TAMANHO_FOLIO })
    : listarMagiasDoVolume(volumeId ?? '', { page, pageSize: TAMANHO_FOLIO }),
);

export const folioInicialDoGrimorio = (): FolioGrimorioParams => ({
  volumeId: getSchoolVolumes(ESCOLA_INICIAL_DO_GRIMORIO)[0]?.id,
  page: 1,
});
