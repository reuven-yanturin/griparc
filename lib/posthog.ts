import { validateEvent } from "./validation";

export type AnalyticsEvent = {
  event_name: string;
  session_id: string;
  marketing_variant: string;
  properties: Record<string, unknown>;
};

// Server-only HTTP integration: no browser SDK, auto-capture, cookies or replay.
export async function capturePosthog(event: AnalyticsEvent): Promise<boolean> {
  const apiKey = process.env.POSTHOG_PROJECT_API_KEY;
  if (!apiKey) return false;
  const host = (process.env.POSTHOG_HOST || "https://us.i.posthog.com").replace(
    /\/+$/,
    "",
  );
  if (
    !["https://us.i.posthog.com", "https://eu.i.posthog.com"].includes(host)
  ) {
    console.warn(
      "PostHog capture disabled: choose the US or EU ingestion host.",
    );
    return false;
  }
  // Defense in depth: re-apply the event/property allowlist before any export.
  // Submitted events can only reach this function through the server lead path.
  const validated = validateEvent({
    ...event.properties,
    event:
      event.event_name === "early_access_submitted"
        ? "early_access_started"
        : event.event_name,
    session: event.session_id,
    marketing_variant: event.marketing_variant,
  });
  if (!validated) return false;
  try {
    const response = await fetch(`${host}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: event.event_name,
        distinct_id: event.session_id,
        timestamp: new Date().toISOString(),
        properties: {
          ...validated.properties,
          marketing_variant: event.marketing_variant,
          $process_person_profile: false,
          $geoip_disable: true,
          $ip: "0.0.0.0",
          $is_server: true,
        },
      }),
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
      redirect: "error",
    });
    if (!response.ok)
      console.warn(
        `PostHog capture failed (HTTP ${response.status}); Supabase data is preserved.`,
      );
    return response.ok;
  } catch {
    console.warn("PostHog capture unavailable; Supabase data is preserved.");
    return false;
  }
}
