import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"

// Image-audit playground. Renders components from ../src byte-identical —
// same `~` alias and same Tailwind pipeline as the package's Storybook.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "../src"),
    },
  },
  server: {
    port: 6099,
  },
})
