import React from 'react';
import { ROUTES } from './paths';
import { agendarEmOciosidade } from '../utils/idleCallback';

export const DashboardPage = React.lazy(() => import('../pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
export const PersonagensPage = React.lazy(() => import('../pages/PersonagensPage').then((module) => ({ default: module.PersonagensPage })));
export const FichaTecnicaPage = React.lazy(() => import('../pages/FichaTecnicaPage').then((module) => ({ default: module.FichaTecnicaPage })));
export const MercadoPage = React.lazy(() => import('../pages/MercadoPage').then((module) => ({ default: module.MercadoPage })));
export const GrimorioPage = React.lazy(() => import('../pages/GrimorioPage').then((module) => ({ default: module.GrimorioPage })));
export const BibliotecaPage = React.lazy(() => import('../pages/BibliotecaPage').then((module) => ({ default: module.BibliotecaPage })));
export const CronicasPage = React.lazy(() => import('../pages/CronicasPage').then((module) => ({ default: module.CronicasPage })));
export const CampanhasPage = React.lazy(() => import('../pages/CampanhasPage').then((module) => ({ default: module.CampanhasPage })));
export const ConvitePage = React.lazy(() => import('../pages/ConvitePage').then((module) => ({ default: module.ConvitePage })));
export const PainelMestrePage = React.lazy(() => import('../pages/PainelMestrePage').then((module) => ({ default: module.PainelMestrePage })));
export const PerfilPage = React.lazy(() => import('../pages/PerfilPage').then((module) => ({ default: module.PerfilPage })));
export const LoginPage = React.lazy(() => import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })));
export const CadastroPage = React.lazy(() => import('../pages/CadastroPage').then((module) => ({ default: module.CadastroPage })));
export const RecuperarSenhaPage = React.lazy(() => import('../pages/RecuperarSenhaPage').then((module) => ({ default: module.RecuperarSenhaPage })));
export const RedefinirSenhaPage = React.lazy(() => import('../pages/RedefinirSenhaPage').then((module) => ({ default: module.RedefinirSenhaPage })));
export const AuthCallbackPage = React.lazy(() => import('../pages/AuthCallbackPage').then((module) => ({ default: module.AuthCallbackPage })));
export const AcessoNegadoPage = React.lazy(() => import('../pages/AcessoNegadoPage').then((module) => ({ default: module.AcessoNegadoPage })));
export const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));
export const AdminOverviewPage = React.lazy(() => import('../pages/admin/AdminOverviewPage').then((module) => ({ default: module.AdminOverviewPage })));
export const AdminRequestsPage = React.lazy(() => import('../pages/admin/AdminRequestsPage').then((module) => ({ default: module.AdminRequestsPage })));
export const AdminClientsPage = React.lazy(() => import('../pages/admin/AdminClientsPage').then((module) => ({ default: module.AdminClientsPage })));
export const AdminCampaignsPage = React.lazy(() => import('../pages/admin/AdminCampaignsPage').then((module) => ({ default: module.AdminCampaignsPage })));
export const AdminMediaPage = React.lazy(() => import('../pages/admin/AdminMediaPage').then((module) => ({ default: module.AdminMediaPage })));
export const AdminImportarMagiasPage = React.lazy(() => import('../pages/admin/AdminImportarMagiasPage').then((module) => ({ default: module.AdminImportarMagiasPage })));

const pageImports = new Map<string, () => Promise<unknown>>([
  [ROUTES.dashboard, () => import('../pages/DashboardPage')],
  [ROUTES.personagens, () => import('../pages/PersonagensPage')],
  [ROUTES.ficha, () => import('../pages/FichaTecnicaPage')],
  [ROUTES.mercado, () => import('../pages/MercadoPage')],
  [ROUTES.grimorio, () => import('../pages/GrimorioPage')],
  [ROUTES.biblioteca, () => import('../pages/BibliotecaPage')],
  [ROUTES.cronicas, () => import('../pages/CronicasPage')],
  [ROUTES.campanhas, () => import('../pages/CampanhasPage')],
  [ROUTES.convite, () => import('../pages/ConvitePage')],
  [ROUTES.painelMestre, () => import('../pages/PainelMestrePage')],
  [ROUTES.perfil, () => import('../pages/PerfilPage')],
  [ROUTES.login, () => import('../pages/LoginPage')],
  [ROUTES.cadastro, () => import('../pages/CadastroPage')],
  [ROUTES.recuperarSenha, () => import('../pages/RecuperarSenhaPage')],
  [ROUTES.redefinirSenha, () => import('../pages/RedefinirSenhaPage')],
  [ROUTES.authCallback, () => import('../pages/AuthCallbackPage')],
  [ROUTES.acessoNegado, () => import('../pages/AcessoNegadoPage')],
  [ROUTES.admin.root, () => import('../pages/admin/AdminOverviewPage')],
  [ROUTES.admin.solicitacoes, () => import('../pages/admin/AdminRequestsPage')],
  [ROUTES.admin.clientes, () => import('../pages/admin/AdminClientsPage')],
  [ROUTES.admin.campanhas, () => import('../pages/admin/AdminCampaignsPage')],
  [ROUTES.admin.midia, () => import('../pages/admin/AdminMediaPage')],
  [ROUTES.admin.importarMagias, () => import('../pages/admin/AdminImportarMagiasPage')],
]);

const routeGroups: string[][] = [
  [ROUTES.dashboard, ROUTES.personagens, ROUTES.ficha, ROUTES.mercado, ROUTES.grimorio, ROUTES.biblioteca, ROUTES.cronicas, ROUTES.campanhas, ROUTES.convite, ROUTES.painelMestre, ROUTES.perfil, ROUTES.acessoNegado],
  [ROUTES.admin.root, ROUTES.admin.solicitacoes, ROUTES.admin.clientes, ROUTES.admin.campanhas, ROUTES.admin.midia, ROUTES.admin.importarMagias],
  [ROUTES.login, ROUTES.cadastro, ROUTES.recuperarSenha, ROUTES.redefinirSenha, ROUTES.authCallback],
];

const loadedRoutes = new Map<string, Promise<unknown>>();

function routeKey(path: string): string | undefined {
  if (path.startsWith('/ficha/')) return ROUTES.ficha;
  if (path.startsWith('/convites/')) return ROUTES.convite;
  if (path === '/') return ROUTES.dashboard;
  return pageImports.has(path) ? path : undefined;
}

export function preloadRoute(path: string): Promise<void> {
  const key = routeKey(path);
  if (!key) return Promise.resolve();
  let loaded = loadedRoutes.get(key);
  if (!loaded) {
    const load = pageImports.get(key);
    if (!load) return Promise.resolve();
    loaded = load();
    loadedRoutes.set(key, loaded);
  }
  return loaded.then(() => undefined);
}

export async function preloadSiblingRoutes(path: string): Promise<void> {
  const key = routeKey(path);
  const group = routeGroups.find((routes) => key && routes.includes(key));
  if (!group) return;
  for (const route of group) {
    if (route !== key) await preloadRoute(route);
  }
}

export function scheduleSiblingRoutePreload(path: string): () => void {
  return agendarEmOciosidade(() => {
    void preloadSiblingRoutes(path);
  });
}

export default preloadRoute;
