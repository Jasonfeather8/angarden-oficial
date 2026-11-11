import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryOrnamentTab } from './CategoryOrnamentTab';

export interface CategoryTabItem {
  id: string;
  label: string;
  isEpic?: boolean;
  icon: React.ReactNode;
}

interface InfiniteCategoryScrollProps {
  tabs: CategoryTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  themeMode?: 'default' | 'epico' | 'arcano';
}

export const InfiniteCategoryScroll: React.FC<InfiniteCategoryScrollProps> = React.memo(function InfiniteCategoryScroll({
  tabs,
  activeId,
  onSelect,
  themeMode = 'default',
}: InfiniteCategoryScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const dragDistanceRef = useRef(0);

  const [isGrabbing, setIsGrabbing] = useState(false);

  // Criamos 3 repetições para garantir loop infinito contínuo e sem emendas
  const repeatedTabs = useMemo(() => [...tabs, ...tabs, ...tabs], [tabs]);
  const numTabs = tabs.length;

  // Inicializa o scroll no bloco central
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Aguarda medição dos elementos renderizados
    const timer = setTimeout(() => {
      const singleSetWidth = container.scrollWidth / 3;
      if (container.scrollLeft === 0) {
        container.scrollLeft = singleSetWidth;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [tabs]);

  // Checagem de teletransporte para manter o loop infinito de forma imperceptível
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const singleSetWidth = container.scrollWidth / 3;
    if (singleSetWidth <= 0) return;

    // Se passou do segundo terço para a direita, recua 1 bloco
    if (container.scrollLeft >= singleSetWidth * 2) {
      container.scrollLeft -= singleSetWidth;
    } 
    // Se passou do primeiro terço para a esquerda, avança 1 bloco
    else if (container.scrollLeft <= singleSetWidth * 0.1) {
      container.scrollLeft += singleSetWidth;
    }
  }, []);

  // Interação por Roda do Mouse (Wheel) horizontal
  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Já está rolando no eixo X nativo
      return;
    }
    // Converte scroll vertical em horizontal suavemente
    containerRef.current.scrollLeft += e.deltaY * 0.8;
  };

  // Suporte a Mouse Drag (Arrastar com o mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    setIsGrabbing(true);
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    dragDistanceRef.current = Math.abs(walk);
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsGrabbing(false);
  };

  // Scroll manual via botões chevrons laterais
  const scrollByAmount = (amount: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  // Centraliza o item selecionado suavemente
  const handleItemClick = (tabId: string, elementIndex: number) => {
    // Se o usuário estava arrastando mais de 5px, não dispara o clique
    if (dragDistanceRef.current > 6) {
      return;
    }
    onSelect(tabId);

    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('[data-tab-item]');
    const targetItem = items[elementIndex];
    if (targetItem) {
      const containerWidth = container.offsetWidth;
      const itemLeft = targetItem.offsetLeft;
      const itemWidth = targetItem.offsetWidth;
      const targetScroll = itemLeft - (containerWidth / 2) + (itemWidth / 2);

      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="relative w-full py-4 select-none group/scroll"
      onMouseLeave={handleMouseUp}
    >
      {/* Botão de navegação Esquerda */}
      <button
        onClick={() => scrollByAmount(-220)}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-40 w-8 h-12 items-center justify-center bg-[#151a1e]/90 hover:bg-[#222930] text-[#c5a059] hover:text-[#fde68a] border-y border-r border-[#546473]/70 hover:border-[#c5a059] rounded-r-xs transition-all duration-200 opacity-70 hover:opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.9)] focus:outline-none cursor-pointer"
        title="Rolar para a esquerda"
        aria-label="Rolar para a esquerda"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Botão de navegação Direita */}
      <button
        onClick={() => scrollByAmount(220)}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-40 w-8 h-12 items-center justify-center bg-[#151a1e]/90 hover:bg-[#222930] text-[#c5a059] hover:text-[#fde68a] border-y border-l border-[#546473]/70 hover:border-[#c5a059] rounded-l-xs transition-all duration-200 opacity-70 hover:opacity-100 shadow-[0_4px_12px_rgba(0,0,0,0.9)] focus:outline-none cursor-pointer"
        title="Rolar para a direita"
        aria-label="Rolar para a direita"
      >
        <ChevronRight size={20} />
      </button>

      {/* Trilho com máscara suave de desvanecimento lateral (Fade Mask) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex items-center gap-2.5 sm:gap-4 overflow-x-scroll no-scrollbar py-3 px-2 sm:px-8 touch-pan-x transition-colors ${
          isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          maskImage: 'linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%)',
        }}
      >
        {repeatedTabs.map((tab, idx) => {
          const originalIndex = idx % numTabs;
          const isActive = activeId === tab.id;

          return (
            <div
              key={`${tab.id}-${idx}`}
              data-tab-item
              className="flex-shrink-0"
            >
              <CategoryOrnamentTab
                id={`tab-mercado-infinite-${idx}`}
                label={tab.label}
                active={isActive}
                isEpic={tab.isEpic}
                themeMode={themeMode}
                hotkey={originalIndex + 1}
                onClick={() => handleItemClick(tab.id, idx)}
              >
                {tab.icon}
              </CategoryOrnamentTab>
            </div>
          );
        })}
      </div>
    </div>
  );
});
