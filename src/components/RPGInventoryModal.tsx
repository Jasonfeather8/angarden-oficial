import React, { useState, useEffect } from 'react';
import { 
  X, ChevronUp, ChevronDown, Coins, Trash2,
  BookOpen, Shield, ShieldAlert, Sparkles, Book,
  Search, Sword, ShieldCheck, Crosshair, Shirt, Package, Eye
} from 'lucide-react';
import { FichaCompleta, MercadoItem } from '../types';
import { ModalDetalhesCompra } from './ModalDetalhesCompra';
import { ItemIconVisual } from './ItemIconVisual';
import { EmptyState } from './ui/EmptyState';
import { 
  converterInventarioParaMercadoItem, 
  equiparItemNaFicha, 
  descartarItemDoInventario 
} from '../services/inventarioService';

// Marca d'água rúnica para fundos de itens ornamentados
const RuneWatermark: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-9 h-9 opacity-20 filter blur-[0.5px]">
    <path
      d="M 50 20 C 30 20 20 35 20 50 C 20 70 35 80 50 80 C 68 80 78 66 78 50 C 78 36 68 28 54 28 C 42 28 34 36 34 48 C 34 58 42 64 52 64 C 60 64 64 58 64 52 C 64 46 58 44 52 44"
      fill="none"
      stroke="#a39275"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

// --- ORNAMENTO DE FILIGRANA METÁLICA (FLOURISH DAS LATERAIS DO CABEÇALHO) ---
const HeaderFiligreeLeft = () => (
  <svg viewBox="0 0 45 60" className="w-8 h-11 sm:w-9 sm:h-12 text-[#78593e] filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Curva superior estendida */}
      <path d="M 45 12 C 32 10, 18 4, 10 14 C 2 24, 14 32, 24 26 C 29 23, 26 14, 18 16 C 12 18, 12 26, 18 28" />
      {/* Espiral central principal */}
      <path d="M 45 30 C 28 28, 8 28, 3 36 C -2 44, 8 54, 20 48 C 30 42, 30 30, 20 30 C 14 30, 12 38, 20 40" />
      {/* Laço inferior */}
      <path d="M 45 46 C 34 50, 22 56, 14 56 C 6 56, 2 50, 8 44" />
      {/* Detalhe de folha/relevo */}
      <path d="M 45 22 Q 28 20 22 30 Q 34 28 45 22 Z" fill="#543c29" stroke="#8c6a4a" strokeWidth="1" />
    </g>
    {/* Linha de brilho metálico */}
    <g fill="none" stroke="#a37c58" strokeWidth="0.8" strokeLinecap="round">
      <path d="M 45 13 C 33 11, 20 6, 12 15 C 5 24, 15 31, 23 26" />
      <path d="M 45 31 C 29 29, 10 29, 5 37" />
    </g>
  </svg>
);

const HeaderFiligreeRight = () => (
  <div className="transform scale-x-[-1]">
    <HeaderFiligreeLeft />
  </div>
);

// --- ÍCONES CUSTOMIZADOS EM SVG DOS ITENS ---
const ItemIcons: Record<string, () => React.JSX.Element> = {
  healthPotion: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 28 10 L 36 10 L 36 18 L 28 18 Z" fill="#7c4a27" stroke="#2a1a08" strokeWidth="1.5" />
      <ellipse cx="32" cy="10" rx="5" ry="2" fill="#a86938" />
      <path d="M 29 18 L 35 18 L 38 28 L 26 28 Z" fill="#d4d4d4" opacity="0.6" />
      <circle cx="32" cy="42" r="16" fill="#a8a8a8" opacity="0.5" stroke="#333" strokeWidth="1.5" />
      <circle cx="32" cy="42" r="14" fill="#991111" />
      <path d="M 20 40 Q 32 36 44 40 Q 42 54 32 55 Q 22 54 20 40 Z" fill="#dc2626" />
      <circle cx="27" cy="36" r="2.5" fill="#fca5a5" opacity="0.8" />
      <circle cx="36" cy="44" r="1.5" fill="#fca5a5" opacity="0.6" />
    </svg>
  ),
  manaPotion: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 28 10 L 36 10 L 36 18 L 28 18 Z" fill="#7c4a27" stroke="#2a1a08" strokeWidth="1.5" />
      <ellipse cx="32" cy="10" rx="5" ry="2" fill="#a86938" />
      <circle cx="32" cy="42" r="14" fill="#1e3a8a" />
      <path d="M 20 40 Q 32 36 44 40 Q 42 54 32 55 Q 22 54 20 40 Z" fill="#2563eb" />
      <circle cx="27" cy="36" r="2.5" fill="#93c5fd" opacity="0.8" />
    </svg>
  ),
  weapon: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 46 14 L 50 18 L 24 44 L 18 42 L 16 46 L 14 44 L 18 40 L 16 34 Z" fill="#cbd5e1" stroke="#334155" strokeWidth="1.5" />
      <path d="M 46 14 L 52 12 L 50 18 Z" fill="#94a3b8" />
      <line x1="22" y1="40" x2="16" y2="46" stroke="#78350f" strokeWidth="2.5" />
    </svg>
  ),
  armor: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 18 16 L 32 20 L 46 16 L 48 34 C 48 46 32 54 32 54 C 32 54 16 46 16 34 Z" fill="#475569" stroke="#1e293b" strokeWidth="2" />
      <path d="M 24 22 L 32 25 L 40 22 L 41 34 C 41 42 32 48 32 48 C 32 48 23 42 23 34 Z" fill="#64748b" />
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 16 16 L 48 16 L 44 40 C 42 50 32 56 32 56 C 32 56 22 50 20 40 Z" fill="#b45309" stroke="#451a03" strokeWidth="2" />
      <circle cx="32" cy="34" r="8" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
    </svg>
  ),
  bow: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 18 14 Q 46 32 18 50" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="18" y1="14" x2="18" y2="50" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2,2" />
    </svg>
  ),
  arrow: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <line x1="16" y1="48" x2="48" y2="16" stroke="#78350f" strokeWidth="2" />
      <path d="M 44 14 L 50 14 L 50 20 Z" fill="#94a3b8" />
      <path d="M 14 46 L 20 46 L 16 50 Z" fill="#dc2626" />
    </svg>
  ),
  ring: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <circle cx="32" cy="34" r="14" fill="none" stroke="#d97706" strokeWidth="4" />
      <polygon points="32,16 38,24 26,24" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
    </svg>
  ),
  mushroom: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 26 34 Q 28 56 32 56 Q 36 56 38 34" fill="#e5e7eb" stroke="#4b5563" strokeWidth="2" />
      <path d="M 12 36 Q 32 10 52 36 Q 32 28 12 36 Z" fill="#ea580c" stroke="#7c2d12" strokeWidth="2" />
      <circle cx="22" cy="24" r="3" fill="#fdedc8" />
      <circle cx="34" cy="20" r="2" fill="#fdedc8" />
      <circle cx="42" cy="28" r="2.5" fill="#fdedc8" />
    </svg>
  ),
  herbs: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 32 56 Q 30 35 20 20 M 32 56 Q 34 30 46 16 M 32 56 L 32 12" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="20" rx="6" ry="3" fill="#22c55e" transform="rotate(-30 20 20)" />
      <ellipse cx="46" cy="16" rx="7" ry="3.5" fill="#22c55e" transform="rotate(40 46 16)" />
      <ellipse cx="32" cy="12" rx="5" ry="8" fill="#16a34a" />
    </svg>
  ),
  pickaxe: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <path d="M 16 48 L 46 18" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
      <path d="M 12 24 C 24 12 40 12 52 24 C 44 20 36 20 32 22 L 30 20 L 26 24 L 28 26 C 22 30 20 36 12 24 Z" fill="#9ca3af" stroke="#374151" strokeWidth="1.5" />
    </svg>
  ),
  backpack: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <rect x="20" y="22" width="24" height="28" rx="4" fill="#854d0e" stroke="#3b1a03" strokeWidth="1.5" />
      <path d="M 18 26 C 18 18 46 18 46 26 Z" fill="#a16207" stroke="#3b1a03" strokeWidth="1.5" />
      <rect x="24" y="32" width="16" height="12" rx="2" fill="#713f12" stroke="#3b1a03" strokeWidth="1" />
      <rect x="30" y="24" width="4" height="20" fill="#f59e0b" stroke="#78350f" strokeWidth="0.5" />
    </svg>
  ),
  general: () => (
    <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow">
      <polygon points="32,12 52,24 52,48 32,56 12,48 12,24" fill="#78350f" stroke="#451a03" strokeWidth="2" />
      <line x1="32" y1="12" x2="32" y2="56" stroke="#b45309" strokeWidth="1.5" />
      <line x1="12" y1="24" x2="32" y2="34" stroke="#b45309" strokeWidth="1.5" />
      <line x1="52" y1="24" x2="32" y2="34" stroke="#b45309" strokeWidth="1.5" />
    </svg>
  )
};

// Mapeia nome ou categoria do item para ícone visual e categoria do inventário
const getIconKeyForItem = (item: any): string => {
  if (item.icone_tipo) return item.icone_tipo;
  const nome = (item.item || item.nome || '').toLowerCase();
  const cat = (item.categoria || '').toLowerCase();

  if (nome.includes('cura') || nome.includes('vida') || nome.includes('poção de vida') || cat.includes('poção')) return 'potion';
  if (nome.includes('mana') || nome.includes('arcana') || nome.includes('vigor')) return 'arcane_potion';
  if (nome.includes('cogumelo')) return 'mushroom';
  if (nome.includes('erva') || nome.includes('planta')) return 'herbs';
  if (nome.includes('picareta') || nome.includes('pá')) return 'pickaxe';
  if (nome.includes('besta')) return 'crossbow';
  if (nome.includes('arco') || cat.includes('ld') || cat.includes('longa')) return 'bow';
  if (nome.includes('virote')) return 'bolts';
  if (nome.includes('flecha') || cat.includes('progeteis') || cat.includes('projétil')) return 'arrows';
  if (nome.includes('torre') || nome.includes('pavise')) return 'shield_tower';
  if (nome.includes('escudo') || cat.includes('escudo')) return 'shield';
  if (nome.includes('adaga') || nome.includes('faca')) return 'dagger';
  if (nome.includes('machado')) return 'axe';
  if (nome.includes('lança') || nome.includes('lanca')) return 'spear';
  if (nome.includes('maça') || nome.includes('maca') || nome.includes('clube')) return 'mace';
  if (nome.includes('espada') || cat.includes('arma')) return 'sword';
  if (nome.includes('placa')) return 'armor_plate';
  if (nome.includes('cota') || nome.includes('malha')) return 'armor_mail';
  if (nome.includes('couro')) return 'armor_leather';
  if (nome.includes('armadura') || nome.includes('couraça') || cat.includes('armadura')) return 'armor_plate';
  if (nome.includes('anel') || cat.includes('acessorio') || cat.includes('acessório')) return 'ring';
  if (nome.includes('colar') || nome.includes('amuleto')) return 'necklace';
  if (nome.includes('manto') || nome.includes('capa')) return 'cloak';
  if (nome.includes('tocha')) return 'torch';
  if (nome.includes('ração') || nome.includes('racao') || nome.includes('comida')) return 'rations';
  if (nome.includes('mochila') || nome.includes('bolsa')) return 'backpack';

  return 'backpack';
};

// Normaliza categoria do item para as abas
const getNormalizedTab = (item: any): string => {
  const cat = (item.categoria || '').toLowerCase();
  const nome = (item.item || item.nome || '').toLowerCase();

  if (cat.includes('arma') && !cat.includes('armadura') && !cat.includes('escudo')) return 'mercado_armas';
  if (cat.includes('armadura')) return 'mercado_armaduras';
  if (cat.includes('escudo') || nome.includes('escudo')) return 'escudos';
  if (cat.includes('ld') || cat.includes('longa')) return 'mercado_ld';
  if (cat.includes('progeteis') || cat.includes('projétil') || nome.includes('flecha')) return 'mercado_progeteis';
  if (cat.includes('consum') || cat.includes('alquimia') || nome.includes('poção')) return 'consumiveis';
  if (cat.includes('acessor') || cat.includes('anel') || cat.includes('colar')) return 'mercado_acessorios';
  if (cat.includes('missão') || cat.includes('raro') || item.is_raro || cat.includes('épico')) return 'quest';

  return 'mercado_geral';
};

export interface RPGInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ficha: FichaCompleta;
  onUpdateInventario: (novoInventario: any[]) => void;
  onUpdateFicha?: (updater: (prev: FichaCompleta) => FichaCompleta) => void;
  initialCategory?: string;
  targetSlot?: string;
}

export const RPGInventoryModal: React.FC<RPGInventoryModalProps> = ({
  isOpen,
  onClose,
  ficha,
  onUpdateInventario,
  onUpdateFicha,
  initialCategory = 'all',
  targetSlot,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [itemParaDetalhes, setItemParaDetalhes] = useState<MercadoItem | null>(null);

  useEffect(() => {
    if (isOpen && initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  // Remove da ficha quaisquer itens de placeholder "Novo Item" residuais ao abrir o inventário
  useEffect(() => {
    if (isOpen && ficha?.suporte?.inventario) {
      const temItensInvalidos = ficha.suporte.inventario.some((it) => {
        if (!it) return true;
        const nome = (it.item || it.nome || '').trim();
        return !nome || nome.toLowerCase() === 'novo item';
      });
      if (temItensInvalidos) {
        const inventarioLimpo = ficha.suporte.inventario.filter((it) => {
          if (!it) return false;
          const nome = (it.item || it.nome || '').trim();
          return Boolean(nome && nome.toLowerCase() !== 'novo item');
        });
        if (onUpdateFicha) {
          onUpdateFicha((prev) => ({
            ...prev,
            suporte: {
              ...prev.suporte,
              inventario: inventarioLimpo,
            },
          }));
        } else {
          onUpdateInventario(inventarioLimpo);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // No inventário só aparecem itens reais que pertencem ao personagem (itens de "Novo Item" ou vazios são ignorados)
  const rawInventario = (ficha.suporte?.inventario || []).filter((it) => {
    if (!it) return false;
    const nome = (it.item || it.nome || '').trim();
    return Boolean(nome && nome.toLowerCase() !== 'novo item');
  });

  const handleEquipar = async (mercItem: MercadoItem, slot?: string) => {
    const slotFinal = slot ?? targetSlot;
    if (onUpdateFicha) {
      onUpdateFicha((prev) => equiparItemNaFicha(prev, mercItem, slotFinal).fichaAtualizada);
    } else {
      const { fichaAtualizada } = equiparItemNaFicha(ficha, mercItem, slotFinal);
      onUpdateInventario(fichaAtualizada.suporte.inventario);
    }
  };

  const handleDescartar = async (mercItem: MercadoItem) => {
    if (onUpdateFicha) {
      onUpdateFicha((prev) => descartarItemDoInventario(prev, mercItem).fichaAtualizada);
    } else {
      const { fichaAtualizada } = descartarItemDoInventario(ficha, mercItem);
      onUpdateInventario(fichaAtualizada.suporte.inventario);
    }
    setItemParaDetalhes(null);
    setItemSelecionado(null);
    if (hoveredItem?.id === mercItem.id) setHoveredItem(null);
  };

  const handleConsumir = async (mercItem: MercadoItem) => {
    if (onUpdateFicha) {
      onUpdateFicha((prev) => {
        const inv = [...(prev.suporte.inventario || [])];
        const idx = inv.findIndex((i) => i.id === mercItem.id || i.item === mercItem.nome);
        if (idx !== -1) {
          const q = (inv[idx].quantidade || 1) - 1;
          if (q <= 0) {
            inv.splice(idx, 1);
          } else {
            inv[idx] = { ...inv[idx], quantidade: q };
          }
        }
        return {
          ...prev,
          suporte: {
            ...prev.suporte,
            inventario: inv,
          },
        };
      });
    } else {
      const inv = [...(ficha.suporte.inventario || [])];
      const idx = inv.findIndex((i) => i.id === mercItem.id || i.item === mercItem.nome);
      if (idx !== -1) {
        const q = (inv[idx].quantidade || 1) - 1;
        if (q <= 0) {
          inv.splice(idx, 1);
        } else {
          inv[idx] = { ...inv[idx], quantidade: q };
        }
        onUpdateInventario(inv);
      }
    }
    setItemParaDetalhes(null);
    setItemSelecionado(null);
    if (hoveredItem?.id === mercItem.id) setHoveredItem(null);
  };

  const itemsMapeados = rawInventario.map((it, idx) => {
    const mercItem = converterInventarioParaMercadoItem(it);
    const resolvedIcon = it.icone_tipo || mercItem.icone_tipo || getIconKeyForItem(it);
    return {
      id: it.id || `inv-${idx}`,
      name: it.item,
      icon: resolvedIcon,
      tabCategory: getNormalizedTab(it),
      amount: it.quantidade !== undefined ? it.quantidade : 1,
      weight: typeof it.peso === 'number' ? it.peso : parseFloat(String(it.peso || 0)) || 0,
      value: it.preco || mercItem.preco || 0,
      rarity: it.is_raro || mercItem.is_epico ? 'raro' : 'comum',
      description: it.descricao_completa || it.descricao || mercItem.descricao || 'Item do inventário pessoal do aventureiro.',
      efeito: it.efeito || mercItem.efeito,
      requisitos: it.requisitos || mercItem.material,
      categoriaOriginal: it.categoria || mercItem.categoria || 'Geral',
      rawRef: {
        ...it,
        imagem_url: it.imagem_url || mercItem.imagem_url,
        icone_tipo: resolvedIcon,
      },
    };
  });

  const TOTAL_SLOTS = 36;
  const slots = Array(TOTAL_SLOTS).fill(null);
  itemsMapeados.forEach((item, idx) => {
    if (idx < TOTAL_SLOTS) {
      slots[idx] = item;
    }
  });

  // Categorias principais do Mercado & Inventário
  const tabs = [
    { id: 'all', icon: Book, label: 'Todos os Itens' },
    { id: 'mercado_armas', icon: Sword, label: 'Armas & Lâminas' },
    { id: 'mercado_armaduras', icon: Shield, label: 'Armaduras & Proteções' },
    { id: 'escudos', icon: ShieldCheck, label: 'Escudos' },
    { id: 'mercado_ld', icon: Crosshair, label: 'Longa Distância' },
    { id: 'consumiveis', icon: ShieldAlert, label: 'Consumíveis & Poções' },
    { id: 'mercado_acessorios', icon: Sparkles, label: 'Acessórios & Joias' },
    { id: 'mercado_geral', icon: Package, label: 'Mercadorias & Gerais' },
    { id: 'quest', icon: BookOpen, label: 'Missão & Valiosos' },
  ];

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newItems = [...rawInventario];
    const draggedItem = newItems[draggedIndex];
    const targetItem = newItems[targetIndex];

    if (!draggedItem) return;

    newItems[draggedIndex] = targetItem;
    newItems[targetIndex] = draggedItem;

    onUpdateInventario(newItems.filter(Boolean));
    setDraggedIndex(null);
  };

  const handleRemoverItem = (itemId: string) => {
    const atualizado = rawInventario.filter((it) => it.id !== itemId);
    onUpdateInventario(atualizado);
    if (itemSelecionado?.id === itemId) setItemSelecionado(null);
    if (hoveredItem?.id === itemId) setHoveredItem(null);
  };

  const rarityColors: Record<string, string> = {
    comum: 'text-stone-300 border-stone-600',
    incomum: 'text-emerald-400 border-emerald-600',
    raro: 'text-amber-400 border-amber-500',
    epico: 'text-purple-400 border-purple-600',
  };

  const gold = ficha.recursos?.dinheiro || 0;
  const nomePersonagem = ficha.identidade?.nome_personagem || 'Aventureiro';

  return (
    <div 
      id="modal-inventario-rpg"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xs select-none overflow-y-auto"
      onClick={(e) => {
        // Só fecha o inventário se o clique foi diretamente no fundo e nenhum modal de detalhes estiver aberto
        if (e.target === e.currentTarget && !itemParaDetalhes) {
          onClose();
        }
      }}
    >
      <div 
        className="relative flex items-start pt-6 my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- ABAS LATERAIS DA ESQUERDA --- */}
        <div className="flex flex-col gap-1.5 mr-[-2px] z-10 pt-8 sm:pt-10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                title={tab.label}
                className={`relative group w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center transition-all duration-200 border-2 rounded-l-md cursor-pointer ${
                  isActive 
                    ? 'bg-[#211812] border-[#c5a059] text-[#f2dfa8] shadow-lg translate-x-1 z-20' 
                    : 'bg-[#140e0a] border-[#382618] text-[#8c6b41] hover:text-[#f2dfa8] hover:border-[#8c6b41]'
                }`}
                style={{
                  boxShadow: isActive ? 'inset 0 0 10px rgba(197, 160, 89, 0.3)' : 'inset 0 0 5px rgba(0,0,0,0.8)'
                }}
              >
                <Icon size={18} className="filter drop-shadow" />
                <span className="absolute left-12 sm:left-14 bg-[#0d0907] border border-[#c5a059]/60 text-[#f2dfa8] font-cinzel text-[11px] px-2.5 py-1 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* --- JANELA PRINCIPAL DO INVENTÁRIO --- */}
        <div 
          className="relative bg-gradient-to-b from-[#1c1511] via-[#140e0b] to-[#0c0907] border-4 border-[#3d2a1c] rounded-md shadow-2xl p-3 sm:p-4 w-[92vw] max-w-[540px]"
          style={{
            boxShadow: '0 0 35px rgba(0,0,0,0.95), inset 0 0 20px rgba(0,0,0,0.9)'
          }}
        >
          {/* BOTÃO FECHAR (X RED) NO CANTO SUPERIOR DIREITO */}
          <button 
            type="button"
            id="btn-fechar-inventario"
            onClick={onClose}
            className="absolute right-2 top-2 z-30 bg-gradient-to-b from-[#7f1d1d] to-[#450a0a] hover:from-[#991b1b] hover:to-[#581c1c] text-red-200 border border-[#b91c1c]/80 w-7 h-7 flex items-center justify-center rounded-xs transition-all shadow-md cursor-pointer active:scale-95"
            title="Fechar Inventário"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {/* CABEÇALHO ORNAMENTADO (COM FILIGRANA METÁLICA) */}
          <div className="relative -mt-9 sm:-mt-10 mb-3 sm:mb-4 flex items-center justify-center z-20">
            <div className="relative flex items-center">
              {/* Filigrana da Esquerda */}
              <div className="mr-[-6px] z-10">
                <HeaderFiligreeLeft />
              </div>

              {/* Caixa do Título Central */}
              <div 
                className="relative bg-gradient-to-b from-[#1f1712] via-[#140e0b] to-[#120c09] border-2 border-[#543b28] px-6 sm:px-10 py-1 sm:py-1.5 rounded-sm shadow-[0_4px_10px_rgba(0,0,0,0.9)] flex flex-col items-center justify-center"
                style={{
                  boxShadow: 'inset 0 0 8px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.9)'
                }}
              >
                {/* Linha interna decorativa */}
                <div className="absolute inset-[2px] border border-[#3b271a]/60 pointer-events-none"></div>

                <h1 className="text-lg sm:text-xl font-cinzel font-bold tracking-wider text-[#cca96b] drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                  Inventário
                </h1>
                <span className="text-[9px] sm:text-[10px] uppercase font-cinzel text-[#8c6b41] tracking-widest leading-none">
                  {nomePersonagem}
                </span>
              </div>

              {/* Filigrana da Direita */}
              <div className="ml-[-6px] z-10">
                <HeaderFiligreeRight />
              </div>
            </div>
          </div>

          {/* ESTADO VAZIO: MOCHILA SEM ITENS */}
          {itemsMapeados.length === 0 && (
            <div className="px-1">
              <EmptyState
                icon={<Package className="h-7 w-7" aria-hidden="true" />}
                title="Mochila vazia"
                description="Nenhum item pertence a este aventureiro. Adquira equipamentos no Mercado Global ou registre os espólios coletados durante as sessões."
              />
            </div>
          )}

          {/* ÁREA CENTRAL: GRADE + BARRA DE ROLAGEM */}
          <div className="flex gap-2 sm:gap-3">
            {/* GRADE 6x6 DE SLOTS DE ITENS ORNAMENTADOS */}
            <div className="grid grid-cols-6 gap-1 sm:gap-1.5 flex-1 bg-[#0a0705] p-1.5 sm:p-2 rounded-xs border border-[#2b1c12]">
              {slots.map((item, index) => {
                const isFilteredOut = item && selectedCategory !== 'all' && item.tabCategory !== selectedCategory;
                const isSelected = itemSelecionado?.id === item?.id;

                return (
                  <div
                    key={index}
                    draggable={!!item}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      if (item) {
                        setItemSelecionado(item);
                        const mercItem = converterInventarioParaMercadoItem(item.rawRef);
                        setItemParaDetalhes(mercItem);
                      }
                    }}
                    className={`relative w-[48px] h-[48px] sm:w-[68px] sm:h-[68px] flex items-center justify-center cursor-pointer transition-all duration-150 select-none ${
                      isFilteredOut ? 'opacity-20' : 'opacity-100'
                    }`}
                  >
                    {item ? (
                      /* CARD ORNAMENTAL GÓTICO IDÊNTICO À LISTAGEM DO MERCADO */
                      <div
                        className={`relative w-full h-full rounded-xs flex items-center justify-center overflow-hidden transition-all duration-150 ${
                          isSelected
                            ? 'scale-[1.03] shadow-[0_0_12px_rgba(197,160,89,0.55)]'
                            : 'hover:scale-[1.02] hover:shadow-[0_0_8px_rgba(197,160,89,0.25)]'
                        }`}
                        style={{
                          background: 'linear-gradient(135deg, #3a4550 0%, #20272f 50%, #11151a 100%)',
                          border: isSelected ? '1.5px solid #c5a059' : '1.5px solid #526373',
                          boxShadow: isSelected
                            ? '0 3px 8px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.25)'
                            : '0 3px 8px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.18)',
                          padding: '2px',
                        }}
                      >
                        {/* Moldura interna de latão/ouro envelhecido */}
                        <div
                          className="relative w-full h-full rounded-xs overflow-hidden flex items-center justify-center"
                          style={{
                            border: '1px solid #8c6b41',
                            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.9), 0 0 0 1px #1a140e',
                            background: 'radial-gradient(circle at center, #232c35 0%, #0d1115 100%)',
                          }}
                        >
                          {/* Marca d'água rúnica no fundo caso não haja foto */}
                          {!item.rawRef?.imagem_url && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                              <RuneWatermark />
                            </div>
                          )}

                          {/* Arte/Imagem ou Ícone Visual da Mercadoria */}
                          <div className="w-full h-full flex items-center justify-center p-0.5 sm:p-1 relative z-10">
                            <ItemIconVisual
                              type={item.icon || 'general'}
                              imageUrl={item.rawRef?.imagem_url}
                              className="w-full h-full object-cover rounded-xs"
                            />
                          </div>

                          {/* Vinheta escura interna para acabamento gótico lapidado */}
                          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_6px_rgba(0,0,0,0.75)] z-15" />

                          {/* Cantoneiras ornamentais góticas douradas */}
                          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
                          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#f2dfa8]/80 pointer-events-none z-20" />
                          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
                        </div>

                        {/* Medalhão metálico circular de Tier no canto superior esquerdo */}
                        <div
                          className="absolute -top-0.5 -left-0.5 z-30 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center text-[7.5px] sm:text-[8.5px] font-bold font-cinzel text-[#fde68a]"
                          style={{
                            background: 'linear-gradient(180deg, #3a4652 0%, #151c22 100%)',
                            border: '1px solid #c5a059',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.25)',
                          }}
                          title={item.isRare || item.rawRef?.is_epico ? 'Nível Épico' : 'Nível I'}
                        >
                          {item.isRare || item.rawRef?.is_epico ? '★' : 'I'}
                        </div>

                        {/* Indicador de Quantidade empilhada no canto inferior direito */}
                        {item.amount > 1 && (
                          <span className="absolute bottom-0.5 right-0.5 z-30 bg-[#0a0705]/95 text-[#f2dfa8] text-[8px] sm:text-[9.5px] font-mono font-bold px-1 py-0.2 rounded-xs border border-[#4a3322] leading-none shadow">
                            {item.amount}
                          </span>
                        )}
                      </div>
                    ) : (
                      /* SLOT VAZIO CLÁSSICO */
                      <div
                        className="w-full h-full rounded-xs bg-gradient-to-b from-[#19110d] to-[#0c0806] border border-[#26170e]/80 transition-colors hover:border-[#3a271a]"
                        style={{
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.95)',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* BARRA DE ROLAGEM E CONTROLES LATERAIS DA DIREITA */}
            <div className="flex flex-col items-center justify-between py-1 bg-[#0a0705] rounded-xs border border-[#2b1c12] px-1 w-6 sm:w-8">
              <button 
                type="button"
                className="bg-[#19110d] border border-[#3a271a] p-0.5 sm:p-1 rounded-xs text-[#8c6b41] hover:text-[#f2dfa8] hover:bg-[#2e1f14] transition-colors cursor-pointer"
              >
                <ChevronUp size={14} />
              </button>

              <div className="w-2 sm:w-3 flex-1 my-2 bg-[#080504] rounded-full relative overflow-hidden border border-[#26170e]">
                <div className="w-full h-10 sm:h-12 bg-gradient-to-b from-[#8a5323] to-[#573111] rounded border border-[#c5a059]/40 shadow"></div>
              </div>

              <button 
                type="button"
                className="bg-[#19110d] border border-[#3a271a] p-0.5 sm:p-1 rounded-xs text-[#8c6b41] hover:text-[#f2dfa8] hover:bg-[#2e1f14] transition-colors cursor-pointer"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          {/* RODAPÉ DO INVENTÁRIO: REGRAS E EXIBIÇÃO DE OURO */}
          <div className="mt-3 pt-2 border-t border-[#2d1c11] flex items-center justify-between px-1 sm:px-2 flex-wrap gap-2">
            <div className="text-[10px] sm:text-xs text-[#8c6b41] font-cinzel flex items-center gap-1.5">
              <span>Arraste itens para reordenar</span>
              <span className="hidden sm:inline text-stone-600">•</span>
              <span className="hidden sm:inline text-[#a88d61]">Não contabiliza peso na bolsa</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 bg-[#090604] border border-[#4a311d] px-2.5 sm:px-3 py-1 rounded-xs shadow-inner">
              <Coins size={16} className="text-[#c5a059] fill-[#c5a059]/20" />
              <span className="text-[#f2dfa8] font-bold tracking-wider text-xs sm:text-sm font-mono">
                {gold}
              </span>
              <span className="text-[9px] text-[#8c6b41] font-cinzel uppercase">Moedas</span>
            </div>
          </div>

          {/* TOOLTIP FLUTUANTE DE DETALHES DO ITEM */}
          {hoveredItem && (
            <div 
              className="absolute z-50 bottom-14 left-4 sm:left-6 w-60 sm:w-64 bg-[#0d0907]/95 border-2 border-[#573923] rounded-xs p-2.5 sm:p-3 shadow-2xl backdrop-blur-sm pointer-events-none animate-in fade-in duration-150"
              style={{
                boxShadow: '0 10px 25px rgba(0,0,0,0.95)'
              }}
            >
              <div className="flex items-center gap-2 border-b border-[#2b1c12] pb-1.5 mb-2">
                {/* Miniatura Ornamental da Mercadoria */}
                <div
                  className="relative w-8 h-8 shrink-0 rounded-xs flex items-center justify-center overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #3a4550 0%, #20272f 50%, #11151a 100%)',
                    border: '1px solid #8c6b41',
                    padding: '1px',
                  }}
                >
                  <div className="relative w-full h-full rounded-xs overflow-hidden flex items-center justify-center bg-[#0d1115]">
                    <ItemIconVisual
                      type={hoveredItem.icon || 'general'}
                      imageUrl={hoveredItem.rawRef?.imagem_url}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`font-cinzel font-bold text-xs sm:text-sm truncate ${rarityColors[hoveredItem.rarity] || 'text-[#f2dfa8]'}`}>
                      {hoveredItem.name}
                    </h3>
                    <span className="text-[8.5px] uppercase tracking-wider text-[#8c6b41] border border-[#3a2818] px-1 rounded-xs shrink-0">
                      {hoveredItem.rarity}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#a88d61] italic mb-2 leading-relaxed font-serif">
                "{hoveredItem.description}"
              </p>

              {hoveredItem.efeito && (
                <p className="text-[10px] text-[#e6ddc5] mb-2 font-sans">
                  <strong className="text-[#c5a059]">Efeito:</strong> {hoveredItem.efeito}
                </p>
              )}

              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#dcd1ba] border-t border-[#2b1c12] pt-2 font-sans">
                <div>
                  <span className="text-[#8c6b41]">Quantidade:</span> {hoveredItem.amount}
                </div>
                <div>
                  <span className="text-[#8c6b41]">Peso:</span> {(hoveredItem.weight * hoveredItem.amount).toFixed(1)} kg
                </div>
                <div className="col-span-2 flex items-center justify-between text-[#c5a059] pt-1">
                  <span className="text-[#8c6b41]">Valor Estimado:</span>
                  <span className="font-mono font-bold">{hoveredItem.value * hoveredItem.amount} Moedas</span>
                </div>
                <div className="col-span-2 pt-1.5 border-t border-[#2b1c12] text-center">
                  <span className="text-[9px] text-[#c5a059] font-cinzel font-semibold tracking-wide">
                    Clique para ver detalhes, equipar ou descartar
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODAL DE DETALHES, EQUIPAR E DESCARTAR MERCADORIA DO INVENTÁRIO */}
      <div onClick={(e) => e.stopPropagation()}>
        <ModalDetalhesCompra
          isOpen={!!itemParaDetalhes}
          onClose={() => setItemParaDetalhes(null)}
          item={itemParaDetalhes}
          origem="inventario"
          ficha={ficha}
          onEquipar={handleEquipar}
          onDescartar={handleDescartar}
          onConsumir={handleConsumir}
        />
      </div>
    </div>
  );
};
