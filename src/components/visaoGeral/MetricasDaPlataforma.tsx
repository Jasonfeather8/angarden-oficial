import React from 'react';
import { PlacaDeEstatistica } from './PlacaDeEstatistica';

interface MetricasDaPlataformaProps {
  clientes: number;
  contasAtivas: number;
  solicitacoesPendentes: number;
  campanhas: number;
  fichasTecnicas: number;
}

export const MetricasDaPlataforma: React.FC<MetricasDaPlataformaProps> = ({
  clientes,
  contasAtivas,
  solicitacoesPendentes,
  campanhas,
  fichasTecnicas,
}) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
    <PlacaDeEstatistica label="Clientes" value={clientes} hint="Isolamentos de dados ativos" />
    <PlacaDeEstatistica label="Contas ativas" value={contasAtivas} hint="Acessos liberados" />
    <PlacaDeEstatistica
      label="Solicitações pendentes"
      value={solicitacoesPendentes}
      hint="Aguardando sua análise"
    />
    <PlacaDeEstatistica label="Campanhas" value={campanhas} hint="Mesas em toda a plataforma" />
    <PlacaDeEstatistica label="Fichas técnicas" value={fichasTecnicas} hint="Personagens criados" />
  </div>
);
