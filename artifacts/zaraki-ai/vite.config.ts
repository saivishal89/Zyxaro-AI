import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, Plugin } from 'vite';
import mcpHandler from '../../api/mcp';
import fetchUrlHandler from '../../api/fetch-url';

const rawPort = process.env.PORT || '5000';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || '/';

// Vite Plugin to handle /api/fetch-url & /api/mcp endpoints locally during dev mode
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
  base: basePath,
  plugins: [
    apiDevServerPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: 'localhost',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: 'localhost',
    allowedHosts: true,
  },
});
