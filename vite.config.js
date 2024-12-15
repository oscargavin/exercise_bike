import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: true,
      emptyOutDir: true,
    },
    define: {
      "process.env": {
        POSTGRES_URL: JSON.stringify(env.PROD_POSTGRES_URL), // Use appropriate env var
        DATABASE_URL: JSON.stringify(env.PROD_POSTGRES_URL_NON_POOLING), // Use appropriate env var
        JWT_SECRET: JSON.stringify(env.PROD_JWT_SECRET),
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        VITE_API_BASE_URL: JSON.stringify(env.VITE_API_BASE_URL), // Add API base URL env var
      },
    },
  };
});