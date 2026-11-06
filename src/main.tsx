import { QueryClientProvider } from '@tanstack/react-query';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import {ensureDataVersion} from './services/dataReset';
import {useSessionStore} from './store/useSessionStore';
import { queryClient } from './services/queryClient';
import { preloadRoute } from './routes/lazyPages';

async function bootstrap() {
  // 1. Começa a baixar o trecho da rota atual em paralelo com a verificação da
  //    sessão, para a tela de entrada não passar pelo carregamento do chunk.
  void preloadRoute(window.location.pathname);
  // 2. Garante o layout de dados atual (zera dados de versões anteriores).
  await ensureDataVersion();
  // 3. Resolve a sessão antes do primeiro render, evitando piscar a tela de acesso.
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
