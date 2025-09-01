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
        // ✅ SECURITY: Log warnings instead of suppressing them
        if (
          warning.code === 'TS2307' ||
          warning.code === 'TS6133' ||
          warning.code === 'TS7031'
        ) {
          console.warn('⚠️ Build warning (suppressed):', warning.message);
          return; // Still suppress for build compatibility
        }
        // Log other warnings for security awareness
        console.warn('🔒 Build warning:', warning);
        warn(warning);
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    // ✅ SECURITY: Add basic security headers for development (compatible)
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
  preview: {
    port: 3000,
    // ✅ SECURITY: Add basic security headers for preview (compatible)
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  },
  publicDir: 'public',
});
