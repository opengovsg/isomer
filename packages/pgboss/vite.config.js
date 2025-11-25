import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      "~": path.resolve(__dirname, "./src"),
    },
  },
});
