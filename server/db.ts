import { attachDatabasePool } from "@neon/functions";
import pg from "pg";

// Pooled URL for request traffic. One small pool per isolate, created at module scope.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!.replace("sslmode=require", "sslmode=verify-full"),
  max: 5,
});
// Keeps an idle disconnect (e.g. compute scaling to zero) from crashing the process.
attachDatabasePool(pool);
