import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // Evita múltiplas instâncias de React (ex.: "Invalid hook call")
      // ao instalar bibliotecas secundárias de UI, autenticação ou gráficos.
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      // O leitor de PDF é carregado por import() dinâmico: sem esta entrada o
      // Vite só descobre o build legacy ao abrir um manual e recarrega a página
      // no meio da leitura.
      include: ['pdfjs-dist/legacy/build/pdf.mjs'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
