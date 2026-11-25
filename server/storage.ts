import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

/** Private bucket declared in neon.ts. Endpoint/region/credentials come from the AWS_* env vars. */
export const BUCKET = "assets";
export const files = new Files({ adapter: neon({ bucket: BUCKET }) });

/** Short-lived signed GET URLs, since the bucket is private. */
export async function signPhotoUrls(keys: string[]): Promise<string[]> {
  return Promise.all(keys.map((key) => files.url(key, { expiresIn: 3600 })));
}
