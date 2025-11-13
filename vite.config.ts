import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Set base for GitHub Pages deployment
      // Change 'Bellas-Magic-Image-Editor' to your actual repo name if different
      base: mode === 'production' ? '/Bellas-Magic-Image-Editor/' : '/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.XAI_API_KEY),
        'process.env.XAI_API_KEY': JSON.stringify(env.XAI_API_KEY),
        'process.env.HF_API_KEY': JSON.stringify(env.HF_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
