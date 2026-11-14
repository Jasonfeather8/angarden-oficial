import React from 'react';
import { Users } from 'lucide-react';
import { CardAventureiroMesa, type AventureiroMesa } from '../CardAventureiroMesa';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { TituloDeSecao } from './TituloDeSecao';

export interface AventureirosDaMesaPanelProps {
  isLoading: boolean;
  loadError: string;
  /** Quantidade de fichas da mesa; os cartões chegam em `aventureiros`. */
  total: number;
  aventureiros: AventureiroMesa[];
  onAbrirFicha: (characterId: string) => void;
  onAjustarTesouro: (characterId: string) => void;
  onPermissoes: (characterId: string) => void;
  onRetry: () => void;
}

/** Cartões da mesa: esqueleto, erro, mesa vazia e a grade de aventureiros. */
export const AventureirosDaMesaPanel: React.FC<AventureirosDaMesaPanelProps> = ({
  isLoading,
  loadError,
  total,
  aventureiros,
  onAbrirFicha,
  onAjustarTesouro,
  onPermissoes,
  onRetry,
}) => (
  <section aria-label="Aventureiros da mesa" className="space-y-3">
    <TituloDeSecao
      extra={(
        <span className="font-serif text-xs text-[#8f795e]">
          {isLoading
            ? 'Consultando a mesa…'
            : `${total} ${total === 1 ? 'ficha' : 'fichas'} · dados salvos no servidor`}
        </span>
      )}
    >
      Aventureiros
    </TituloDeSecao>

    {isLoading ? (
      <div role="status" aria-live="polite" className="space-y-3">
        <span className="sr-only">Consultando os pergaminhos das fichas…</span>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={`skeleton-card-${index}`} className="h-[220px] w-full" />
          ))}
        </div>
      </div>
    ) : loadError && total === 0 ? (
      <ErrorState title="Não foi possível carregar a mesa" description={loadError} onRetry={onRetry} />
    ) : total === 0 ? (
      <EmptyState
        variant="plano"
        icon={<Users className="h-8 w-8" aria-hidden="true" />}
        title="Nenhuma ficha disponível"
        description="Nenhum personagem foi encontrado para monitoramento nesta campanha."
      />
    ) : (
      <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {aventureiros.map((aventureiro) => (
          <li key={aventureiro.id} className="min-w-0">
            <CardAventureiroMesa
              aventureiro={aventureiro}
              onAbrirFicha={onAbrirFicha}
              onAjustarTesouro={onAjustarTesouro}
              onPermissoes={onPermissoes}
            />
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default AventureirosDaMesaPanel;
