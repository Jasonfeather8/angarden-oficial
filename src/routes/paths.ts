/** Fonte única das URLs navegáveis do sistema. */
export const ROUTES = {
  login: '/login',
  cadastro: '/cadastro',
  recuperarSenha: '/recuperar-senha',
  redefinirSenha: '/reset-password',
  authCallback: '/auth/callback',
  dashboard: '/dashboard',
  personagens: '/personagens',
  ficha: '/ficha/:characterId',
  mercado: '/mercado',
  grimorio: '/grimorio',
  biblioteca: '/biblioteca',
  cronicas: '/cronicas',
  conviteCronica: '/cronicas/convite/:token',
  painelMestre: '/painel-mestre',
  perfil: '/perfil',
  acessoNegado: '/acesso-negado',
  admin: {
    root: '/admin',
    solicitacoes: '/admin/solicitacoes',
    clientes: '/admin/clientes',
    campanhas: '/admin/campanhas',
    midia: '/admin/midia',
    importarMagias: '/admin/importar-magias',
    biblioteca: '/admin/biblioteca',
  },
} as const;

/** Monta a URL dedicada de uma ficha técnica. */
export const fichaPath = (characterId: string): string =>
  `/ficha/${encodeURIComponent(characterId)}`;

/** Monta a URL da tela de Crônicas já com um relato selecionado. */
export const cronicaPath = (cronicaId: string): string =>
  `${ROUTES.cronicas}?cronica=${encodeURIComponent(cronicaId)}`;

export const conviteCronicaPath = (token: string): string =>
  `/cronicas/convite/${encodeURIComponent(token)}`;

/** O menu "Personagens" permanece ativo enquanto uma ficha estiver aberta. */
export const isFichaRoute = (pathname: string): boolean => pathname.startsWith('/ficha/');
