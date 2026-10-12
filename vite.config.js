import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',                 // gives tests a fake browser (document, window)
    globals: true,                        // lets Testing Library clean up between tests
    setupFiles: './src/tests/setup.js',   
    css: false,
  },
});