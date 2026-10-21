import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, Plugin } from 'vite';
import mcpHandler from './api/mcp';
import fetchUrlHandler from './api/fetch-url';

const port = 3000;

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const isFetchUrl = req.url?.startsWith('/api/fetch-url');
        const isMcp = req.url?.startsWith('/api/mcp');

        if (isFetchUrl || isMcp) {
          const targetHandler = isFetchUrl ? fetchUrlHandler : mcpHandler;

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                (req as any).body = body ? JSON.parse(body) : {};
              } catch {
                (req as any).body = {};
              }
              const mockRes = {
                setHeader: (key: string, val: string) => res.setHeader(key, val),
                status: (code: number) => {
                  res.statusCode = code;
                  return {
                    json: (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    },
                    end: () => res.end(),
                  };
                },
              };
              await targetHandler(req, mockRes);
            });
            return;
          } else {
            const mockRes = {
              setHeader: (key: string, val: string) => res.setHeader(key, val),
              status: (code: number) => {
                res.statusCode = code;
                return {
                  json: (data: any) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  end: () => res.end(),
                };
              },
            };
            await targetHandler(req, mockRes);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    apiDevServerPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
