import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { GothicButton } from '../GothicButton';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

/**
 * Estado de erro/timeout padronizado com ação de nova tentativa.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Não foi possível carregar os dados',
  description = 'Houve uma falha de conexão ou o tempo de resposta foi excedido.',
  onRetry,
  retryLabel = 'Tentar novamente',
  className,
}) => (
  <div
    role="alert"
    className={clsx(
      'flex flex-col items-center justify-center gap-2 border border-[#7f3d2d] bg-[#1c0f0b]/90 px-6 py-12 text-center shadow-[0_0_15px_rgba(0,0,0,0.7)] rounded-xs',
      className
    )}
  >
    <AlertTriangle className="h-8 w-8 text-[#e7b29e]" aria-hidden="true" />
    <p className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#f0b09b]">{title}</p>
    <p className="max-w-md font-serif text-xs text-[#c4b9a3]">{description}</p>
    {onRetry && (
      <div className="mt-3">
        <GothicButton
          size="sm"
          variant="secondary"
          icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
          onClick={onRetry}
        >
          {retryLabel}
        </GothicButton>
      </div>
    )}
  </div>
);

export default ErrorState;
