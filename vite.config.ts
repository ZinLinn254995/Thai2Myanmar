import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const projectRoot = import.meta.dirname;

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
          '@': path.resolve(projectRoot, '.'),
      },
    },
    server: {
      // The preview proxy does not provide a stable Vite HMR socket.
      // Keep the dev server from injecting or reconnecting to /@vite/client.
      hmr: false,
      watch: null,
    },
  };
});
