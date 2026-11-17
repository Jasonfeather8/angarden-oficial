import React from 'react';
import { Sparkles } from 'lucide-react';
import { urlMiniatura } from '../services/mediaService';
import { MolduraQuadrada } from './MolduraQuadrada';
import { visualIcon, type VisualKind } from './visualDaMagia';

export interface MiniaturaDeMagiaProps {
  imageUrl?: string;
  visual?: string;
  className?: string;
}

export const MiniaturaDeMagia: React.FC<MiniaturaDeMagiaProps> = ({ imageUrl, visual, className }) => {
  const icon = visualIcon(visual as VisualKind, 22);

  return (
    <MolduraQuadrada className={className}>
      {imageUrl ? (
        <img src={urlMiniatura(imageUrl)} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <div className="relative z-10 flex h-full w-full items-center justify-center text-[#d6b56a]">
          {icon ?? <Sparkles size={22} strokeWidth={1.5} />}
        </div>
      )}
    </MolduraQuadrada>
  );
};

export default MiniaturaDeMagia;
