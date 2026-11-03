import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * La aplicación habla con el backend a través de `/api`.
 *
 * En desarrollo, Vite reenvía `/api` al backend local. Así el navegador ve un
 * único origen y las cookies de sesión y CSRF funcionan sin relajar SameSite
 * ni habilitar CORS. En producción se recomienda publicar web y API bajo el
 * mismo origen (por ejemplo, con un reverse proxy).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: false,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  };
});
