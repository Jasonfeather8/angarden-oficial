import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute, GuestRoute, ProtectedRoute } from './components/RouteGuards';
import { LoadingState } from './components/ui/Skeleton';
import { AppLayout } from './layouts/AppLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ROUTES } from './routes/paths';
import {
  AcessoNegadoPage,
  AdminBibliotecaPage,
  AdminCampaignsPage,
  AdminClientsPage,
  AdminImportarMagiasPage,
  AdminMediaPage,
  AdminOverviewPage,
  AdminRequestsPage,
  AuthCallbackPage,
  BibliotecaPage,
  CadastroPage,
  ConvitePage,
  CronicasPage,
  DashboardPage,
  FichaTecnicaPage,
  GrimorioPage,
  LoginPage,
  MercadoPage,
  NotFoundPage,
  PainelMestrePage,
  PerfilPage,
  PersonagensPage,
  RecuperarSenhaPage,
  RedefinirSenhaPage,
} from './routes/lazyPages';

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
          <Route path={ROUTES.admin.importarMagias} element={<AdminImportarMagiasPage />} />
          <Route path={ROUTES.admin.biblioteca} element={<AdminBibliotecaPage />} />
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
          {/* Tela de Campanhas oculta no momento: o código continua em
              src/pages/CampanhasPage.tsx, mas nenhum papel a renderiza. Para reativar,
              basta devolver o import em routes/lazyPages.tsx e o elemento aqui. */}
          <Route path={ROUTES.campanhas} element={<Navigate to={ROUTES.dashboard} replace />} />
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
