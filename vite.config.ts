import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  // Served under /prd-generator on dev.centrova.id
  base: "/prd-generator/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Keep output structure consistent with `base` so assets resolve under
    // /prd-generator/assets/* when the project owns dev.centrova.id.
    outDir: "dist/prd-generator",
  },
})
