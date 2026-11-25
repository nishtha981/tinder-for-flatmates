/**
 * Applies server/schema.sql and seeds the demo Bangalore profiles (rows + photos in Object Storage).
 * Run with: npm run db:migrate   (uses the direct, unpooled connection as Neon recommends for migrations)
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { SEED_PROFILES } from "../src/seed";
import { files } from "./storage";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set. Run `neon env pull`.");

const client = new pg.Client({ connectionString: url.replace("sslmode=require", "sslmode=verify-full") });
await client.connect();

try {
  const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
  await client.query(schema);
  console.log("schema applied");

  for (const p of SEED_PROFILES) {
    // Seed photos are SVG data URLs; upload the decoded SVG so seeds are served like real photos.
    const keys: string[] = [];
    for (const [i, dataUrl] of p.photos.entries()) {
      const svg = decodeURIComponent(dataUrl.slice(dataUrl.indexOf(",") + 1));
      const key = `seed/${p.id}/${i + 1}.svg`;
      await files.upload(key, svg, { contentType: "image/svg+xml" });
      keys.push(key);
    }

    await client.query(
      `INSERT INTO users (id, is_seed) VALUES ($1, true) ON CONFLICT (id) DO NOTHING`,
      [p.id]
    );
    await client.query(
      `INSERT INTO profiles (user_id, name, age, gender, areas, budget_min, budget_max, roommates, social, traits, bio, photo_keys)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (user_id) DO UPDATE SET
         name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender, areas = EXCLUDED.areas,
         budget_min = EXCLUDED.budget_min, budget_max = EXCLUDED.budget_max, roommates = EXCLUDED.roommates,
         social = EXCLUDED.social, traits = EXCLUDED.traits, bio = EXCLUDED.bio, photo_keys = EXCLUDED.photo_keys`,
      [p.id, p.name, p.age, p.gender, p.areas, p.budgetMin, p.budgetMax, p.roommates, p.social, p.traits, p.bio ?? null, keys]
    );
  }
  console.log(`seeded ${SEED_PROFILES.length} demo profiles`);
} finally {
  await client.end();
}
