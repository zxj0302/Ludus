import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/** Shell builds (Tauri / Capacitor) need relative asset paths. */
function resolveBase(mode: string): string {
  if (mode === 'shell') return './';
  // https://zxj0302.github.io/Ludus/
  if (mode === 'pages') return '/Ludus/';
  return '/';
}

export default defineConfig(({ mode }) => {
  const host = process.env.TAURI_DEV_HOST;

  return {
  base: resolveBase(mode),
  plugins: [react()],
  // Keep Rust compile errors visible when Tauri spawns this dev server
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    // WebView2 on Windows is more reliable with 127.0.0.1 than localhost
    host: host ?? '127.0.0.1',
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : { host: '127.0.0.1' },
    watch: {
      ignored: ['**/src-tauri/**', '**/apps/desktop/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  };
});
