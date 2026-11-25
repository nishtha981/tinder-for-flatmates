import { createRealtimeClient } from "@neon/realtime/client";

/** One Realtime client for the whole app, so every live query shares one WebSocket. */
export const realtimeClient = createRealtimeClient({
  url: import.meta.env.VITE_REALTIME_URL as string,
});
