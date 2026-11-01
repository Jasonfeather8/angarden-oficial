import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ROUTES } from './routes/paths';

import { DashboardPage } from './pages/DashboardPage';
import { PersonagensPage } from './pages/PersonagensPage';
import { FichaTecnicaPage } from './pages/FichaTecnicaPage';
import { MercadoPage } from './pages/MercadoPage';
import { GrimorioPage } from './pages/GrimorioPage';
import { BibliotecaPage } from './pages/BibliotecaPage';
import { CronicasPage } from './pages/CronicasPage';
import { CampanhasPage } from './pages/CampanhasPage';
import { ConvitePage } from './pages/ConvitePage';
import { PainelMestrePage } from './pages/PainelMestrePage';
import { PerfilPage } from './pages/PerfilPage';
import { LoginPage } from './pages/LoginPage';
import { CadastroPage } from './pages/CadastroPage';
import { RecuperarSenhaPage } from './pages/RecuperarSenhaPage';
import { RedefinirSenhaPage } from './pages/RedefinirSenhaPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AcessoNegadoPage } from './pages/AcessoNegadoPage';
import { NotFoundPage } from './pages/NotFoundPage';

import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminCampaignsPage } from './pages/admin/AdminCampaignsPage';

/**
 * App.tsx contém apenas o mapa de rotas e os guardas de acesso.
 * As cascas visuais (AppLayout para o cliente, AdminLayout para a plataforma)
 * renderizam cada página através do <Outlet/>.
 */
export default function App() {
  return (
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
  );
}
