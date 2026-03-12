import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The admin frontend can proxy to either:
//   port 5000 → if you're using the shared User/Worker backend
//   port 5001 → if you started the admin standalone backend
// Change the target port below to match whichever backend is running.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:5000",  // ← Change to 5001 if running admin backend standalone
        changeOrigin: true,
      },
    },
  },
  build: { outDir: "dist" },
});
