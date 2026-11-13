import { defineConfig } from "astro/config";

// BASE permite publicar en una subruta (p. ej. GitHub Pages sin dominio propio).
export default defineConfig({
  base: process.env.BASE ?? "/",
  devToolbar: { enabled: false },
});
