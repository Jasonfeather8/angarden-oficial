import { useQuery } from '@tanstack/react-query';
import { grimorioBloqueioService } from '../../services/grimorioBloqueioService';
import { grimorioVolumes } from '../../mocks/grimorio';

/**
 * Escolas e tomos selados pelo Mestre para o cliente autenticado, com as
 * checagens de bloqueio usadas pela navegação do Grimório.
 */
export function useBloqueiosDoGrimorio(tenantId: string | null) {
  const bloqueiosQuery = useQuery({
    queryKey: ['grimorio', 'bloqueios', tenantId],
    queryFn: () => grimorioBloqueioService.listar(),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(tenantId),
  });
  const escolasBloqueadas = bloqueiosQuery.data?.escolas ?? [];
  const volumesBloqueados = bloqueiosQuery.data?.volumes ?? [];
  // Selar uma escola "guarda-chuva" grava também as subescolas dela (o serviço faz a expansão),
  // então a checagem aqui é sempre pelo id exato — igual ao que a RLS aplica.
  const escolaBloqueada = (schoolId: string) => escolasBloqueadas.includes(schoolId);
  const volumeBloqueado = (volumeId: string) => {
    const volume = grimorioVolumes.find((item) => item.id === volumeId);
    return volumesBloqueados.includes(volumeId) || Boolean(volume && escolaBloqueada(volume.schoolId));
  };

  return { escolasBloqueadas, volumesBloqueados, escolaBloqueada, volumeBloqueado };
}
