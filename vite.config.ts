import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { syncApiPlugin } from './src/server/syncApiPlugin.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), syncApiPlugin()],
  server: {
    host: true, // Listen on all local IP addresses (0.0.0.0) so smartphones can connect
    port: 5173
  }
});

