import { defineConfig } from "astro/config";
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import path from 'path';
import { fileURLToPath } from 'url';
import { visualizer } from "rollup-plugin-visualizer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  prefetch: {
    prefetchAll: true,
  },
  vite: {
    define: {
      'process.env': JSON.stringify({
        NODE_ENV: process.env.NODE_ENV || 'development',
        NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT: process.env.NEXT_PUBLIC_ISOMER_NEXT_ENVIRONMENT,
        NEXT_PUBLIC_ASSETS_BASE_URL: process.env.NEXT_PUBLIC_ASSETS_BASE_URL,
      }),
    },
    resolve: {
      mainFields: ['module', 'main'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['@opengovsg/isomer-components'],
    },
    ssr: {
      noExternal: ['@opengovsg/isomer-components'],
    },
    plugins: [
      visualizer({
        emitFile: true,
        gzipSize: true,
        brotliSize: true,
        filename: "stats.html",
      }),
    ],
  },
});
