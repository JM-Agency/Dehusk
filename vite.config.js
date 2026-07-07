import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        why: resolve(__dirname, "why.html"),
        shop: resolve(__dirname, "shop.html"),
        careers: resolve(__dirname, "careers.html"),
      },
    },
  },
});
