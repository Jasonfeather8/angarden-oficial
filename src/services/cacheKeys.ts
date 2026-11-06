/**
 * Fonte única das chaves do cache de tela (`useAsyncData`).
 * Não importa nada: telas, serviços e o pré-aquecimento precisam usar exatamente
 * a mesma chave, e serviços não podem depender do módulo de pré-aquecimento.
 */
export const cacheKeys = {
  acervoPersonagens: (tenantId?: string | null) => `acervo-personagens:${tenantId ?? ''}`,
  personagensResumo: (tenantId?: string | null) => `personagens-resumo:${tenantId ?? ''}`,
  campanhas: (userId?: string | null) => `campanhas:${userId ?? ''}`,
  campanhasAcessiveis: (userId?: string | null) => `campanhas-acessiveis:${userId ?? ''}`,
  mestreFichas: (tenantId?: string | null) => `mestre-fichas:${tenantId ?? ''}`,
  proximaSessao: (tenantId?: string | null) => `proxima-sessao:${tenantId ?? ''}`,
};

/** Prefixos para descartar de uma vez todas as entradas de uma família de chaves. */
export const cacheKeyPrefixes = {
  acervoPersonagens: 'acervo-personagens',
  mestreFichas: 'mestre-fichas:',
};
