import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'sidepanel', // Set the root to the 'sidepanel' directory
  base: './', // Use relative paths for assets in build
  build: {
    outDir: '../dist/sidepanel', // Output directory relative to root
    emptyOutDir: true, // Clear output directory before build
    rollupOptions: {
      input: {
        main: 'sidepanel/index.html' // Explicitly define the input HTML
      }
    }
  }
});
