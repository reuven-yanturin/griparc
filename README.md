# GripArc market validation website

A mobile-first Next.js App Router / TypeScript / Tailwind website for an upcoming iOS calisthenics app. No accounts, checkout, workout engine, or real tracked progress. The app is clearly in development throughout.

## Local setup

Requires Node.js 20.9+ (Node 22 LTS recommended).

```sh
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The full assessment and results preview work without credentials. Registration deliberately returns an unavailable state until Supabase is configured; no lead is silently lost or fake-saved.

For step-by-step Russian instructions, see [Подключение Supabase и аналитики](SETUP.ru.md).

## Supabase setup

1. Create a Supabase project; choose a US region for the intended audience.
2. Run `supabase/migrations/001_validation.sql`, then `supabase/migrations/002_posthog_conversion_status.sql`, once each using the SQL editor. It creates private lead/event tables, durable rate limits, and atomic registration RPCs. RLS is enabled; anon/authenticated have no access.
3. Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (`sb_secret_...`, from Settings → API Keys) in `.env.local`. An existing legacy `service_role` JWT can use `SUPABASE_SERVICE_ROLE_KEY` instead. These variables are server-only. Never use a `NEXT_PUBLIC_` prefix for a secret.
4. Generate a `FORM_SIGNING_SECRET` with `openssl rand -hex 32` and set it in `.env.local`.
5. Run `npm run check:supabase` to check table access and RPC availability without reading personal data or creating fake registrations.
6. Restart the server. Complete a real signup and verify the lead and conversion event in the SQL editor. Repeat the same normalized email: it should succeed generically without adding a second lead or conversion.

The app calls Supabase’s REST API directly from route handlers, avoiding a browser database client. No secrets reach the browser. A service key bypasses RLS by design; keep it in the deployment’s secret environment settings.

## Deploy to Vercel

1. Import this repository and set **Root Directory** to `web`.
2. Choose the Next.js preset (build `npm run build`, install `npm ci`).
3. Add `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`), `FORM_SIGNING_SECRET`, and `NEXT_PUBLIC_SITE_URL=https://your-real-domain.com` to the appropriate environment. The privacy contact defaults to `support@griparc.site`; optionally override it with `PRIVACY_CONTACT_EMAIL`.
4. Deploy. Set the canonical production domain for `NEXT_PUBLIC_SITE_URL`, then redeploy so metadata and sitemap use it. Use the preview URL as that variable in preview environments if needed.
5. Run the live smoke test below before buying traffic.

No deployment or live database is provisioned by the source code. No billing provider is required.

## Routes and experiment

- `/` and `/?variant=beginner`: “Start calisthenics from zero.”
- `/?variant=pullup`: “Unlock your first pull-up.”
- `/assessment`: adult gate, seven steps, multi-select equipment, back navigation and validation.
- `/results`: requires a completed assessment; transparent starting-category rules, clickable illustrative skill map, example session structure and gamification.
- `/early-access`: planned $9.99 monthly / $59.99 annual pricing, optional plan interest, email + goal + experience + adult confirmation + email consent.
- `/privacy`: data-use notice.

Variant, answers, UTM attribution and a random session ID persist in **sessionStorage**, only for the tab session. Direct signup is supported. Later campaign links with explicit variants update attribution. Use separate campaign links with comparable audiences and creative budgets to compare positioning. There is no automatic random assignment; this is a campaign-based experiment, not a causal A/B testing platform.

On mobile, signup appears before the full pricing cards to minimize friction; a small optional plan selector keeps stated interest measurable.

The same headline, design, pricing, questions and signup flow are used for both variants. Positioning and the corresponding hero milestone differ. Returning to the homepage keeps the most recently selected variant when no explicit variant query is provided.

## Measurement

First-party `/api/events` writes to `funnel_events`. Optional server-side PostHog mirroring provides visual charts and funnels; there is no browser analytics SDK, auto-capture, replay, cookies, fingerprinting or persistent user ID. Event data is allowlisted. Detailed assessment answers are saved only if the visitor explicitly signs up. Do Not Track / Global Privacy Control opt out of measurement, including the server conversion event.

Events: `landing_view`, `hero_cta_click`, `assessment_started`, `assessment_step_completed` (step number only), `assessment_completed`, `results_viewed`, `pricing_viewed` (at least 25% of pricing cards visible, or focus on the optional in-form pricing selector), `plan_selected`, `early_access_started`, `early_access_submitted`.

The last event is recorded **server-side in the same transaction as a new lead**. Duplicate email attempts do not increase registrations or conversions. Browser-originated submitted events are rejected. Other analytics are best-effort: blockers, network failures and privacy preferences can reduce observed funnel totals. Registrations remain the source of truth. Tab IDs are approximate sessions, not unique people.

Run the reporting queries in `supabase/reporting.sql`. Primary metric: **new assessment-qualified registrations / landing sessions**, split by variant. Also compare start/completion rates, goal mix and optional plan preferences. Visitors who opt out of analytics can still register, so lead totals and measured funnel totals may differ. Stated plan interest is not willingness-to-pay evidence and no revenue is collected.

Use campaign IDs in UTMs; never put email, names, sensitive data or detailed fitness answers into campaign parameters. Ad attribution from Google/TikTok click identifiers is intentionally not collected.

## PostHog analytics

1. Create a PostHog account/project. Choose US Cloud if using the default host; EU Cloud is also supported.
2. Add `POSTHOG_PROJECT_API_KEY` (the **Project API key**, not a Personal API key) to `.env.local` and Vercel environment settings. Set `POSTHOG_HOST` to `https://us.i.posthog.com` or `https://eu.i.posthog.com` to match the project.
3. Apply migration `002_posthog_conversion_status.sql` **before deploying this code**, even if `001_validation.sql` was applied earlier. It adds `register_early_access_v2` without changing existing rows or removing the old RPC.
4. Restart/redeploy. Visit a campaign URL and complete a consented test signup. Verify events in PostHog as well as Supabase. Repeating the same email must not add another submitted event.
5. Build a funnel: `landing_view` → `assessment_started` → `assessment_completed` → `results_viewed` → `pricing_viewed` → `early_access_submitted`. Break down by event property `marketing_variant`. Also save a shorter landing → signup funnel because direct signup is supported.
6. Add trends for unique `landing_view` sessions, `early_access_submitted`, `plan_selected` by `selected_plan`, and submitted events by `selected_goal` / `utm_source`. A distinct ID is a tab session, not an identified person.

The server uses PostHog's [capture API](https://posthog.com/docs/api/capture) after successful Supabase writes, with an anonymous random session ID, person profiles disabled and GeoIP disabled. A second allowlist strips unsupported fields before export. Visitor headers and IPs are not forwarded. Privacy opt-outs bypass both stores' analytics.

The Supabase conversion commits atomically with the lead. PostHog mirroring is **best effort**, has a 1.5-second timeout, and logs only generic failure/status messages. A PostHog outage never changes a successful signup to an error. Mirroring is awaited to avoid losing an unawaited promise on Vercel; it can add up to 1.5 seconds to a signup response. There is no retry queue or historical backfill: Supabase remains the source of truth, and missing PostHog copies after a network failure will not be retried by duplicate submissions. Configure project retention separately; Supabase's cleanup does not remove PostHog data. No events are sent to PostHog when the key is blank.

## Spam protection and privacy operations

- HMAC-signed timing challenge (minimum 1.5 seconds, two-hour expiry), hidden honeypot and server-side enum/consent/age validation.
- Atomic Supabase rate limiting: 10 lead attempts/hour and 180 analytics events/10 minutes per keyed daily IP digest. Tuned for a lean pilot; shared networks can hit limits. For hostile traffic, enable Vercel’s firewall/bot protection. A timing challenge is not a CAPTCHA.
- Same-origin checks, 16 KB request limits, secret-free client, private database tables and no raw IP stored by the app. Vercel supplies the forwarded IP in production; use a trusted proxy if self-hosting.
- Duplicate normalized emails are ignored without revealing whether the email existed. Existing consent/preferences are not overwritten by anonymous submissions.
- **Before launch:** configure a working launch-email sender and unsubscribe mechanism in your email provider, ensure the published privacy contact `support@griparc.site` receives mail (or override it with `PRIVACY_CONTACT_EMAIL`), and use consented exports only. This website does not send email. Honor deletion requests in both Supabase and your mailing provider. Avoid exporting assessment details to marketing tools.
- Schedule the cleanup statements at the end of `supabase/reporting.sql` daily using Supabase Cron (or execute manually in the pilot). This enforces the privacy notice’s 90-day anonymous event retention and expires rate-limit digests. Set a concrete end date for the validation experiment and delete lead data if the project is abandoned.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Tests cover assessment completion, equipment contradictions, category rules, lead normalization/validation, analytics property filtering, signed spam challenges, cross-origin rejection, mocked server saves, duplicate response behavior, rate limiting and database error states. They do not claim to validate a live database. The SQL transaction enforces duplicate handling in production.

Live smoke test: on a mobile viewport, visit each campaign URL with UTMs, start the adult-gated assessment, go back and confirm answers persist, finish all seven steps, click each skill node, view pricing, choose/clear a plan, submit a new consented email, and repeat that email. Verify exactly one lead and one server conversion event, plus expected variant/attribution in Supabase. Test missing consent and a failed network request. Check the preview and no-purchase labels before running ads.

## Assets

The fitness photograph is served locally from `public/athlete.jpg` (Unsplash, image endpoint https://images.unsplash.com/photo-1598971639058-fab3c3109a00). It illustrates bodyweight movement and is not an endorsement or customer claim. All progression graphics are CSS/SVG and Lucide icons. System typography avoids remote font downloads. Open Graph artwork is generated by Next.js at `/opengraph-image`.
