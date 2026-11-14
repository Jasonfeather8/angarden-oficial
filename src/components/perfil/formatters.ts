/** Estilo dos campos de texto do perfil. */
export const inputClassName = 'w-full rounded-sm border border-[#5a4225] bg-[#0d0a08]/90 px-3 py-2.5 text-sm text-[#f0e2c0] placeholder:text-[#806d52] outline-none transition-colors focus:border-[#b89558] focus:ring-2 focus:ring-[#8c6b41]/40';

/** Iniciais do nome, exibidas no retrato quando não há foto. */
export const iniciaisDoNome = (nome: string) =>
  nome
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
