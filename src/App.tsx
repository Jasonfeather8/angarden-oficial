import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards';
import { LoadingState } from './components/ui/Skeleton';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ROUTES } from './routes/paths';

const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PersonagensPage = React.lazy(() => import('./pages/PersonagensPage').then((m) => ({ default: m.PersonagensPage })));
const FichaTecnicaPage = React.lazy(() => import('./pages/FichaTecnicaPage').then((m) => ({ default: m.FichaTecnicaPage })));
const MercadoPage = React.lazy(() => import('./pages/MercadoPage').then((m) => ({ default: m.MercadoPage })));
const GrimorioPage = React.lazy(() => import('./pages/GrimorioPage').then((m) => ({ default: m.GrimorioPage })));
const BibliotecaPage = React.lazy(() => import('./pages/BibliotecaPage').then((m) => ({ default: m.BibliotecaPage })));
const CronicasPage = React.lazy(() => import('./pages/CronicasPage').then((m) => ({ default: m.CronicasPage })));
const CampanhasPage = React.lazy(() => import('./pages/CampanhasPage').then((m) => ({ default: m.CampanhasPage })));
const ConvitePage = React.lazy(() => import('./pages/ConvitePage').then((m) => ({ default: m.ConvitePage })));
const PainelMestrePage = React.lazy(() => import('./pages/PainelMestrePage').then((m) => ({ default: m.PainelMestrePage })));
const PerfilPage = React.lazy(() => import('./pages/PerfilPage').then((m) => ({ default: m.PerfilPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const CadastroPage = React.lazy(() => import('./pages/CadastroPage').then((m) => ({ default: m.CadastroPage })));
const RecuperarSenhaPage = React.lazy(() => import('./pages/RecuperarSenhaPage').then((m) => ({ default: m.RecuperarSenhaPage })));
const RedefinirSenhaPage = React.lazy(() => import('./pages/RedefinirSenhaPage').then((m) => ({ default: m.RedefinirSenhaPage })));
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage').then((m) => ({ default: m.AuthCallbackPage })));
const AcessoNegadoPage = React.lazy(() => import('./pages/AcessoNegadoPage').then((m) => ({ default: m.AcessoNegadoPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const AdminOverviewPage = React.lazy(() => import('./pages/admin/AdminOverviewPage').then((m) => ({ default: m.AdminOverviewPage })));
const AdminRequestsPage = React.lazy(() => import('./pages/admin/AdminRequestsPage').then((m) => ({ default: m.AdminRequestsPage })));
const AdminClientsPage = React.lazy(() => import('./pages/admin/AdminClientsPage').then((m) => ({ default: m.AdminClientsPage })));
const AdminCampaignsPage = React.lazy(() => import('./pages/admin/AdminCampaignsPage').then((m) => ({ default: m.AdminCampaignsPage })));
const AdminMediaPage = React.lazy(() => import('./pages/admin/AdminMediaPage').then((m) => ({ default: m.AdminMediaPage })));

/**
 * App.tsx contém apenas o mapa de rotas e os guardas de acesso.
 * As cascas visuais (AppLayout para o cliente, AdminLayout para a plataforma)
 * renderizam cada página através do <Outlet/>.
 */
export default function App() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-xl px-4 py-10"><LoadingState label="Preparando esta página…" /></div>}>
      <Routes>
        <Route
          path={ROUTES.login}
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.cadastro}
          element={
            <GuestRoute>
              <CadastroPage />
            </GuestRoute>
          }
        />
        <Route
          path={ROUTES.recuperarSenha}
          element={
            <GuestRoute>
              <RecuperarSenhaPage />
            </GuestRoute>
          }
        />
        <Route path={ROUTES.redefinirSenha} element={<RedefinirSenhaPage />} />
        <Route path={ROUTES.authCallback} element={<AuthCallbackPage />} />

        {/* Área administrativa da plataforma */}
        <Route
          path={ROUTES.admin.root}
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path={ROUTES.admin.solicitacoes} element={<AdminRequestsPage />} />
          <Route path={ROUTES.admin.clientes} element={<AdminClientsPage />} />
          <Route path={ROUTES.admin.campanhas} element={<AdminCampaignsPage />} />
          <Route path={ROUTES.admin.midia} element={<AdminMediaPage />} />
        </Route>

        {/* Área do cliente */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.personagens} element={<PersonagensPage />} />
          <Route path={ROUTES.ficha} element={<FichaTecnicaPage />} />
          <Route path={ROUTES.mercado} element={<MercadoPage />} />
          <Route path={ROUTES.grimorio} element={<GrimorioPage />} />
          <Route path={ROUTES.biblioteca} element={<BibliotecaPage />} />
          <Route path={ROUTES.cronicas} element={<CronicasPage />} />
          <Route path={ROUTES.campanhas} element={<CampanhasPage />} />
          <Route path={ROUTES.convite} element={<ConvitePage />} />
          <Route
            path={ROUTES.painelMestre}
            element={
              <ProtectedRoute roles={['mestre']}>
                <PainelMestrePage />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.perfil} element={<PerfilPage />} />
          <Route path={ROUTES.acessoNegado} element={<AcessoNegadoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
