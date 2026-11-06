import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// GitHub Pages serves the site from /ownerless/. Override with BASE=/ for other hosts.
export default defineConfig({
  base: process.env.BASE ?? "/ownerless/",
  plugins: [react()],
  build: { target: "es2022", sourcemap: true },
  test: { environment: "node" },
});
