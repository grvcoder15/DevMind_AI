import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to FastAPI backend during development
      "/upload-repo": "http://localhost:8000",
      "/analyze": "http://localhost:8000",
      "/chat": "http://localhost:8000",
      "/convert-hinglish": "http://localhost:8000",
      "/voice": "http://localhost:8000",
      "/guided-learning": "http://localhost:8000",
      "/generate-flow": "http://localhost:8000",
      "/generate-prototype": "http://localhost:8000",
      "/github": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
  preview: {
    port: process.env.PORT || 4173,
    host: "0.0.0.0", // Required for Railway
  },
});
