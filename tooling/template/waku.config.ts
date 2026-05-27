import path from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "waku/config"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  distDir: "out",
  vite: {
    resolve: {
      alias: {
        "@": __dirname,
        // react-dom@18 lacks `./server.edge` (React 19+); map to server.browser
        // which exports renderToReadableStream used by Waku's RSC SSR build.
        "react-dom/server.edge": "react-dom/server.browser",
      },
    },
    // Expose NEXT_PUBLIC_* vars so existing env contracts work unchanged.
    // VITE_* is the Vite default; NEXT_PUBLIC_* keeps the pipeline compatible.
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    ssr: {
      // isomer-components → isomorphic-dompurify → jsdom. Externalising them
      // prevents Vite from bundling jsdom and breaking __dirname resolution
      // (default-stylesheet.css ENOENT).
      external: ["isomorphic-dompurify", "jsdom"],
    },
  },
})
