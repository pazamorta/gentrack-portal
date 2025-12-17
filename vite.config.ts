import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Get API key from environment, default to empty string if not set
    const apiKey = env.GEMINI_API_KEY || '';
    const apiUrl = env.VITE_API_URL || 'http://localhost:3001';
    
    return {
      base: '/gentrack-portal/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey),
        // Backend API URL for Salesforce proxy
        'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
