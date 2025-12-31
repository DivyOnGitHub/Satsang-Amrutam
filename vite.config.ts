
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Increases the chunk size limit to 1000kb to silence the warning during Vercel builds
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor modules into a separate chunk for better caching and smaller main bundles
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
  // This ensures the process.env.API_KEY is available in the browser after the Vite build
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
