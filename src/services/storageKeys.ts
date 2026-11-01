/**
 * Chaves de armazenamento local usadas para metadados globais da aplicação.
 */

/** Versão do layout de dados local. Incrementar invalida e zera os dados antigos. */
export const DATA_VERSION = 4;

/** Prefixo raiz de tudo que é gerenciado pela aplicação. */
export const APP_PREFIX = 'angarden';

export const platformKeys = {
  version: `${APP_PREFIX}:data-version`,
};
