import { APP_PREFIX, DATA_VERSION, platformKeys } from './storageKeys';

/**
 * Limpa as chaves locais legadas quando o layout de dados muda de versão.
 * Executado uma única vez no boot, antes da aplicação ler qualquer dado; os dados dos clientes agora vivem no Supabase.
 */
export async function ensureDataVersion(): Promise<boolean> {
  let current: string | null;
  try {
    current = localStorage.getItem(platformKeys.version);
  } catch {
    return false;
  }

  if (current === String(DATA_VERSION)) return false;

  const legacyKeys: string[] = [];
  let storageLength = 0;
  try {
    storageLength = localStorage.length;
  } catch {
    // Acesso bloqueado pelo navegador.
  }

  for (let index = 0; index < storageLength; index += 1) {
    try {
      const key = localStorage.key(index);
      if (key?.startsWith(`${APP_PREFIX}:`)) legacyKeys.push(key);
    } catch {
      // Acesso bloqueado pelo navegador.
    }
  }

  for (const key of legacyKeys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Acesso bloqueado pelo navegador.
    }
  }

  if (typeof indexedDB !== 'undefined') {
    try {
      await new Promise<void>((resolve) => {
        const request = indexedDB.deleteDatabase('angarden_rpg_db');
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
        request.onblocked = () => resolve();
      });
    } catch {
      // Acesso bloqueado pelo navegador.
    }
  }

  try {
    localStorage.setItem(platformKeys.version, String(DATA_VERSION));
  } catch {
    // Acesso bloqueado pelo navegador; o boot deve prosseguir.
  }
  return true;
}
