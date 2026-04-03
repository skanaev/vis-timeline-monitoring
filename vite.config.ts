import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const githubPagesBasePath = '/vis-timeline-monitoring/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? githubPagesBasePath : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
}));
