import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The site is served from https://atiqul-islam.github.io/Atiqul-Islam/, so base
// has to be the repo path or every hashed asset URL resolves against the domain
// root and 404s.
export default defineConfig({
  base: "/Atiqul-Islam/",
  plugins: [react(), tailwindcss()],
  build: { target: "es2022", cssMinify: "lightningcss" },
});
