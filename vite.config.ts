import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Get API key from environment, default to empty string if not set
    const apiKey = env.GEMINI_API_KEY || '';
    const apiUrl = env.VITE_API_URL || 'https://localhost:3001';
    
    return {
      base: '/gentrack-portal/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://localhost:3001'),
      'process.env.FRONTEND_URL': JSON.stringify(env.FRONTEND_URL || 'http://localhost:3000'),
    },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
