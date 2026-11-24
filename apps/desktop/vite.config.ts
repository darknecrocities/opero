import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(__dirname, '../../assets'),
  server: {
    host: '127.0.0.1',
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
