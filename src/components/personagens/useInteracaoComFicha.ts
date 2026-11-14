import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fichaPath } from '../../routes/paths';
import { useFichaStore } from '../../store/useFichaStore';

/**
 * Interação com a ficha a partir da galeria: abre a ficha do personagem e
 * pré-aquece a leitura ao passar o mouse (com debounce de 180 ms).
 */
export function useInteracaoComFicha() {
  const navigate = useNavigate();
  const setCharacterId = useFichaStore((state) => state.setCharacterId);
  const prewarmFicha = useFichaStore((state) => state.prewarmFicha);
  const prewarmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (prewarmTimerRef.current) clearTimeout(prewarmTimerRef.current);
    },
    []
  );

  const agendarPrewarmDaFicha = useCallback(
    (id: string) => {
      if (prewarmTimerRef.current) clearTimeout(prewarmTimerRef.current);
      prewarmTimerRef.current = setTimeout(() => {
        prewarmTimerRef.current = null;
        void prewarmFicha(id);
      }, 180);
    },
    [prewarmFicha]
  );

  const abrirFicha = useCallback(
    (id: string) => {
      setCharacterId(id);
      navigate(fichaPath(id));
    },
    [navigate, setCharacterId]
  );

  return { abrirFicha, agendarPrewarmDaFicha };
}
