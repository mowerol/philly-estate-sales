import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base ('./') means the build works at any path, including
// https://<user>.github.io/<repo>/ project Pages, with no repo-name hardcoding.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
