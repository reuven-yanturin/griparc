import {
  configured,
  rateLimit,
  sameOrigin,
  readJson,
  database,
  json,
} from "@/lib/server";
import { validateEvent } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Request not allowed." }, 403);
  if (
    request.headers.get("dnt") === "1" ||
    request.headers.get("sec-gpc") === "1"
  )
    return new Response(null, { status: 204 });
  if (!configured()) return new Response(null, { status: 204 });
  let event;
  try {
    event = validateEvent(await readJson(request));
  } catch {
    return json({ error: "Invalid event." }, 400);
  }
  if (!event) return json({ error: "Invalid event." }, 400);
  try {
    if (!(await rateLimit(request, "event")))
      return new Response(null, { status: 429 });
    await database("funnel_events", event, { Prefer: "return=minimal" });
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
}
