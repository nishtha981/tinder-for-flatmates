/**
 * Client for the FlatMate API (a Neon Function). Replaces the old localStorage store.
 * Only the session token lives in the browser; all data lives in Neon Postgres + Object Storage.
 */
import type { SealedLiveQuery } from "@neon/realtime/client";
import type { Profile, SwipeDirection, User } from "./types";

// Dev: empty, so requests go to /api and Vite proxies them to `neon dev`. Prod: the Function's URL.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";
const TOKEN_KEY = "ffm.token";

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // private mode: the session just won't survive a reload
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const msg = await res.json().then((j) => j.error as string, () => res.statusText);
    if (res.status === 401) setToken(null);
    throw new ApiError(res.status, msg || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

// ---- Account ---------------------------------------------------------------

export async function register(mobile: string, email: string): Promise<User> {
  const { token, user } = await post<{ token: string; user: User }>("/api/register", { mobile, email });
  setToken(token);
  return user;
}

/** The signed-in user, or null if there's no valid session. */
export async function getMe(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    return await request<User>("/api/me");
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export async function logout(): Promise<void> {
  await post("/api/logout").catch(() => undefined);
  setToken(null);
}

// ---- Profile & photos ------------------------------------------------------

/** Downscale to at most 1080px on the long edge and re-encode as JPEG, so uploads stay small. */
async function toJpeg(dataUrl: string): Promise<Blob> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, 1080 / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process photo"))), "image/jpeg", 0.85)
  );
}

async function uploadPhoto(dataUrl: string): Promise<string> {
  const body = await toJpeg(dataUrl);
  const { key } = await request<{ key: string }>("/api/photos", {
    method: "POST",
    body,
    headers: { "Content-Type": "image/jpeg" },
  });
  return key;
}

/**
 * Saves the profile. `profile.photos` may mix new picks (data: URLs, uploaded here) and
 * existing photos (signed URLs), which map back to their keys via `previous`.
 */
export async function saveProfile(profile: Profile, previous?: Profile): Promise<Profile> {
  const photoKeys = await Promise.all(
    profile.photos.map((src) => {
      if (src.startsWith("data:")) return uploadPhoto(src);
      const i = previous?.photos.indexOf(src) ?? -1;
      const key = previous?.photoKeys?.[i];
      if (!key) throw new Error("Please re-add your photos.");
      return key;
    })
  );
  const { photos: _photos, ...rest } = profile;
  return request<Profile>("/api/me/profile", { method: "PUT", body: JSON.stringify({ ...rest, photoKeys }) });
}

// ---- Discovery, swipes & matches ------------------------------------------

/** Candidates whose budget and area overlap yours, not yet swiped. */
export const getDeck = () => request<Profile[]>("/api/deck");

export interface Match {
  matchId: string;
  profile: Profile;
}

export const recordSwipe = (targetId: string, direction: SwipeDirection) =>
  post<{ match: Match | null }>("/api/swipes", { targetId, direction });

export const getMatches = () => request<Match[]>("/api/matches");

// ---- Chat (Neon Realtime) --------------------------------------------------

export interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: Date;
}

/** A sealed live query for one match's messages, renewed by useLiveQuery before it expires. */
export const fetchSealedMessages = (matchId: string) =>
  post<SealedLiveQuery<MessageRow>>(`/api/matches/${encodeURIComponent(matchId)}/messages/live`);

export const sendMessage = (matchId: string, body: string) =>
  post<{ kind: "committed"; txid: string }>(`/api/matches/${encodeURIComponent(matchId)}/messages`, { body });
