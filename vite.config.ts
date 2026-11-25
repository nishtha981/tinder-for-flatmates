import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // In dev, /api goes to the Neon Function served locally by `npm run dev:api`.
  server: { proxy: { "/api": "http://localhost:8787" } },
});
