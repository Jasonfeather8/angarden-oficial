import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import {ensureDataVersion} from './services/dataReset';
import {useSessionStore} from './store/useSessionStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

async function bootstrap() {
  // 1. Garante o layout de dados atual (zera dados de versões anteriores).
  await ensureDataVersion();
  // 2. Resolve a sessão antes do primeiro render, evitando piscar a tela de acesso.
  await useSessionStore.getState().initialize();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
