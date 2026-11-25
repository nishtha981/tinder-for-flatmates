import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  preview: {
    // Browser origins allowed to open Realtime subscriptions. Add your deployed app's origin here.
    realtime: { allowedOrigins: ["http://localhost:5173", "https://tinder-for-flatmates.vercel.app"] },
  },
  auth: false,
  functions: {
    // The FlatMate REST API (Hono). Slug is permanent: it's part of the invocation URL.
    api: {
      name: "flatmate api",
      source: "server/index.ts",
      env: {
        // Optional extra CORS origin for a deployed frontend, e.g. https://flatmate.vercel.app
        APP_ORIGIN: { value: process.env.APP_ORIGIN, required: false },
        // Used to seal live queries. Read from .env.local at deploy time (neon deploy --env .env.local).
        REALTIME_SECRET: { value: process.env.NEON_REALTIME_SECRET, required: true },
        // 2Factor SMS OTP API key. Read from .env.local at deploy time.
        TWOFACTOR_API_KEY: { value: process.env.TWOFACTOR_API_KEY, required: true },
      },
    },
  },
  buckets: {
    // "private" is the default; use "public_read" for anonymous reads
    assets: { access: "private" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
