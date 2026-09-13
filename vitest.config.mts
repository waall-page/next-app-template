import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // ブラウザは必要ないためjsdomは使用しない
    globals: true,
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    server: {
      deps: {
        inline: ["next-auth"],
      },
    },
  },
});
