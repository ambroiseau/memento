
  import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig } from 'vite';

  export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress TypeScript errors for build
        if (warning.code === 'TS2307' || warning.code === 'TS6133' || warning.code === 'TS7031') {
          return;
        }
        warn(warning);
      }
    }
  },
    server: {
      port: 3000,
      open: true,
    },
    preview: {
      port: 3000,
    },
    publicDir: 'public',
  });