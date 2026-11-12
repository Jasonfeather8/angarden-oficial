import React from 'react';
import { clsx } from 'clsx';

export interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

const baseStyles =
  'inline-flex h-[34px] items-center justify-center gap-2 rounded-xs border px-3.5 font-cinzel text-[10px] font-bold uppercase tracking-[0.12em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:cursor-not-allowed disabled:opacity-50';

const variantStyles = {
  primary:
    'border-[#8c6b41] bg-gradient-to-b from-[#3d2711] to-[#1b1108] text-[#f3dfaa] shadow-[0_2px_8px_rgba(0,0,0,0.55)] hover:border-[#d1a85a] hover:text-white',
  secondary:
    'border-[#4b3823] bg-[#150f0a] text-[#c6a66d] hover:border-[#a88d61] hover:bg-[#24180e] hover:text-[#f3dfaa]',
};

/**
 * Botão leve de barra de ações: placa fina de contorno dourado, sem a moldura
 * ornamental do `GothicButton` (que segue reservado às confirmações de modal).
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  variant = 'secondary',
  children,
  className,
  type = 'button',
  ...rest
}) => (
  <button type={type} className={clsx(baseStyles, variantStyles[variant], className)} {...rest}>
    {icon && <span aria-hidden="true" className="flex shrink-0 items-center justify-center">{icon}</span>}
    <span className="whitespace-nowrap">{children}</span>
  </button>
);

export default ToolbarButton;
