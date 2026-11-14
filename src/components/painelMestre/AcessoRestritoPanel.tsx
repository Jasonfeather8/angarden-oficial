import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PageShell } from '../PageShell';

/** Tela do Painel do Mestre para quem não é o Mestre da campanha. */
export const AcessoRestritoPanel: React.FC = () => (
  <PageShell id="page-painel-mestre" variant="padrao"
      title={<h2 className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#a88d61]" /> Painel Administrativo do Mestre</h2>}
      subtitle="Centro de controle restrito ao mestre da campanha"
      headerRight={<div className="flex items-center gap-1.5 rounded-xs border border-[#8c6b41] bg-[#2a1d10] px-2.5 py-0.5 text-xs font-cinzel text-[#d4af37]"><ShieldCheck size={12} /><span>Acesso Restrito</span></div>}
    >
      <div className="py-16 text-center font-serif text-sm text-[#c4b9a3]">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-[#a88d61]" />
        Esta câmara está reservada ao Mestre da campanha.
      </div>
  </PageShell>
);

export default AcessoRestritoPanel;
