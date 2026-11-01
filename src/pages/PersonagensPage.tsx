import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Search, Trash2, X } from 'lucide-react';
import { TenantCharacter } from '../types';
import { useFichaStore } from '../store/useFichaStore';
import { fichaService } from '../services/fichaService';
import { GothicButton } from '../components/GothicButton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/Skeleton';
import { invalidateAsyncDataCache, useAsyncData } from '../hooks/useAsyncData';
import { useAuthorization } from '../hooks/useAuthorization';
import { fichaPath } from '../routes/paths';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const PersonagensPage: React.FC = () => {
  const navigate = useNavigate();
  const setCharacterId = useFichaStore((state) => state.setCharacterId);
  const { tenantId } = useAuthorization();

  // O acervo é sempre o do cliente (tenant) autenticado.
  const { data, isLoading, error, reload } = useAsyncData<TenantCharacter[]>(
    () => fichaService.getTenantCharacters(),
    [],
    { cacheKey: `acervo-personagens:${tenantId ?? ''}` }
  );
  const characters = data ?? [];

  const [activeCharacterId, setActiveCharacterId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const handleOpenFicha = (id: string) => {
    setCharacterId(id);
    navigate(fichaPath(id));
  };

  const handleCreateNewCharacter = async () => {
    const newId = `char-${Date.now()}`;
    const newChar: TenantCharacter = {
      id: newId,
      name: 'NOVO PERSONAGEM',
      image: null,
      letter: 'N',
      isKnown: true,
      description: ['Novo personagem. Preencha os campos da ficha para definir sua identidade, atributos e habilidades.']
    };

    // Inicializa ficha completamente vazia para ser preenchida
    await fichaService.createTenantCharacter(newChar);
    const blankFicha = fichaService.createBlankFicha(newId, '');
    await fichaService.saveFicha(newId, blankFicha);

    invalidateAsyncDataCache('acervo-personagens');
    reload();
    setActiveCharacterId(newId);
    handleOpenFicha(newId);
  };

  const filteredCharacters = characters.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const activeCharacter =
    filteredCharacters.find((c) => c.id === activeCharacterId) ||
    filteredCharacters[0] ||
    null;

  const activeIndex = activeCharacter
    ? filteredCharacters.findIndex((c) => c.id === activeCharacter.id)
    : 0;

  // Refs para controle de rolagem com roda do mouse e arrastar (touch/mouse)
  const listWheelContainerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef<number>(0);
  const isPointerDownRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startIndexRef = useRef<number>(0);
  const [isDraggingState, setIsDraggingState] = useState<boolean>(false);

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
  }, [filteredCharacters, activeIndex]);

  // Início de toque/clique
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
    startYRef.current = e.clientY;
    startIndexRef.current = activeIndex;
  };

  // Movimento de arraste circular - apenas quando o ponteiro estiver realmente pressionado
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const deltaY = e.clientY - startYRef.current;
    if (Math.abs(deltaY) > 8) {
      hasMovedRef.current = true;
      setIsDraggingState(true);

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
      setIsDraggingState(false);
    }, 60);
  };

  const handleDeleteCharacter = async (idToDelete: string) => {
    await fichaService.removeTenantCharacter(idToDelete);
    invalidateAsyncDataCache('acervo-personagens');

    const updated = characters.filter((c) => c.id !== idToDelete);
    reload();
    setShowDeleteConfirm(false);
    
    const remainingFiltered = updated.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    if (remainingFiltered.length > 0) {
      setActiveCharacterId(remainingFiltered[0].id);
    } else {
      setActiveCharacterId('');
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[720px] py-12">
        <LoadingState label="Convocando o acervo do seu reino…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[720px] py-12">
        <ErrorState description={error} onRetry={reload} />
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[720px] py-12">
        <EmptyState
          icon={<Users className="h-8 w-8" aria-hidden="true" />}
          title="Nenhum personagem no seu acervo"
          description={
            tenantId
              ? 'Crie o primeiro personagem do seu reino para começar a preencher a ficha técnica.'
              : 'O administrador da plataforma não possui acervo próprio. Aprove um cliente no painel administrativo para que ele comece a criar personagens.'
          }
          action={
            tenantId ? (
              <GothicButton
                size="sm"
                icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
                onClick={handleCreateNewCharacter}
              >
                Novo Personagem
              </GothicButton>
            ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div id="page-personagens" className="w-full max-w-[1240px] mx-auto select-none font-serif text-[#dcd1ba]">
      {/* Container Principal com Moldura e Textura */}
      <div 
        className="w-full min-h-[640px] lg:h-[calc(100vh-120px)] flex flex-col relative z-10 border border-[#5a4225] bg-[#0c0806]/85 shadow-[0_0_40px_rgba(0,0,0,0.9)] p-[6px] sm:p-[10px] rounded-xs"
        style={{
          backgroundImage: `url('https://i.postimg.cc/ydLhG37r/Create-matching-texture-background-202608261823.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Camada interna para escurecer a textura e criar a moldura */}
        <div className="border border-[#5a4225] h-full relative bg-black/80 flex flex-col p-[2px] justify-between overflow-hidden">
          
          {/* Bordas duplas internas laterais e inferiores */}
          <div className="absolute inset-0 border-[3px] border-transparent border-l-[#3a2c1d] border-r-[#3a2c1d] border-b-[#3a2c1d] pointer-events-none m-[2px]"></div>

          {/* Cabeçalho do Painel de Personagens */}
          <div className="border-b border-[#3a2c1d] pb-3 pt-3.5 px-3 sm:px-6 relative flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between z-10 bg-black/60 shrink-0">
            {/* Decoração superior esquerda */}
            <div className="absolute top-0 left-[-2px] w-0 h-0 border-t-[8px] border-t-[#3a2c1d] border-r-[8px] border-r-transparent"></div>
            <div className="absolute left-[-2px] top-1/2 w-[3px] h-[70%] bg-[#8c6b41] transform -translate-y-1/2"></div>
            
            <div className="flex items-start sm:items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#8c6b41] bg-[#1a140e] flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(140,107,65,0.3)] mt-0.5 sm:mt-0">
                <Users size={15} className="text-[#a88d61]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <h2 className="text-[13px] sm:text-[18px] tracking-wide sm:tracking-wider text-[#e6ddc5] uppercase font-bold font-cinzel whitespace-normal" style={{ textShadow: '1px 1px 3px black' }}>
                    Galeria de Personagens
                  </h2>
                  {activeCharacter && (
                    <span className="text-[12px] sm:text-[17px] font-bold font-cinzel text-[#f2dfa8] whitespace-normal">
                      <span className="text-[#8c6b41] mr-1">&bull;</span>
                      {activeCharacter.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de Pesquisa & Ações */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
              {/* Campo de Pesquisa por Nome */}
              <div className="relative flex items-center flex-1 sm:flex-initial min-w-[140px]">
                <Search size={14} className="absolute left-2.5 text-[#8c6b41] pointer-events-none" />
                <input
                  id="search-personagens"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar por nome..."
                  className="bg-[#120f0d]/90 border border-[#5a4225] focus:border-[#a88d61] text-[#e6ddc5] placeholder-[#8c6b41] text-xs font-serif pl-8 pr-7 py-1.5 rounded-xs outline-none w-full sm:w-44 md:w-52 transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 text-[#8c6b41] hover:text-[#e6ddc5]"
                    title="Limpar pesquisa"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Botão Novo Personagem com Moldura Gótica */}
              <GothicButton 
                id="btn-novo-personagem"
                onClick={handleCreateNewCharacter}
                size="sm"
                variant="primary"
                width={170}
                height={34}
                icon={<UserPlus size={13} />}
              >
                Novo Personagem
              </GothicButton>

              {/* Botão Excluir Discreto */}
              {activeCharacter && (
                !showDeleteConfirm ? (
                  <GothicButton
                    id="btn-excluir-personagem"
                    onClick={() => setShowDeleteConfirm(true)}
                    size="sm"
                    variant="secondary"
                    width={95}
                    height={34}
                    icon={<Trash2 size={13} />}
                    title="Excluir Personagem Ativo"
                  >
                    Excluir
                  </GothicButton>
                ) : (
                  <div className="flex items-center space-x-1.5 bg-[#1a140e] border border-[#8c6b41] px-2 py-1 rounded-xs shadow-[0_0_10px_rgba(0,0,0,0.8)] h-[34px]">
                    <span className="text-[11px] text-[#e6ddc5] font-serif">Excluir?</span>
                    <button
                      id="btn-confirmar-exclusao"
                      onClick={() => handleDeleteCharacter(activeCharacter.id)}
                      className="px-2 py-0.5 text-[10px] bg-[#3a2818] hover:bg-[#5a4225] text-[#f2dfa8] font-bold rounded-xs font-cinzel border border-[#8c6b41]"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-1.5 py-0.5 text-[10px] bg-[#120f0d] hover:bg-[#2a1d10] text-[#a88d61] rounded-xs font-cinzel border border-[#5a4225]"
                    >
                      Não
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Decoração superior direita */}
            <div className="absolute top-0 right-[-2px] w-0 h-0 border-t-[8px] border-t-[#3a2c1d] border-l-[8px] border-l-transparent"></div>
          </div>

          {/* Área Central: Coluna Esquerda (Índice + Roda) | Centro (Arte Circular) | Coluna Direita (Detalhes) */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden p-3 sm:p-5 relative gap-4 custom-scrollbar">
            
            {/* Coluna Esquerda: Índice Alfabético & Lista com Efeito Roda */}
            <div className="w-full lg:w-[32%] flex relative z-10 h-[280px] sm:h-[320px] lg:h-full lg:min-h-0 shrink-0">
              {/* Vertical Alphabet Index */}
              <div className="flex flex-col text-[9px] text-[#5a4228] pr-2.5 pt-2 border-r border-[#3a2818]/40 items-center w-6 shrink-0">
                {alphabet.map((letter) => (
                  <span 
                    key={letter} 
                    className={`leading-tight cursor-default select-none ${activeCharacter && activeCharacter.letter === letter ? 'text-[#f2dfa8] font-bold text-xs' : ''}`}
                  >
                    {letter}
                  </span>
                ))}
              </div>

              {/* Lista de Personagens - Efeito Roda (Carrossel) com suporte a Rodinha do Mouse e Arrastar (Touch/Mouse) */}
              <div 
                ref={listWheelContainerRef}
                className={`flex-1 pl-4 sm:pl-6 relative overflow-hidden pr-2 py-4 select-none overscroll-contain touch-none ${
                  isDraggingState ? 'cursor-grabbing' : 'cursor-default'
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {/* Vertical spine line */}
                <div className="absolute left-[0.9rem] sm:left-[1.1rem] top-0 bottom-0 w-px bg-[#3a2818]/60 z-0 pointer-events-none"></div>
                
                <div className="relative w-full h-full">
                  {filteredCharacters.length === 0 ? (
                    <EmptyState
                      title="Nenhum personagem encontrado"
                      description={`Não há registros que correspondam a "${searchTerm}".`}
                      className="h-full border-none bg-transparent py-6 shadow-none"
                    />
                  ) : (
                    filteredCharacters.map((char, index) => {
                      const total = filteredCharacters.length;
                      let relativeIndex = index - activeIndex;
                      if (total > 1) {
                        while (relativeIndex > total / 2) relativeIndex -= total;
                        while (relativeIndex < -total / 2) relativeIndex += total;
                      }
                      const distance = Math.abs(relativeIndex);
                      const isFar = distance > 3.5;
                      
                      const maxShift = 80; 
                      const dropoff = 12; 
                      const calculatedShift = Math.max(0, maxShift - (dropoff * distance * distance));
                      const shiftX = maxShift - calculatedShift;
                      
                      const shiftY = relativeIndex * 58;
                      const isActive = activeCharacter?.id === char.id;

                      return (
                        <div 
                          key={char.id}
                          onClick={() => {
                            if (!hasMovedRef.current && char.isKnown) {
                              if (activeCharacter?.id === char.id) {
                                handleOpenFicha(char.id);
                              } else {
                                setActiveCharacterId(char.id);
                              }
                            }
                          }}
                          className={`absolute left-0 right-0 group h-[48px] ${char.isKnown ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                          style={{
                            top: '50%',
                            transform: `translate(${shiftX}px, calc(-50% + ${shiftY}px))`,
                            transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease',
                            zIndex: isActive ? 30 : Math.max(1, Math.round(20 - distance)),
                            opacity: isFar ? 0 : 1,
                            pointerEvents: isFar ? 'none' : 'auto'
                          }}
                        >
                          <div className="relative flex items-center h-full w-full">
                            {/* Dynamic Connective Line back to the spine */}
                            <div 
                              className="absolute top-1/2 -translate-y-1/2 flex items-center -z-10"
                              style={{
                                right: '100%',
                                width: `${shiftX + 16}px`,
                                transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
                              }}
                            >
                              <div className={`w-full h-px ${isActive ? 'bg-[#a88242]' : 'bg-[#3a2818] group-hover:bg-[#5a4228]'} transition-colors duration-300`}></div>
                              <div className={`absolute -left-[3px] w-[6px] h-[6px] rounded-full ${isActive ? 'bg-[#f2dfa8] shadow-[0_0_5px_#f2dfa8]' : 'bg-[#3a2818]'} transition-colors duration-300`}></div>
                            </div>

                            {/* Fundo com a Textura */}
                            <div className={`absolute -inset-y-1 -left-2 right-0 sm:-right-8 lg:-right-[220px] -z-10 transition-all duration-300 overflow-hidden border-t border-b border-l border-r-0 ${isActive ? 'border-[#a88242] shadow-[0_0_15px_rgba(168,130,66,0.25)]' : 'border-[#3a2818]/30 group-hover:border-[#5a4228]/80'}`}>
                              <div 
                                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'}`}
                                style={{ backgroundImage: `url('https://i.postimg.cc/ydLhG37r/Create-matching-texture-background-202608261823.jpg')` }}
                              ></div>
                              <div className={`absolute inset-0 transition-colors duration-300 ${isActive ? 'bg-[#5a3a1a]/40 mix-blend-multiply' : 'bg-[#0a0604]/80'}`}></div>
                              {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-[#a88242]/40 via-[#a88242]/10 to-transparent"></div>
                              )}
                              {isActive && (
                                <>
                                  <div className="absolute top-0 left-0 w-1 h-1 bg-[#f2dfa8]"></div>
                                  <div className="absolute bottom-0 left-0 w-1 h-1 bg-[#f2dfa8]"></div>
                                </>
                              )}
                            </div>
                            
                            {/* Setinha apontando no item ativo */}
                            {isActive && (
                              <div className="absolute top-1/2 -left-[14px] -translate-y-1/2 w-2 h-2 bg-[#140a05] border-l border-t border-[#a88242] -rotate-45 z-0"></div>
                            )}

                            {/* Avatar Portrait */}
                            <div className={`relative z-10 w-10 h-10 shrink-0 border ${isActive ? 'border-[#f2dfa8] shadow-[0_0_12px_rgba(242,223,168,0.3)]' : 'border-[#3a2818] group-hover:border-[#5a4228]'} bg-[#1a100a] flex items-center justify-center overflow-hidden transition-all duration-300 rounded-full`}>
                              {char.isKnown && (char.image || char.largeImage) ? (
                                <img 
                                  src={(char.image || char.largeImage)!} 
                                  alt={char.name} 
                                  className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity" 
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-[#5a4228] text-xl font-bold font-cinzel">?</span>
                              )}
                            </div>

                            {/* Nome */}
                            <div className="ml-3 whitespace-nowrap z-10 overflow-hidden">
                              <span className={`tracking-widest text-xs sm:text-sm font-semibold transition-colors duration-300 font-cinzel truncate block ${isActive ? 'text-[#f2dfa8]' : 'text-[#a88242] group-hover:text-[#d4c4a8]'}`}>
                                {char.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Centro / Mobile: Moldura Circular com a Arte do Personagem */}
            <div className="flex flex-col items-center justify-center relative z-20 py-2 lg:py-0 lg:flex-1 lg:-mx-8 shrink-0">
              <div 
                onClick={() => {
                  if (activeCharacter?.isKnown) {
                    handleOpenFicha(activeCharacter.id);
                  }
                }}
                className={`relative w-[200px] sm:w-[260px] lg:w-[320px] xl:w-[390px] h-[200px] sm:h-[260px] lg:h-[320px] xl:h-[390px] rounded-full border-2 border-[#a88242]/40 shadow-[inset_0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center bg-[#050201] transition-transform duration-300 ${
                  activeCharacter?.isKnown ? 'cursor-pointer hover:scale-[1.02] hover:border-[#f2dfa8]/70 group' : 'cursor-default'
                }`}
                title={activeCharacter?.isKnown ? `Abrir Ficha de ${activeCharacter.name}` : ''}
              >
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(10,5,0,0.95)] z-10 pointer-events-none"></div>
                
                {activeCharacter && activeCharacter.isKnown ? (
                  <div className="w-full h-full relative bg-[#050201]">
                    <img 
                      src={activeCharacter.largeImage || activeCharacter.image || "https://images.unsplash.com/photo-1542382121-6c483f3e6024?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"} 
                      alt={activeCharacter.name}
                      className="w-full h-full object-cover object-top opacity-90 sepia-[0.15] saturate-125 group-hover:opacity-100 transition-opacity"
                      style={{ transform: 'scale(1.05)' }} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542382121-6c483f3e6024?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-[#a88242]/20 mix-blend-overlay"></div>
                  </div>
                ) : (
                  <div className="w-full h-full relative bg-[#050201] flex items-center justify-center">
                    <div className="text-[#3a2818] text-[80px] sm:text-[120px] lg:text-[160px] font-cinzel">?</div>
                  </div>
                )}
              </div>
              
              <div className="hidden sm:block absolute w-[220px] sm:w-[280px] lg:w-[350px] xl:w-[420px] h-[220px] sm:h-[280px] lg:h-[350px] xl:h-[420px] rounded-full border border-[#3a2818]/50 pointer-events-none"></div>
              <div className="hidden sm:block absolute w-[240px] sm:w-[300px] lg:w-[380px] xl:w-[450px] h-[240px] sm:h-[300px] lg:h-[380px] xl:h-[450px] rounded-full border border-[#3a2818]/25 pointer-events-none"></div>
            </div>

            {/* Coluna Direita: Informações, Citações e Narrativa */}
            <div className="w-full lg:w-[38%] z-20 flex flex-col min-h-[260px] lg:min-h-0 flex-1">
              <div className="border border-[#a88242]/40 bg-[#0c0806]/90 p-4 sm:p-6 flex-1 flex flex-col relative h-full rounded-xs shadow-[0_0_20px_rgba(0,0,0,0.7)]">
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#a88242]/70"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#a88242]/70"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#a88242]/70"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#a88242]/70"></div>

                {activeCharacter && activeCharacter.isKnown ? (
                  <>
                    <div className="pb-2 border-b border-[#3a2818] mb-3 sm:mb-4">
                      <h2 className="text-[#f2dfa8] text-lg sm:text-2xl tracking-wider uppercase font-semibold font-cinzel truncate" style={{ textShadow: '1px 1px 2px black' }}>
                        {activeCharacter.name}
                      </h2>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar pr-2 sm:pr-3 flex-1 space-y-3 sm:space-y-4">
                      {activeCharacter.quote && (
                        <div className="relative pt-2 pl-4 pr-2 border-l-2 border-[#5a4225] bg-black/40 p-2.5 sm:p-3 rounded-r-xs mb-3 sm:mb-4">
                          <span className="absolute -left-2 top-0 text-[#a88d61] text-2xl sm:text-3xl font-serif leading-none opacity-80" style={{ textShadow: '1px 1px 2px black' }}>
                            &ldquo;
                          </span>
                          <p className="text-[#e0d6c1] ml-2 text-justify italic font-serif text-xs sm:text-sm leading-relaxed">
                            {activeCharacter.quote}
                          </p>
                          <p className="text-right text-[#a88d61] text-[11px] sm:text-xs mt-1.5 font-serif">&mdash; {activeCharacter.quoteSource}</p>
                        </div>
                      )}

                      <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-[#c0b096] leading-relaxed font-serif text-justify">
                        {activeCharacter.description?.map((para, idx) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>
                    </div>
                  </>
                ) : activeCharacter ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-[#5a4228] italic font-serif p-4 text-center">
                    <p>Informações do personagem desconhecidas ou bloqueadas pelo Mestre.</p>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[#5a4228] italic font-serif">
                    Nenhum personagem selecionado.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Cantos Decorativos da Moldura Principal */}
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[2px] border-l-[2px] border-[#a88d61] opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[2px] border-r-[2px] border-[#a88d61] opacity-60"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-[2px] border-r-[2px] border-[#a88d61] opacity-60"></div>
          <div className="absolute top-0 left-0 w-3 h-3 border-t-[2px] border-l-[2px] border-[#a88d61] opacity-60"></div>

        </div>
      </div>
    </div>
  );
};

export default PersonagensPage;

