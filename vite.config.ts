import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { syncApiPlugin } from './src/server/syncApiPlugin.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), syncApiPlugin()],
  server: {
    host: true, // Listen on all local IP addresses (0.0.0.0) so smartphones can connect
    port: 5173
  }
});

