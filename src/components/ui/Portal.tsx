import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** Renderiza overlays na raiz do documento, fora do contexto de empilhamento das telas. */
export const Portal = ({ children }: { children: ReactNode }) => createPortal(children, document.body);

export default Portal;
