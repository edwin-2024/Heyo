import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  functions: {
    ingest: {
      name: "Knowledge Ingestion Worker",
      source: "src/functions/ingest.ts",
    },
    realtime: {
      name: "Realtime WebSocket Hub",
      source: "src/functions/realtime.ts",
    },
  },
});
