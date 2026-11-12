/**
 * Fonte única das chaves do cache de tela (`useAsyncData`).
 * Não importa nada: telas, serviços e o pré-aquecimento precisam usar exatamente
 * a mesma chave, e serviços não podem depender do módulo de pré-aquecimento.
 */
export const cacheKeys = {
  acervoPersonagens: (tenantId?: string | null) => `acervo-personagens:${tenantId ?? ''}`,
  limiteFichasDoJogador: (userId?: string | null) => `limite-fichas-jogador:${userId ?? ''}`,
  personagensResumo: (tenantId?: string | null) => `personagens-resumo:${tenantId ?? ''}`,
  campanhas: (userId?: string | null) => `campanhas:${userId ?? ''}`,
  campanhasAcessiveis: (userId?: string | null) => `campanhas-acessiveis:${userId ?? ''}`,
  mestreFichas: (tenantId?: string | null) => `mestre-fichas:${tenantId ?? ''}`,
  mestreResumo: (tenantId?: string | null) => `mestre-fichas:resumo:${tenantId ?? ''}`,
  grimorioBloqueios: (tenantId?: string | null) => `grimorio-bloqueios:${tenantId ?? ''}`,
  limitesDeFichas: (tenantId?: string | null) => `limites-fichas:${tenantId ?? ''}`,
  perfisDoCliente: (tenantId?: string | null) => `perfis-cliente:${tenantId ?? ''}`,
  cliente: (tenantId?: string | null) => `cliente:${tenantId ?? ''}`,
  proximaSessao: (tenantId?: string | null) => `proxima-sessao:${tenantId ?? ''}`,
  historicoSessoes: (tenantId?: string | null) => `historico-sessoes:${tenantId ?? ''}`,
  cronicas: (tenantId?: string | null) => `cronicas:${tenantId ?? ''}`,
  cronicasRecentes: (tenantId?: string | null) => `cronicas-recentes:${tenantId ?? ''}`,
  catalogoDoReino: (escopo?: string | null) => `catalogo-reino:${escopo ?? ''}`,
  mercadoNovidades: () => 'mercado-novidades',
  historicoXp: (escopo?: string | null) => `historico-xp:${escopo ?? ''}`,
  progressoArcano: (escopo?: string | null) => `progresso-arcano:${escopo ?? ''}`,
};

/** Prefixos para descartar de uma vez todas as entradas de uma família de chaves. */
export const cacheKeyPrefixes = {
  acervoPersonagens: 'acervo-personagens',
  mestreFichas: 'mestre-fichas:',
  grimorioBloqueios: 'grimorio-bloqueios:',
  proximaSessao: 'proxima-sessao:',
  historicoSessoes: 'historico-sessoes:',
  cronicas: 'cronicas',
  catalogoDoReino: 'catalogo-reino:',
  mercadoNovidades: 'mercado-novidades',
  historicoXp: 'historico-xp:',
  progressoArcano: 'progresso-arcano:',
};
