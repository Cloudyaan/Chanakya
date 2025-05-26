
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Define the missing WebSocket token to fix the error
    __WS_TOKEN__: JSON.stringify("development-ws-token"),
  },
  // Only include lovable-tagger in optimizeDeps when running in Lovable's environment
  optimizeDeps: {
    // Don't include lovable-tagger for local development
    ...(process.env.NODE_ENV !== 'development' || process.env.LOVABLE_ENV ? {
      include: ["lovable-tagger"],
    } : {}),
  },
}));
