import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
export class ServiceError extends Error {}
export function configured() {
  const issues: string[] = [];
  if (!process.env.SUPABASE_URL) issues.push("SUPABASE_URL is missing");
  if (
    !process.env.SUPABASE_SECRET_KEY &&
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    issues.push("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is missing");
  if (!process.env.FORM_SIGNING_SECRET)
    issues.push("FORM_SIGNING_SECRET is missing");
  else if (process.env.FORM_SIGNING_SECRET.length < 32)
    issues.push("FORM_SIGNING_SECRET must contain at least 32 characters");
  // Server logs identify configuration errors without exposing any values.
  if (issues.length)
    console.error(`[GripArc configuration] ${issues.join("; ")}`);
  return issues.length === 0;
}
// Modern secret keys belong only in apikey; legacy JWT keys also use Bearer.
export function supabaseConnection() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ServiceError("Storage is not configured.");
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  return { url, headers };
}
export async function database(
  path: string,
  body: unknown,
  extra: Record<string, string> = {},
) {
  const { url, headers } = supabaseConnection();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", ...extra },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) throw new ServiceError("Storage request failed.");
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
function signature(value: string) {
  return createHmac("sha256", process.env.FORM_SIGNING_SECRET || "")
    .update(value)
    .digest("hex");
}
export function makeChallenge(now = Date.now()) {
  const value = `${now}.${randomUUID()}`;
  return `${value}.${signature(value)}`;
}
export function checkChallenge(token: unknown, now = Date.now()) {
  if (typeof token !== "string" || token.length > 160) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const elapsed = now - Number(parts[0]);
  if (
    !Number.isFinite(elapsed) ||
    elapsed < 1500 ||
    elapsed > 2 * 60 * 60 * 1000
  )
    return false;
  const actual = Buffer.from(parts[2]);
  const expected = Buffer.from(signature(`${parts[0]}.${parts[1]}`));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function rateLimit(request: Request, kind: "lead" | "event") {
  // Vercel sets x-forwarded-for. Store a keyed, daily-rotating digest, never raw IPs.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const day = new Date().toISOString().slice(0, 10);
  const digest = signature(`${day}:${kind}:${ip}`);
  return (
    (await database("rpc/consume_rate_limit", {
      p_key: digest,
      p_limit: kind === "lead" ? 10 : 180,
      p_window_seconds: kind === "lead" ? 3600 : 600,
    })) === true
  );
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (
    origin === new URL(request.url).origin ||
    origin === process.env.NEXT_PUBLIC_SITE_URL
  )
    return true;
  try {
    const parsed = new URL(origin);
    // Next.js may reconstruct request.url using its internal bind address.
    // The browser Origin must still match the actual incoming Host and scheme.
    const scheme =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
      new URL(request.url).protocol.replace(":", "");
    return (
      parsed.host === request.headers.get("host") &&
      parsed.protocol === `${scheme}:`
    );
  } catch {
    return false;
  }
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("Expected JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 16000) {
      await reader.cancel();
      throw new Error("Request too large.");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
