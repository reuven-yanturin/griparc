import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLead, validateEvent } from "../lib/validation";
import { makeChallenge, checkChallenge, sameOrigin } from "../lib/server";
import { POST } from "../app/api/leads/route";
const session = "550e8400-e29b-41d4-a716-446655440000";
const lead = {
  email: " Test@Example.com ",
  goal: "pullup",
  experience: "new",
  variant: "pullup",
  plan: "annual",
  adult: true,
  consent: true,
  website: "",
  assessment: null,
};
test("normalizes email and whitelists lead fields", () => {
  const clean = validateLead({
    ...lead,
    extra: "never store",
    utm: { utm_source: "tiktok", email: "private@example.com" },
  });
  assert.equal(clean.email, "test@example.com");
  assert.deepEqual(clean.attribution, { utm_source: "tiktok" });
  assert.equal("extra" in clean, false);
});
test("requires explicit adult confirmation and consent; validates plan and spam trap", () => {
  for (const bad of [
    { adult: false },
    { consent: false },
    { consent: "true" },
    { email: "bad" },
    { plan: "free" },
    { website: "bot" },
    { experience: "expert" },
    { assessment: { goal: "pullup" } },
  ])
    assert.throws(() => validateLead({ ...lead, ...bad }));
});
test("analytics whitelist excludes identifying and detailed fitness data", () => {
  const event = validateEvent({
    event: "assessment_completed",
    session,
    marketing_variant: "pullup",
    selected_goal: "pullup",
    email: "private@example.com",
    pullups: 0,
    equipment: ["bar"],
  });
  assert.deepEqual(event?.properties, { selected_goal: "pullup" });
  assert.equal(
    validateEvent({ event: "made_up", session, marketing_variant: "beginner" }),
    null,
  );
  assert.equal(
    validateEvent({
      event: "early_access_submitted",
      session,
      marketing_variant: "beginner",
    }),
    null,
  );
});
test("signed challenges reject tampering, instant posts and stale forms", () => {
  process.env.FORM_SIGNING_SECRET = "test-secret-with-more-than-32-characters";
  const now = Date.now();
  const token = makeChallenge(now);
  assert.equal(checkChallenge(token, now), false);
  assert.equal(checkChallenge(token, now + 2000), true);
  assert.equal(checkChallenge(token + "a", now + 2000), false);
  assert.equal(checkChallenge(token, now + 7200001), false);
});
test("lead endpoint saves validated data and responds generically for duplicates", async () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-server-key";
  process.env.FORM_SIGNING_SECRET = "test-secret-with-more-than-32-characters";
  const realFetch = globalThis.fetch;
  const writes: unknown[] = [];
  globalThis.fetch = async (input, init) => {
    const path = String(input);
    if (path.endsWith("consume_rate_limit")) return Response.json(true);
    writes.push(JSON.parse(String(init?.body)));
    return new Response(null, { status: 204 });
  };
  try {
    for (let i = 0; i < 2; i++) {
      const request = new Request("http://localhost:3000/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
        },
        body: JSON.stringify({
          ...lead,
          session,
          analytics: true,
          token: makeChallenge(Date.now() - 2000),
        }),
      });
      const response = await POST(request);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    }
    assert.equal(writes.length, 2);
    assert.equal(
      (writes[0] as { p_lead: { email: string } }).p_lead.email,
      "test@example.com",
    );
    const invalid = await POST(
      new Request("http://localhost:3000/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, adult: false }),
      }),
    );
    assert.equal(invalid.status, 400);
    const crossOrigin = await POST(
      new Request("http://localhost:3000/api/leads", {
        method: "POST",
        headers: { Origin: "https://evil.example" },
      }),
    );
    assert.equal(crossOrigin.status, 403);
  } finally {
    globalThis.fetch = realFetch;
  }
});
test("lead endpoint surfaces storage errors and rate limiting without false success", async () => {
  const realFetch = globalThis.fetch;
  const request = () =>
    new Request("http://localhost:3000/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...lead,
        token: makeChallenge(Date.now() - 2000),
      }),
    });
  try {
    globalThis.fetch = async () => Response.json(false);
    assert.equal((await POST(request())).status, 429);
    globalThis.fetch = async () => new Response(null, { status: 500 });
    assert.equal((await POST(request())).status, 503);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("origin checks allow trusted host behind an internal Next.js bind address", () => {
  assert.equal(
    sameOrigin(
      new Request("http://0.0.0.0:3000/api/leads", {
        headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      }),
    ),
    true,
  );
  assert.equal(
    sameOrigin(
      new Request("http://0.0.0.0:3000/api/leads", {
        headers: { origin: "https://evil.example", host: "localhost:3000" },
      }),
    ),
    false,
  );
});

test("lead assessment storage excludes unknown fields", () => {
  const clean = validateLead({
    ...lead,
    assessment: {
      experience: "new",
      goal: "pullup",
      pushups: "0",
      pullups: "0",
      equipment: ["none"],
      days: "2",
      duration: "15",
      medical_history: "never retain this field",
    },
  });
  assert.ok(clean.assessment);
  assert.equal("medical_history" in clean.assessment, false);
  assert.equal(Object.keys(clean.assessment).length, 7);
});
