import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { compressImage } from '../utils/imageCompressor';
import { withTimeout } from '../utils/withTimeout';
import {
  atualizarMagia,
  LIMITE_IMAGEM_PESADA_BYTES,
  listarImagensPesadas,
  listarMagiasPorIds,
  ImagemPesada,
} from '../services/grimorioService';

const TAMANHO_LOTE = 3;

/**
 * Ação administrativa única: recomprime em lotes as imagens legadas do grimório,
 * que guardam o base64 original e tornam a leitura do livro lenta.
 */
export function useOtimizarImagensGrimorio(habilitado: boolean) {
  const queryClient = useQueryClient();
  const [imagensPesadas, setImagensPesadas] = useState<ImagemPesada[]>([]);
  const [processando, setProcessando] = useState(false);
  const [processadas, setProcessadas] = useState(0);
  const [erroOtimizacao, setErroOtimizacao] = useState<string | null>(null);

  useEffect(() => {
    if (!habilitado) return;
    let ativo = true;
    void listarImagensPesadas()
      .then((lista) => { if (ativo) setImagensPesadas(lista); })
      .catch(() => { if (ativo) setImagensPesadas([]); });
    return () => { ativo = false; };
  }, [habilitado]);

  const bytesPesados = imagensPesadas.reduce((total, imagem) => total + imagem.bytes, 0);

  const otimizarImagens = async () => {
    if (processando || !imagensPesadas.length) return;
    setProcessando(true);
    setErroOtimizacao(null);
    setProcessadas(0);

    try {
      for (let indice = 0; indice < imagensPesadas.length; indice += TAMANHO_LOTE) {
        const lote = imagensPesadas.slice(indice, indice + TAMANHO_LOTE);
        const { magias } = await withTimeout(listarMagiasPorIds(lote.map((item) => item.id)));

        for (const magia of magias) {
          if (!magia.image || magia.image.length < LIMITE_IMAGEM_PESADA_BYTES) continue;
          const comprimida = await compressImage(magia.image, 600, 600, 0.82);
          if (!comprimida || comprimida.length >= magia.image.length) continue;
          await atualizarMagia({ ...magia, image: comprimida });
        }

        setProcessadas(Math.min(indice + TAMANHO_LOTE, imagensPesadas.length));
      }

      await queryClient.invalidateQueries({ queryKey: ['grimorio'] });
      setImagensPesadas(await listarImagensPesadas());
    } catch (error) {
      setErroOtimizacao(error instanceof Error ? error.message : String(error));
    } finally {
      setProcessando(false);
    }
  };

  return { imagensPesadas, bytesPesados, processando, processadas, erroOtimizacao, otimizarImagens };
}
