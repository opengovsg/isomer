import path from "node:path"
import { defineConfig } from "vite"

export default defineConfig({
  resolve: {
    alias: {
      // oxlint-disable-next-line no-undef
      "~": path.resolve(__dirname, "./src"),
    },
  },
})
