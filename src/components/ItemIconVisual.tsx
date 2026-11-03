import React from 'react';
import { urlMiniatura } from '../services/mediaService';

export interface ItemIconVisualProps {
  type: string;
  imageUrl?: string;
  className?: string;
  ladoMiniatura?: number;
}

/**
 * ItemIconVisual
 * Gera o ícone visual correspondente a cada categoria e item com estilo medieval de alto contraste
 */
export const ItemIconVisual: React.FC<ItemIconVisualProps> = ({ type, imageUrl, className = 'w-full h-full', ladoMiniatura }) => {
  const [imgError, setImgError] = React.useState(false);

  // Sanitização de imagens fora de contexto (ex: Grogu / Baby Yoda ou fotos genéricas do Unsplash)
  const isOutOfContext = React.useMemo(() => {
    const raw = String(imageUrl || (type && (type.startsWith('http') || type.startsWith('data:')) ? type : '')).toLowerCase();
    if (!raw) return true;
    return (
      raw.includes('photo-1618336753974-aae8e04506aa') || // Grogu / Baby Yoda
      raw.includes('photo-1593811167562') ||
      raw.includes('photo-1589256469067') ||
      raw.includes('photo-1615672929037') ||
      raw.includes('photo-1595590424283') ||
      raw.includes('photo-1509198397868') ||
      raw.includes('photo-1511367461989') ||
      raw.includes('photo-1514733670139') ||
      raw.includes('photo-1517411032315') ||
      raw.includes('photo-1533158307587')
    );
  }, [imageUrl, type]);

  const effectiveImageUrl = !isOutOfContext && !imgError 
    ? (imageUrl || (type && (type.startsWith('http') || type.startsWith('data:')) ? type : undefined)) 
    : undefined;

  if (effectiveImageUrl) {
    const hasObjectFit = className.includes('object-');
    return (
      <img
        src={ladoMiniatura !== undefined ? urlMiniatura(effectiveImageUrl, ladoMiniatura) : effectiveImageUrl}
        alt=""
        className={`${className} ${hasObjectFit ? '' : 'object-cover'} rounded-xs`}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        loading="lazy"
        decoding="async"
      />
    );
  }

  const normalizedType = String(type || '').toLowerCase().trim();

  switch (normalizedType) {
    // Armas brancas
    case 'sword':
    case 'weapon':
    case 'espada':
    case 'lamina':
    case 'lâmina':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor">
          <path d="M 44 8 L 56 20 L 26 50 L 20 44 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1.5" />
          <path d="M 56 8 L 44 8 L 56 20 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <path d="M 22 42 L 14 50" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 28 48 L 18 38" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          <circle cx="12" cy="52" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          <line x1="30" y1="22" x2="48" y2="14" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
        </svg>
      );
    case 'dagger':
    case 'adaga':
    case 'faca':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor">
          <path d="M 38 12 L 48 22 L 28 42 L 22 36 Z" fill="#64748b" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M 48 12 L 38 12 L 48 22 Z" fill="#e2e8f0" />
          <path d="M 20 34 L 14 40 L 24 50 L 30 44 Z" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          <line x1="14" y1="46" x2="8" y2="52" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'axe':
    case 'machado':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="14" y1="52" x2="46" y2="16" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
          <path d="M 36 12 C 48 6 56 16 50 28 C 42 22 38 24 34 26 Z" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
          <path d="M 32 30 C 22 36 18 28 26 18 C 30 22 32 24 34 26 Z" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <rect x="33" y="19" width="6" height="8" rx="1" fill="#d97706" />
        </svg>
      );
    case 'spear':
    case 'lanca':
    case 'lança':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="10" y1="54" x2="44" y2="20" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <polygon points="44,20 54,10 50,26" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <line x1="44" y1="20" x2="54" y2="10" stroke="#ffffff" strokeWidth="1" />
          <rect x="40" y="22" width="5" height="4" fill="#d97706" transform="rotate(-45 42 24)" />
        </svg>
      );
    case 'mace':
    case 'maca':
    case 'maça':
    case 'clube':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="50" x2="42" y2="22" stroke="#52525b" strokeWidth="5" strokeLinecap="round" />
          <circle cx="44" cy="20" r="10" fill="#71717a" stroke="#27272a" strokeWidth="2" />
          <polygon points="44,8 48,14 40,14" fill="#a1a1aa" />
          <polygon points="56,20 50,24 50,16" fill="#a1a1aa" />
          <polygon points="44,32 40,26 48,26" fill="#a1a1aa" />
          <polygon points="32,20 38,16 38,24" fill="#a1a1aa" />
        </svg>
      );

    // Armaduras
    case 'armor_plate':
    case 'armor':
    case 'armadura':
    case 'placas':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 20 16 L 32 20 L 44 16 L 50 24 L 46 36 L 42 52 L 22 52 L 18 36 L 14 24 Z" fill="#94a3b8" stroke="#334155" strokeWidth="2" />
          <path d="M 28 20 L 32 36 L 36 20" stroke="#f59e0b" strokeWidth="2" fill="none" />
          <path d="M 22 36 L 42 36" stroke="#475569" strokeWidth="2" />
          <circle cx="32" cy="28" r="3" fill="#f59e0b" />
        </svg>
      );
    case 'armor_mail':
    case 'cota':
    case 'malha':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 18 16 L 32 22 L 46 16 L 52 28 L 44 48 L 20 48 L 12 28 Z" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          <line x1="22" y1="24" x2="42" y2="24" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1.5" />
          <line x1="20" y1="32" x2="44" y2="32" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1.5" />
          <line x1="22" y1="40" x2="42" y2="40" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1.5" />
        </svg>
      );
    case 'armor_leather':
    case 'couro':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 20 18 L 32 24 L 44 18 L 48 30 L 42 50 L 22 50 L 16 30 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <circle cx="26" cy="30" r="1.5" fill="#f59e0b" />
          <circle cx="38" cy="30" r="1.5" fill="#f59e0b" />
          <circle cx="26" cy="40" r="1.5" fill="#f59e0b" />
          <circle cx="38" cy="40" r="1.5" fill="#f59e0b" />
        </svg>
      );
    case 'armor_breastplate':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 22 18 L 32 22 L 42 18 L 48 28 L 40 48 L 24 48 L 16 28 Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <ellipse cx="32" cy="34" rx="6" ry="8" fill="#d97706" stroke="#f59e0b" strokeWidth="1" />
        </svg>
      );

    // Longa Distância
    case 'crossbow':
    case 'besta':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="32" y1="12" x2="32" y2="52" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <path d="M 12 24 Q 32 14 52 24" stroke="#94a3b8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <line x1="14" y1="24" x2="32" y2="34" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="50" y1="24" x2="32" y2="34" stroke="#cbd5e1" strokeWidth="1.5" />
          <rect x="29" y="32" width="6" height="8" fill="#d97706" />
        </svg>
      );
    case 'bow':
    case 'arco':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 20 12 Q 48 32 20 52" stroke="#92400e" strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="20" y1="12" x2="20" y2="52" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="20" y1="32" x2="38" y2="32" stroke="#d97706" strokeWidth="2" />
        </svg>
      );

    // Projéteis
    case 'arrows':
    case 'arrow':
    case 'bolts':
    case 'bolt':
    case 'flecha':
    case 'flechas':
    case 'virote':
    case 'virotes':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="48" x2="48" y2="16" stroke="#78350f" strokeWidth="3" />
          <polygon points="48,16 44,12 40,24" fill="#94a3b8" />
          <polygon points="48,16 52,20 40,24" fill="#cbd5e1" />
          <path d="M 16 48 L 12 44 L 20 44 Z" fill="#dc2626" />
          <path d="M 16 48 L 20 52 L 20 44 Z" fill="#dc2626" />
        </svg>
      );
    case 'fire_arrows':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="48" x2="44" y2="20" stroke="#78350f" strokeWidth="3" />
          <polygon points="44,20 40,16 36,28" fill="#94a3b8" />
          <path d="M 44 20 Q 52 14 54 8 Q 50 18 42 16" fill="#ea580c" stroke="#f97316" strokeWidth="1.5" />
          <circle cx="48" cy="14" r="3" fill="#facc15" />
        </svg>
      );

    // Arremesso
    case 'throwing_knives':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <polygon points="32,10 38,28 32,36 26,28" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
          <line x1="32" y1="36" x2="32" y2="52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'throwing_axe':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="20" y1="46" x2="40" y2="22" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <path d="M 36 18 C 48 12 52 24 44 32 C 38 28 36 26 36 18 Z" fill="#94a3b8" stroke="#334155" strokeWidth="1.5" />
        </svg>
      );
    case 'flask_fire':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="29" y="12" width="6" height="8" rx="1" fill="#78350f" />
          <circle cx="32" cy="38" r="16" fill="#ea580c" stroke="#9a3412" strokeWidth="2" opacity="0.85" />
          <path d="M 26 38 Q 32 30 38 38 Q 32 46 26 38 Z" fill="#facc15" />
        </svg>
      );

    // Acessórios / Escudos
    case 'shield':
    case 'escudo':
    case 'broquel':
    case 'targe':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 16 16 L 48 16 L 48 34 C 48 46 32 54 32 54 C 32 54 16 46 16 34 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
          <path d="M 20 20 L 44 20 L 44 34 C 44 43 32 49 32 49 C 32 49 20 43 20 34 Z" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
          <polygon points="32,24 38,34 32,44 26,34" fill="#f59e0b" />
        </svg>
      );
    case 'shield_tower':
    case 'torre':
    case 'pavise':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="18" y="12" width="28" height="44" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <rect x="22" y="16" width="20" height="36" fill="#334155" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="32" y1="16" x2="32" y2="52" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="22" y1="34" x2="42" y2="34" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      );
    case 'amulet':
    case 'amuleto':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 22 14 Q 32 28 42 14" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="36" r="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <polygon points="32,28 38,36 32,44 26,36" fill="#e0f2fe" opacity="0.7" />
        </svg>
      );
    case 'bracers':
    case 'bracelete':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 20 18 L 44 18 L 40 46 L 24 46 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <line x1="22" y1="26" x2="42" y2="26" stroke="#d97706" strokeWidth="2" />
          <line x1="23" y1="36" x2="41" y2="36" stroke="#d97706" strokeWidth="2" />
        </svg>
      );

    // Geral / Consumíveis
    case 'potion':
    case 'healthpotion':
    case 'pocao':
    case 'poção':
    case 'cura':
    case 'vida':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="28" y="10" width="8" height="8" rx="1" fill="#78350f" />
          <circle cx="32" cy="40" r="16" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <path d="M 22 38 Q 32 34 42 38 Q 40 50 32 52 Q 24 50 22 38 Z" fill="#ef4444" />
          <circle cx="27" cy="34" r="2.5" fill="#fca5a5" opacity="0.8" />
        </svg>
      );
    case 'cloak':
    case 'manto':
    case 'capa':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 24 16 L 40 16 L 50 50 L 14 50 Z" fill="#334155" stroke="#1e293b" strokeWidth="2" />
          <circle cx="32" cy="20" r="3" fill="#f59e0b" />
          <path d="M 28 20 Q 32 26 36 20" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'lockpick':
    case 'gazua':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 18 46 L 46 18 L 48 20 L 20 48 Z" fill="#94a3b8" />
          <path d="M 46 18 Q 50 14 54 18 Q 50 22 48 20" stroke="#cbd5e1" strokeWidth="2" fill="none" />
          <line x1="16" y1="44" x2="22" y2="50" stroke="#78350f" strokeWidth="3" />
        </svg>
      );
    case 'torch':
    case 'tocha':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="22" y1="52" x2="38" y2="28" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
          <path d="M 38 28 Q 48 22 44 12 Q 38 22 32 24 Z" fill="#ea580c" stroke="#f97316" strokeWidth="1" />
          <circle cx="40" cy="20" r="3" fill="#facc15" />
        </svg>
      );
    case 'rations':
    case 'racao':
    case 'ração':
    case 'comida':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="18" y="24" width="28" height="20" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <line x1="18" y1="34" x2="46" y2="34" stroke="#d97706" strokeWidth="1.5" />
          <line x1="32" y1="24" x2="32" y2="44" stroke="#d97706" strokeWidth="1.5" />
        </svg>
      );
    case 'mushroom':
    case 'cogumelo':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 28 36 L 28 50 C 28 52 36 52 36 50 L 36 36 Z" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
          <path d="M 16 36 C 16 22 48 22 48 36 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
          <circle cx="26" cy="28" r="2.5" fill="#f8fafc" />
          <circle cx="38" cy="26" r="2" fill="#f8fafc" />
          <circle cx="32" cy="32" r="1.5" fill="#f8fafc" />
        </svg>
      );
    case 'herbs':
    case 'planta':
    case 'erva':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 32 52 Q 32 30 38 18" stroke="#15803d" strokeWidth="2.5" fill="none" />
          <path d="M 32 38 Q 20 34 22 24 Q 30 26 32 34" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
          <path d="M 34 28 Q 44 24 42 16 Q 34 18 34 26" fill="#16a34a" stroke="#15803d" strokeWidth="1.5" />
        </svg>
      );
    case 'pickaxe':
    case 'picareta':
    case 'ferramenta':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="16" y1="48" x2="44" y2="20" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
          <path d="M 34 16 Q 44 14 52 24 Q 48 32 46 28" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
        </svg>
      );
    case 'backpack':
    case 'mochila':
    case 'bolsa':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="18" y="22" width="28" height="28" rx="4" fill="#523924" stroke="#2a1d12" strokeWidth="2" />
          <path d="M 18 26 C 18 16 46 16 46 26 Z" fill="#785335" stroke="#2a1d12" strokeWidth="1.5" />
          <rect x="24" y="32" width="16" height="12" rx="2" fill="#3d2a1b" stroke="#1d130a" strokeWidth="1" />
          <rect x="30" y="24" width="4" height="20" fill="#f59e0b" stroke="#78350f" strokeWidth="0.5" />
          <circle cx="32" cy="38" r="2" fill="#fbbf24" />
        </svg>
      );

    // Épicos
    case 'sword_epic':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 46 6 L 58 18 L 26 50 L 18 42 Z" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
          <line x1="24" y1="40" x2="16" y2="48" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
          <circle cx="12" cy="52" r="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
          <circle cx="38" cy="24" r="8" fill="#fef08a" opacity="0.3" />
        </svg>
      );
    case 'bow_epic':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 18 10 Q 52 32 18 54" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="18" y1="10" x2="18" y2="54" stroke="#e0f2fe" strokeWidth="2" />
          <circle cx="35" cy="32" r="6" fill="#7dd3fc" opacity="0.4" />
        </svg>
      );
    case 'armor_epic':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 18 16 L 32 22 L 46 16 L 52 28 L 44 52 L 20 52 L 12 28 Z" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
          <polygon points="32,24 38,36 32,46 26,36" fill="#c084fc" stroke="#e9d5ff" strokeWidth="1.5" />
        </svg>
      );
    case 'shield_epic':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 16 14 L 48 14 L 48 36 C 48 48 32 56 32 56 C 32 56 16 48 16 36 Z" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <polygon points="32,20 42,34 32,48 22,34" fill="#0284c7" stroke="#7dd3fc" strokeWidth="1.5" />
        </svg>
      );

    // Arcanos & Místicos
    case 'staff':
    case 'cajado':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <line x1="20" y1="56" x2="42" y2="18" stroke="#9333ea" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="44" cy="14" r="7" fill="#a855f7" stroke="#c084fc" strokeWidth="2" />
          <circle cx="44" cy="14" r="3" fill="#38bdf8" />
          <path d="M 38 18 Q 44 8 50 18" stroke="#e9d5ff" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case 'hat':
    case 'chapeu':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <ellipse cx="32" cy="48" rx="24" ry="7" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
          <path d="M 16 46 L 30 12 Q 32 8 36 12 L 48 46 Z" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" />
          <path d="M 20 42 Q 32 46 44 42" stroke="#fbbf24" strokeWidth="2" fill="none" />
          <polygon points="32,38 34,42 32,44 30,42" fill="#fbbf24" />
        </svg>
      );
    case 'robe':
    case 'vestimenta':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 22 14 L 32 18 L 42 14 L 52 24 L 46 30 L 42 26 L 44 54 L 20 54 L 22 26 L 18 30 L 12 24 Z" fill="#2e1065" stroke="#9333ea" strokeWidth="1.5" />
          <line x1="32" y1="18" x2="32" y2="54" stroke="#c084fc" strokeWidth="1.5" />
          <polygon points="32,22 35,27 32,32 29,27" fill="#38bdf8" />
        </svg>
      );
    case 'ring':
    case 'anel':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <ellipse cx="32" cy="38" rx="14" ry="12" fill="none" stroke="#fbbf24" strokeWidth="3" />
          <polygon points="32,18 38,24 32,30 26,24" fill="#a855f7" stroke="#e9d5ff" strokeWidth="1.5" />
          <circle cx="32" cy="24" r="2" fill="#38bdf8" />
        </svg>
      );
    case 'necklace':
    case 'colar':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <path d="M 18 16 Q 32 40 46 16" stroke="#fbbf24" strokeWidth="2" fill="none" />
          <circle cx="32" cy="36" r="6" fill="#7e22ce" stroke="#c084fc" strokeWidth="1.5" />
          <polygon points="32,33 34,36 32,39 30,36" fill="#38bdf8" />
        </svg>
      );
    case 'talisman':
    case 'talisma':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <circle cx="32" cy="32" r="16" fill="#2e1065" stroke="#c084fc" strokeWidth="2" />
          <polygon points="32,18 42,38 22,38" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
          <polygon points="32,46 22,26 42,26" stroke="#a855f7" strokeWidth="1.5" fill="none" />
          <circle cx="32" cy="32" r="3" fill="#fbbf24" />
        </svg>
      );
    case 'arcane_potion':
    case 'manapotion':
    case 'mana':
    case 'arcana':
    case 'vigor':
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="28" y="10" width="8" height="6" rx="1" fill="#c084fc" />
          <path d="M 28 16 L 24 24 Q 18 30 18 42 C 18 52 24 56 32 56 C 40 56 46 52 46 42 Q 46 30 40 24 L 36 16 Z" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" />
          <ellipse cx="32" cy="44" rx="8" ry="6" fill="#a855f7" opacity="0.6" />
          <circle cx="28" cy="40" r="2" fill="#38bdf8" />
          <circle cx="35" cy="45" r="1.5" fill="#e9d5ff" />
        </svg>
      );

    case 'general':
    default:
      return (
        <svg viewBox="0 0 64 64" className={className} fill="none">
          <rect x="18" y="24" width="28" height="26" rx="3" fill="#3b2718" stroke="#1f140c" strokeWidth="2" />
          <path d="M 18 24 Q 32 16 46 24" fill="#543722" stroke="#1f140c" strokeWidth="1.5" />
          <line x1="18" y1="28" x2="46" y2="28" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="29" y="30" width="6" height="7" rx="1" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          <circle cx="32" cy="33.5" r="1" fill="#1f140c" />
        </svg>
      );
  }
};
