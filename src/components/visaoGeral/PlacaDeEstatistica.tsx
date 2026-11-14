import React from 'react';

export const PlacaDeEstatistica: React.FC<{ label: string; value: number; hint: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
    <p className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-[#a88d61]">
      {label}
    </p>
    <p className="mt-1 font-cinzel text-2xl font-bold text-[#f0e2c0]">{value}</p>
    <p className="mt-0.5 font-serif text-[11px] italic text-[#8c6b41]">{hint}</p>
  </div>
);
