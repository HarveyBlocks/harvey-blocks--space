import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-markdown': [
                        'react-markdown', 
                        'remark-gfm', 
                        'remark-math', 
                        'rehype-katex', 
                        'rehype-highlight', 
                        'rehype-raw', 
                        'rehype-slug',
                        'github-slugger',
                        'unist-util-visit'
                    ],
                    'vendor-mermaid': ['mermaid'],
                    'vendor-utils': ['lucide-react', 'plantuml-encoder']
                }
            }
        }
      }
    };
});
