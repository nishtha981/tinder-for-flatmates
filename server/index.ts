/**
 * FlatMate API — a Hono app deployed as a Neon Function (slug "api").
 * Postgres via pg, photos in the private "assets" bucket, chat via Neon Realtime sealed live queries.
 *
 * Auth: registration issues an opaque session token (only its hash is stored). Every route below
 * derives the user from that token; no route trusts a user id sent by the client.
 * NOTE: the OTP is still a mock, so registration does not yet prove ownership of the phone number.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { waitUntil } from "@neon/functions";
import { createRealtime, rawSql } from "@neon/realtime/server";
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { pool } from "./db";
import { files, signPhotoUrls } from "./storage";

const ALLOWED_ORIGINS = ["http://localhost:5173", ...(process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : [])];
const GENDERS = ["Male", "Female", "Non-binary"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Neon doesn't inject the Realtime secret into Functions (and NEON_* names are reserved), so neon.ts
// passes it as REALTIME_SECRET. Locally, `neon dev` provides NEON_REALTIME_SECRET directly.
const realtimeSecret = () => process.env.REALTIME_SECRET ?? process.env.NEON_REALTIME_SECRET;
let realtime: ReturnType<typeof createRealtime> | undefined;
function getRealtime() {
  return (realtime ??= createRealtime({
    secret: realtimeSecret()!,
    db: new URL(process.env.DATABASE_URL!).pathname.slice(1), // database name from the connection string
  }));
}

// ---- helpers ---------------------------------------------------------------

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function requireUser(c: Context): Promise<string> {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    const { rows } = await pool.query<{ user_id: string }>(
      "SELECT user_id FROM sessions WHERE token_hash = $1",
      [sha256(token)]
    );
    if (rows[0]) return rows[0].user_id;
  }
  throw new HTTPException(401, { message: "Unauthorized" });
}

interface ProfileRow {
  user_id: string; name: string; age: number; gender: string; areas: string[];
  budget_min: number; budget_max: number; roommates: number; social: number;
  traits: string[]; bio: string | null; photo_keys: string[];
}

async function toProfile(r: ProfileRow) {
  return {
    id: r.user_id, name: r.name, age: r.age, gender: r.gender, areas: r.areas,
    budgetMin: r.budget_min, budgetMax: r.budget_max, roommates: r.roommates,
    social: r.social, traits: r.traits, bio: r.bio ?? undefined,
    photoKeys: r.photo_keys, photos: await signPhotoUrls(r.photo_keys),
  };
}

async function getProfile(userId: string) {
  const { rows } = await pool.query<ProfileRow>("SELECT * FROM profiles WHERE user_id = $1", [userId]);
  return rows[0] ? toProfile(rows[0]) : undefined;
}

/** Same rule the prototype used: demo profiles like you back if you share a trait or a similar social style. */
function seedLikesBack(me: ProfileRow, them: ProfileRow): boolean {
  return me.traits.some((t) => them.traits.includes(t)) || Math.abs(me.social - them.social) <= 35;
}

const SEED_REPLIES = [
  "Hey! Thanks for the like 😊",
  "Yeah I'm still looking for a place — what areas are you set on?",
  "Nice, that works for my budget too. When are you planning to move?",
  "Cool! Want to hop on a call this week to figure out the details?",
  "Sounds good — I'll ping you my number 👍",
];

/** The live query for one match's chat. Authorization is part of the query: only a member of the match gets rows. */
function messagesQuery(userId: string, matchId: string) {
  return rawSql<{ id: string; match_id: string; sender_id: string; body: string; created_at: Date }>(
    `SELECT messages.id, messages.match_id, messages.sender_id, messages.body, messages.created_at
     FROM messages INNER JOIN matches ON matches.id = messages.match_id
     WHERE messages.match_id = $1 AND (matches.user_a = $2 OR matches.user_b = $2)
     ORDER BY messages.created_at ASC LIMIT 200`,
    [matchId, userId]
  );
}

/** Returns the other user's id if userId belongs to the match, else throws 404. */
async function requireMatch(matchId: string, userId: string): Promise<string> {
  const { rows } = await pool.query<{ other: string }>(
    `SELECT CASE WHEN user_a = $2 THEN user_b ELSE user_a END AS other
     FROM matches WHERE id = $1 AND (user_a = $2 OR user_b = $2)`,
    [matchId, userId]
  );
  if (!rows[0]) throw new HTTPException(404, { message: "Match not found" });
  return rows[0].other;
}

// ---- routes ----------------------------------------------------------------

const app = new Hono();

app.use("/api/*", cors({ origin: ALLOWED_ORIGINS, allowHeaders: ["Authorization", "Content-Type"] }));

app.get("/api/health", async (c) => {
  const { rows } = await pool.query("SELECT 1 AS ok");
  // Reports only whether each service is configured, never the values.
  return c.json({
    ok: rows[0].ok === 1,
    storage: !!process.env.AWS_ENDPOINT_URL_S3,
    realtime: !!realtimeSecret(),
  });
});

/** Mock-OTP registration: finds or creates the user by mobile number and issues a session token. */
app.post("/api/register", async (c) => {
  const { mobile, email } = await c.req.json<{ mobile?: string; email?: string }>();
  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) throw new HTTPException(400, { message: "Invalid mobile" });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HTTPException(400, { message: "Invalid email" });

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO users (id, mobile, email) VALUES ($1, $2, $3)
     ON CONFLICT (mobile) DO UPDATE SET email = EXCLUDED.email
     RETURNING id`,
    [`u_${randomUUID()}`, mobile, email]
  );
  const userId = rows[0].id;
  const token = randomBytes(32).toString("base64url");
  await pool.query("INSERT INTO sessions (token_hash, user_id) VALUES ($1, $2)", [sha256(token), userId]);
  return c.json({ token, user: { id: userId, mobile, email, profile: await getProfile(userId) } });
});

app.get("/api/me", async (c) => {
  const userId = await requireUser(c);
  const { rows } = await pool.query("SELECT id, mobile, email FROM users WHERE id = $1", [userId]);
  return c.json({ ...rows[0], profile: await getProfile(userId) });
});

app.post("/api/logout", async (c) => {
  const token = c.req.header("Authorization")?.slice(7);
  if (token) await pool.query("DELETE FROM sessions WHERE token_hash = $1", [sha256(token)]);
  return c.json({ ok: true });
});

/** Upload one photo (raw image body). Returns the object key to put in the profile. */
app.post("/api/photos", async (c) => {
  const userId = await requireUser(c);
  const type = c.req.header("Content-Type") ?? "";
  const ext = PHOTO_TYPES[type];
  if (!ext) throw new HTTPException(415, { message: "Photos must be JPEG, PNG or WebP" });
  const body = new Uint8Array(await c.req.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX_PHOTO_BYTES) {
    throw new HTTPException(413, { message: "Photo must be under 5 MB" });
  }
  // New key per upload, so a replaced photo never serves a stale cached copy.
  const key = `users/${userId}/${randomUUID()}.${ext}`;
  await files.upload(key, body, { contentType: type });
  return c.json({ key, url: (await signPhotoUrls([key]))[0] });
});

app.put("/api/me/profile", async (c) => {
  const userId = await requireUser(c);
  const p = await c.req.json<{
    name: string; age: number; gender: string; areas: string[]; budgetMin: number; budgetMax: number;
    roommates: number; social: number; traits: string[]; bio?: string; photoKeys: string[];
  }>();
  if (!p.name?.trim() || !GENDERS.includes(p.gender) || !Array.isArray(p.areas) || p.areas.length === 0) {
    throw new HTTPException(400, { message: "Invalid profile" });
  }
  // Only keys this user uploaded may be attached to their profile.
  if (!Array.isArray(p.photoKeys) || p.photoKeys.length !== 2 || p.photoKeys.some((k) => !k.startsWith(`users/${userId}/`))) {
    throw new HTTPException(400, { message: "Profile needs 2 of your uploaded photos" });
  }

  const { rows: old } = await pool.query<{ photo_keys: string[] }>(
    "SELECT photo_keys FROM profiles WHERE user_id = $1", [userId]
  );
  await pool.query(
    `INSERT INTO profiles (user_id, name, age, gender, areas, budget_min, budget_max, roommates, social, traits, bio, photo_keys)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (user_id) DO UPDATE SET
       name = EXCLUDED.name, age = EXCLUDED.age, gender = EXCLUDED.gender, areas = EXCLUDED.areas,
       budget_min = EXCLUDED.budget_min, budget_max = EXCLUDED.budget_max, roommates = EXCLUDED.roommates,
       social = EXCLUDED.social, traits = EXCLUDED.traits, bio = EXCLUDED.bio, photo_keys = EXCLUDED.photo_keys,
       updated_at = now()`,
    [userId, p.name.trim(), p.age, p.gender, p.areas, p.budgetMin, p.budgetMax, p.roommates, p.social,
     p.traits ?? [], p.bio?.trim() || null, p.photoKeys]
  );
  // Delete photos the user replaced, after responding.
  const removed = (old[0]?.photo_keys ?? []).filter((k) => !p.photoKeys.includes(k));
  if (removed.length) waitUntil(Promise.all(removed.map((k) => files.delete(k))).catch(console.error));

  return c.json(await getProfile(userId));
});

/** The swipe deck: everyone not yet swiped whose budget AND area overlap mine. Softer filters run client-side. */
app.get("/api/deck", async (c) => {
  const userId = await requireUser(c);
  const { rows } = await pool.query<ProfileRow>(
    `SELECT them.* FROM profiles me
     JOIN profiles them ON them.user_id <> me.user_id
       AND them.budget_min <= me.budget_max AND me.budget_min <= them.budget_max
       AND them.areas && me.areas
     WHERE me.user_id = $1
       AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = $1 AND s.target_id = them.user_id)
     ORDER BY them.updated_at DESC
     LIMIT 100`,
    [userId]
  );
  return c.json(await Promise.all(rows.map(toProfile)));
});

/** Record a swipe. A like becomes a match when it's mutual (demo profiles decide instantly). */
app.post("/api/swipes", async (c) => {
  const userId = await requireUser(c);
  const { targetId, direction } = await c.req.json<{ targetId: string; direction: string }>();
  if (direction !== "like" && direction !== "pass") throw new HTTPException(400, { message: "Invalid direction" });

  const { rows: target } = await pool.query<ProfileRow & { is_seed: boolean }>(
    "SELECT p.*, u.is_seed FROM profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = $1 AND p.user_id <> $2",
    [targetId, userId]
  );
  if (!target[0]) throw new HTTPException(404, { message: "Profile not found" });

  await pool.query(
    `INSERT INTO swipes (swiper_id, target_id, direction) VALUES ($1, $2, $3)
     ON CONFLICT (swiper_id, target_id) DO UPDATE SET direction = EXCLUDED.direction, created_at = now()`,
    [userId, targetId, direction]
  );
  if (direction === "pass") return c.json({ match: null });

  let mutual: boolean;
  if (target[0].is_seed) {
    const { rows: me } = await pool.query<ProfileRow>("SELECT * FROM profiles WHERE user_id = $1", [userId]);
    mutual = !!me[0] && seedLikesBack(me[0], target[0]);
    if (mutual) {
      await pool.query(
        `INSERT INTO swipes (swiper_id, target_id, direction) VALUES ($1, $2, 'like') ON CONFLICT DO NOTHING`,
        [targetId, userId]
      );
    }
  } else {
    const { rows } = await pool.query(
      "SELECT 1 FROM swipes WHERE swiper_id = $1 AND target_id = $2 AND direction = 'like'",
      [targetId, userId]
    );
    mutual = rows.length > 0;
  }
  if (!mutual) return c.json({ match: null });

  const [a, b] = [userId, targetId].sort();
  const { rows: m } = await pool.query<{ id: string }>(
    `INSERT INTO matches (id, user_a, user_b) VALUES ($1, $2, $3)
     ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a
     RETURNING id`,
    [randomUUID(), a, b]
  );
  return c.json({ match: { matchId: m[0].id, profile: await toProfile(target[0]) } });
});

app.get("/api/matches", async (c) => {
  const userId = await requireUser(c);
  const { rows } = await pool.query<ProfileRow & { match_id: string }>(
    `SELECT m.id AS match_id, p.* FROM matches m
     JOIN profiles p ON p.user_id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
     WHERE m.user_a = $1 OR m.user_b = $1
     ORDER BY m.created_at DESC`,
    [userId]
  );
  return c.json(await Promise.all(rows.map(async (r) => ({ matchId: r.match_id, profile: await toProfile(r) }))));
});

/** Seal the chat's live query for this user. The client subscribes with it via Neon Realtime. */
app.post("/api/matches/:id/messages/live", async (c) => {
  const userId = await requireUser(c);
  const matchId = c.req.param("id");
  await requireMatch(matchId, userId);
  return c.json(await getRealtime().seal({ query: messagesQuery(userId, matchId) }));
});

app.post("/api/matches/:id/messages", async (c) => {
  const userId = await requireUser(c);
  const matchId = c.req.param("id");
  const otherId = await requireMatch(matchId, userId);
  const { body } = await c.req.json<{ body?: string }>();
  const text = body?.trim();
  if (!text || text.length > 2000) throw new HTTPException(400, { message: "Message must be 1–2000 characters" });

  const { rows } = await pool.query<{ txid: string }>(
    `INSERT INTO messages (id, match_id, sender_id, body) VALUES ($1, $2, $3, $4)
     RETURNING pg_current_xact_id()::text AS txid`,
    [randomUUID(), matchId, userId, text]
  );

  // Demo profiles reply after a short "typing" pause, written to the DB so it arrives over Realtime.
  const { rows: other } = await pool.query<{ is_seed: boolean }>("SELECT is_seed FROM users WHERE id = $1", [otherId]);
  if (other[0]?.is_seed) {
    waitUntil(
      (async () => {
        await new Promise((r) => setTimeout(r, 1200));
        const { rows: n } = await pool.query<{ n: number }>(
          "SELECT count(*)::int AS n FROM messages WHERE match_id = $1 AND sender_id = $2", [matchId, otherId]
        );
        await pool.query(
          "INSERT INTO messages (id, match_id, sender_id, body) VALUES ($1, $2, $3, $4)",
          [randomUUID(), matchId, otherId, SEED_REPLIES[n[0].n % SEED_REPLIES.length]]
        );
      })().catch(console.error)
    );
  }
  return c.json({ kind: "committed", txid: rows[0].txid });
});

app.onError((err, c) => {
  if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
  console.error(err);
  return c.json({ error: "Internal error" }, 500);
});

export default app;
