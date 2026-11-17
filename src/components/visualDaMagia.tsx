import {
  Brain,
  Droplets,
  Flame,
  HeartPulse,
  Mountain,
  Shield,
  Skull,
  Sparkles,
  Wind,
} from 'lucide-react';
import type { GrimorioSpell } from '../mocks/grimorio';

export type VisualKind = GrimorioSpell['visual'];

export const visualIcon = (visual: VisualKind, size = 26) => {
  const props = { size, strokeWidth: 1.5 };
  switch (visual) {
    case 'fire': return <Flame {...props} />;
    case 'water': return <Droplets {...props} />;
    case 'wind': return <Wind {...props} />;
    case 'earth': return <Mountain {...props} />;
    case 'ward': return <Shield {...props} />;
    case 'summon': return <Sparkles {...props} />;
    case 'mind': return <Brain {...props} />;
    case 'restore': return <HeartPulse {...props} />;
    case 'death': return <Skull {...props} />;
  }
};
