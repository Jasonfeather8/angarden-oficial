import React from 'react';
import { Coins, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Tenant } from '@/types';
import { GothicButton } from '../GothicButton';
import { EmptyState } from '../ui/EmptyState';
import { pluralizarFichas } from './formatters';
import { ROUTES } from '@/routes/paths';

interface ClientesRecentesPanelProps {
  clientes: Tenant[];
  fichasPorCliente: Record<string, number>;
}

export const ClientesRecentesPanel: React.FC<ClientesRecentesPanelProps> = ({
  clientes,
  fichasPorCliente,
}) => {
  const navigate = useNavigate();

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 font-cinzel text-sm font-bold uppercase tracking-wider text-[#d8c9aa]">
        <Users className="h-4 w-4 text-[#a88d61]" aria-hidden="true" />
        Clientes recentes
      </h2>

      {clientes.length === 0 ? (
        <EmptyState
          icon={<Coins className="h-8 w-8" aria-hidden="true" />}
          title="Nenhum cliente cadastrado"
          description="Aprove uma solicitação de conta para criar o primeiro cliente da plataforma."
          action={
            <GothicButton size="sm" onClick={() => navigate(ROUTES.admin.solicitacoes)}>
              Ver solicitações
            </GothicButton>
          }
        />
      ) : (
        <ul className="divide-y divide-[#3a2c1d] border border-[#5a4225] bg-[#0c0806]/80">
          {clientes.slice(-5).reverse().map((tenant) => (
            <li key={tenant.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <div>
                <p className="font-cinzel text-sm font-bold text-[#e6ddc5]">{tenant.nome}</p>
                <p className="font-serif text-[11px] uppercase tracking-wider text-[#8c6b41]">
                  {tenant.tipo === 'organizacao' ? 'Organização' : 'Individual'}
                </p>
              </div>
              <span className="font-serif text-xs text-[#a88d61]">
                {fichasPorCliente[tenant.id] ?? 0} {pluralizarFichas(fichasPorCliente[tenant.id] ?? 0)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
