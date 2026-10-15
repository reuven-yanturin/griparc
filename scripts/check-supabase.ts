import { configured, supabaseConnection } from "../lib/server";

async function main() {
  if (!configured()) {
    console.error(
      "Missing configuration. Set SUPABASE_URL, SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY), and FORM_SIGNING_SECRET in .env.local.",
    );
    process.exitCode = 1;
    return;
  }
  const { url, headers } = supabaseConnection();
  const safeError = async (response: Response) => {
    try {
      const body = (await response.json()) as {
        code?: unknown;
        message?: unknown;
      };
      const code = typeof body.code === "string" ? body.code : "";
      const message = typeof body.message === "string" ? body.message : "";
      // PostgREST messages may contain schema details. Keep diagnostics concise
      // and avoid echoing arbitrary response content to the terminal.
      const known = new Map([
        ["PGRST205", "table not found in the exposed schema; apply migration 001"],
        ["PGRST202", "RPC function not found; apply the required migration"],
        ["PGRST204", "column not found; apply the required migration"],
        ["PGRST301", "JWT/key authentication failed; verify the server key"],
        ["42501", "permission denied; verify the server key and grants"],
        ["42P01", "table not found; apply migration 001"],
      ]);
      if (known.has(code)) return `${code}: ${known.get(code)}`;
      if (/invalid api key|invalid.*jwt|jwt.*invalid|no api key/i.test(message))
        return "authentication failed; verify SUPABASE_SECRET_KEY";
      return code ? `${code}: Supabase rejected the request` : "no diagnostic code returned";
    } catch {
      return "Supabase returned no readable diagnostic";
    }
  };
  let failed = false;
  for (const [table, column] of [
    ["early_access_leads", "id"],
    ["funnel_events", "id"],
    ["request_limits", "key"],
  ]) {
    const response = await fetch(
      `${url}/rest/v1/${table}?select=${column}&limit=0`,
      { headers, signal: AbortSignal.timeout(8000) },
    );
    // limit=0 checks permissions/schema without reading or printing personal data.
    if (response.ok) console.log(`OK: ${table}`);
    else {
      failed = true;
      console.error(
        `FAIL: ${table} (HTTP ${response.status}; ${await safeError(response)}).`,
      );
    }
  }
  if (failed) {
    process.exitCode = 1;
    return;
  }
  const schema = await fetch(`${url}/rest/v1/`, {
    headers: { ...headers, Accept: "application/openapi+json" },
    signal: AbortSignal.timeout(8000),
  });
  if (schema.ok) {
    const definition = await schema.json();
    for (const rpc of ["consume_rate_limit", "register_early_access_v2"]) {
      if (definition.paths?.[`/rpc/${rpc}`]) console.log(`OK: ${rpc}`);
      else {
        failed = true;
        console.error(`FAIL: missing RPC ${rpc}; run the migration.`);
      }
    }
  } else
    console.log(
      "RPC introspection unavailable. Verify both migration functions in Supabase before the live signup test.",
    );
  if (failed) process.exitCode = 1;
  else
    console.log(
      "Read-only checks complete. Next: submit a consented test signup and verify one lead and one conversion event.",
    );
}
main().catch(() => {
  console.error(
    "Connection check failed. Verify the project URL, network access, and Supabase availability. Secrets and response bodies are not logged.",
  );
  process.exitCode = 1;
});
