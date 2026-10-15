import { test } from "node:test";
import assert from "node:assert/strict";
import { configured, database, supabaseConnection } from "../lib/server";
import { POST } from "../app/api/events/route";

function configure() {
  process.env.SUPABASE_URL = "https://project.supabase.co/";
  process.env.FORM_SIGNING_SECRET = "test-only-secret-at-least-32-characters";
}
test("modern Supabase secret uses apikey without an invalid Bearer token", async () => {
  configure();
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test_only";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-test-key";
  assert.equal(configured(), true);
  const connection = supabaseConnection();
  assert.equal(connection.url, "https://project.supabase.co");
  assert.deepEqual(connection.headers, { apikey: "sb_secret_test_only" });
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    assert.equal(
      String(input),
      "https://project.supabase.co/rest/v1/funnel_events",
    );
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("apikey"), "sb_secret_test_only");
    assert.equal(headers.has("authorization"), false);
    return new Response(null, { status: 204 });
  };
  try {
    await database("funnel_events", { event_name: "landing_view" });
  } finally {
    globalThis.fetch = original;
    delete process.env.SUPABASE_SECRET_KEY;
  }
});
test("legacy service role remains supported", () => {
  configure();
  delete process.env.SUPABASE_SECRET_KEY;
  process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-test-key";
  assert.equal(
    supabaseConnection().headers.Authorization,
    "Bearer legacy-test-key",
  );
});
test("first-party analytics writes only allowed non-identifying event properties", async () => {
  configure();
  process.env.SUPABASE_SERVICE_ROLE_KEY = "legacy-test-key";
  const original = globalThis.fetch;
  let stored: Record<string, unknown> | undefined;
  globalThis.fetch = async (input, init) => {
    if (String(input).endsWith("consume_rate_limit"))
      return Response.json(true);
    stored = JSON.parse(String(init?.body));
    return new Response(null, { status: 204 });
  };
  try {
    const response = await POST(
      new Request("http://localhost:3000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "landing_view",
          session: "550e8400-e29b-41d4-a716-446655440000",
          marketing_variant: "pullup",
          utm_source: "tiktok",
          email: "never-store@example.com",
          pullups: 0,
        }),
      }),
    );
    assert.equal(response.status, 204);
    assert.equal(stored?.event_name, "landing_view");
    assert.deepEqual(stored?.properties, { utm_source: "tiktok" });
  } finally {
    globalThis.fetch = original;
  }
});
test("privacy signals prevent analytics database writes", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    assert.fail("No database request should be sent for an analytics opt-out");
  };
  try {
    for (const header of ["dnt", "sec-gpc"]) {
      const response = await POST(
        new Request("http://localhost:3000/api/events", {
          method: "POST",
          headers: { [header]: "1" },
        }),
      );
      assert.equal(response.status, 204);
    }
  } finally {
    globalThis.fetch = original;
  }
});
