import { defineConfig } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";

export default defineConfig({
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  build: {
  outDir: "dist/styles",
  rollupOptions: {
    input: path.resolve(__dirname, "src/assets/styles/content.css"),
    output: {
      assetFileNames: "content.css",
      },
    },
  },

});
