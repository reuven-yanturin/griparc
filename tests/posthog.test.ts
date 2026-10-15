import { test } from "node:test";
import assert from "node:assert/strict";
import { capturePosthog } from "../lib/posthog";
import { POST as submitLead } from "../app/api/leads/route";
import { POST as submitEvent } from "../app/api/events/route";
import { makeChallenge } from "../lib/server";
const session = "550e8400-e29b-41d4-a716-446655440000";
const event = {
  event_name: "landing_view",
  session_id: session,
  marketing_variant: "pullup",
  properties: {
    utm_source: "tiktok",
    email: "private@example.com",
    pullups: 0,
  },
};
function configure() {
  process.env.POSTHOG_PROJECT_API_KEY = "phc_test_only";
  process.env.POSTHOG_HOST = "https://us.i.posthog.com";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-only";
  process.env.FORM_SIGNING_SECRET = "test-only-form-secret-over-32-characters";
}
function leadRequest(analytics = true) {
  return new Request("http://localhost:3000/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.com",
      goal: "pullup",
      experience: "new",
      variant: "pullup",
      plan: "annual",
      adult: true,
      consent: true,
      session,
      analytics,
      token: makeChallenge(Date.now() - 2000),
    }),
  });
}
test("PostHog is disabled without a project key", async () => {
  delete process.env.POSTHOG_PROJECT_API_KEY;
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    assert.fail("Disabled analytics must not fetch");
  };
  try {
    assert.equal(await capturePosthog(event), false);
  } finally {
    globalThis.fetch = original;
  }
});
test("PostHog receives an anonymous, allowlisted event on the selected host", async () => {
  configure();
  process.env.POSTHOG_HOST = "https://eu.i.posthog.com/";
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), "https://eu.i.posthog.com/i/v0/e/");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.distinct_id, session);
    assert.equal(body.event, "landing_view");
    assert.equal(body.properties.marketing_variant, "pullup");
    assert.equal(body.properties.$process_person_profile, false);
    assert.equal(body.properties.$geoip_disable, true);
    assert.equal("email" in body.properties, false);
    assert.equal("pullups" in body.properties, false);
    assert.equal(new Headers(init?.headers).has("x-forwarded-for"), false);
    return Response.json({ status: 1 });
  };
  try {
    assert.equal(await capturePosthog(event), true);
  } finally {
    globalThis.fetch = original;
  }
});
test("PostHog outages do not turn a saved signup into an error; duplicates are not mirrored", async () => {
  configure();
  const original = globalThis.fetch;
  let captures = 0;
  let newLead = true;
  globalThis.fetch = async (input) => {
    const path = String(input);
    if (path.endsWith("consume_rate_limit")) return Response.json(true);
    if (path.endsWith("register_early_access_v2")) {
      const created = newLead;
      newLead = false;
      return Response.json(created);
    }
    if (path.includes("posthog.com")) {
      captures++;
      return new Response(null, { status: 503 });
    }
    assert.fail("Unexpected destination");
  };
  try {
    assert.equal((await submitLead(leadRequest())).status, 200);
    assert.equal((await submitLead(leadRequest())).status, 200);
    assert.equal(captures, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("privacy opt-out saves the lead without sending any PostHog conversion", async () => {
  configure();
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const path = String(input);
    assert.equal(path.includes("posthog.com"), false);
    if (path.endsWith("consume_rate_limit")) return Response.json(true);
    assert.equal(JSON.parse(String(init?.body)).p_analytics, false);
    return Response.json(true);
  };
  try {
    assert.equal((await submitLead(leadRequest(false))).status, 200);
  } finally {
    globalThis.fetch = original;
  }
});
test("event route persists to Supabase before mirroring to PostHog", async () => {
  configure();
  const original = globalThis.fetch;
  const destinations: string[] = [];
  globalThis.fetch = async (input) => {
    destinations.push(String(input));
    if (String(input).endsWith("consume_rate_limit"))
      return Response.json(true);
    return new Response(null, { status: 200 });
  };
  try {
    const response = await submitEvent(
      new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "landing_view",
          session,
          marketing_variant: "pullup",
        }),
      }),
    );
    assert.equal(response.status, 204);
    assert.ok(destinations[1].endsWith("/funnel_events"));
    assert.ok(destinations[2].endsWith("/i/v0/e/"));
  } finally {
    globalThis.fetch = original;
  }
});
