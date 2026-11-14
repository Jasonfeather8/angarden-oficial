import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { TenantCharacter } from '../../types';

export interface CarrosselDePersonagensInput {
  filteredCharacters: TenantCharacter[];
  activeIndex: number;
  setActiveCharacterId: (id: string) => void;
}

/**
 * Roda de personagens: rolagem circular com a rodinha do mouse (bloqueando o
 * scroll da página) e arraste por toque/mouse. `hasMovedRef` distingue o clique
 * do arraste e é lido pelo item da lista.
 */
export function useCarrosselDePersonagens({
  filteredCharacters,
  activeIndex,
  setActiveCharacterId,
}: CarrosselDePersonagensInput) {
  const listWheelContainerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startIndexRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Rolagem circular nativa com a rodinha do mouse (bloqueia o scroll da página)
  useEffect(() => {
    const container = listWheelContainerRef.current;
    if (!container) return;

    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const total = filteredCharacters.length;
      if (total <= 1) return;

      const now = Date.now();
      if (now - lastWheelTime.current < 60) return; // suave e ágil

      if (e.deltaY > 0) {
        const nextIndex = (activeIndex + 1) % total;
        if (filteredCharacters[nextIndex]) {
          setActiveCharacterId(filteredCharacters[nextIndex].id);
          lastWheelTime.current = now;
        }
      } else if (e.deltaY < 0) {
        const prevIndex = (activeIndex - 1 + total) % total;
        if (filteredCharacters[prevIndex]) {
          setActiveCharacterId(filteredCharacters[prevIndex].id);
          lastWheelTime.current = now;
        }
      }
    };

    container.addEventListener('wheel', onWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', onWheelNative);
    };
  }, [filteredCharacters, activeIndex, setActiveCharacterId]);

  // Início de toque/clique
  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    startYRef.current = e.clientY;
    startIndexRef.current = activeIndex;
  };

  // Movimento de arraste circular - apenas quando o ponteiro estiver realmente pressionado
  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;

    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(deltaY) > 8) {
      hasMovedRef.current = true;
      setIsDragging(true);

      const stepHeight = 44; // pixels necessários para avançar 1 item
      const steps = Math.round(-deltaY / stepHeight);
      const total = filteredCharacters.length;
      if (total > 0) {
        const targetIndex = ((startIndexRef.current + steps) % total + total) % total;
        if (targetIndex !== activeIndex && filteredCharacters[targetIndex]) {
          setActiveCharacterId(filteredCharacters[targetIndex].id);
        }
      }
    }
  };

  // Término do clique/arraste
  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    setTimeout(() => {
      hasMovedRef.current = false;
      setIsDragging(false);
    }, 60);
  };

  return {
    listWheelContainerRef,
    isDragging,
    hasMovedRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

export type CarrosselDePersonagensState = ReturnType<typeof useCarrosselDePersonagens>;
