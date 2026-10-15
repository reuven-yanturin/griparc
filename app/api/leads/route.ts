import { capturePosthog } from "@/lib/posthog";
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
    const session = validSession(body.session) ? body.session : null;
    const analytics =
      body.analytics === true &&
      request.headers.get("dnt") !== "1" &&
      request.headers.get("sec-gpc") !== "1";
    const created = await database("rpc/register_early_access_v2", {
      p_lead: lead,
      p_session: session,
      p_analytics: analytics,
    });
    if (created === true && analytics && session) {
      await capturePosthog({
        event_name: "early_access_submitted",
        session_id: session,
        marketing_variant: String(lead.marketing_variant),
        properties: {
          ...lead.attribution,
          selected_goal: lead.selected_goal,
          experience_level: lead.experience_level,
          selected_plan: lead.selected_plan,
        },
      });
    }
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
