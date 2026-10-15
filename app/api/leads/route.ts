import {
  configured,
  makeChallenge,
  checkChallenge,
  rateLimit,
  sameOrigin,
  readJson,
  database,
  json,
} from "@/lib/server";
import { validateLead, validSession } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET() {
  if (!configured())
    return json(
      {
        error:
          "Early access registration is not configured yet. Please try again later.",
      },
      503,
    );
  return json({ token: makeChallenge() });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: "Request not allowed." }, 403);
  if (!configured())
    return json(
      {
        error:
          "Early access registration is not configured yet. Please try again later.",
      },
      503,
    );
  let body;
  let lead;
  try {
    body = await readJson(request);
    lead = validateLead(body);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Please check your details.",
      },
      400,
    );
  }
  if (!checkChallenge(body.token))
    return json(
      {
        error:
          "Please wait a moment and try again. If this page has been open a while, refresh it first.",
      },
      400,
    );
  try {
    if (!(await rateLimit(request, "lead")))
      return json(
        { error: "Too many attempts. Please try again in an hour." },
        429,
      );
    await database("rpc/register_early_access", {
      p_lead: lead,
      p_session: validSession(body.session) ? body.session : null,
      p_analytics:
        body.analytics === true &&
        request.headers.get("dnt") !== "1" &&
        request.headers.get("sec-gpc") !== "1",
    });
    return json({ ok: true });
  } catch {
    return json(
      {
        error: "We couldn’t save your registration. Please try again shortly.",
      },
      503,
    );
  }
}
