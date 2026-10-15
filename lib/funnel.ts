"use client";
import type { Answers, Variant, Plan } from "./assessment";
export type Funnel = {
  variant: Variant;
  answers: Answers;
  adult: boolean;
  completed: boolean;
  plan?: Plan;
  utm: Record<string, string>;
  session: string;
};
const key = "griparc-funnel-v1";
export function getFunnel(): Funnel {
  const base: Funnel = {
    variant: "beginner",
    answers: {},
    adult: false,
    completed: false,
    utm: {},
    session: crypto.randomUUID(),
  };
  try {
    const saved = sessionStorage.getItem(key);
    if (saved) return { ...base, ...JSON.parse(saved) };
  } catch {}
  return base;
}
export function saveFunnel(patch: Partial<Funnel>): Funnel {
  const f = { ...getFunnel(), ...patch };
  try {
    sessionStorage.setItem(key, JSON.stringify(f));
  } catch {}
  return f;
}
export function captureAttribution(): Funnel {
  const params = new URLSearchParams(location.search);
  const saved = getFunnel();
  const v = params.get("variant");
  const utm = { ...saved.utm };
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]) {
    const value = params.get(key);
    if (value) utm[key] = value.slice(0, 120);
  }
  if (!utm.acquisition_source)
    utm.acquisition_source =
      utm.utm_source || (document.referrer ? "referral" : "direct");
  return saveFunnel({
    variant: v === "pullup" || v === "beginner" ? v : saved.variant,
    utm,
  });
}
export const eventNames = [
  "landing_view",
  "hero_cta_click",
  "assessment_started",
  "assessment_step_completed",
  "assessment_completed",
  "results_viewed",
  "pricing_viewed",
  "plan_selected",
  "early_access_started",
  "early_access_submitted",
] as const;
export type EventName = (typeof eventNames)[number];
export function track(
  event: EventName,
  extra: Record<string, string | number> = {},
) {
  if (
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl
  )
    return;
  const f = getFunnel();
  // Whitelisted broad categories only. Never email, rep counts, or equipment.
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      session: f.session,
      marketing_variant: f.variant,
      selected_goal: f.answers.goal,
      experience_level: f.answers.experience,
      selected_plan: f.plan,
      ...f.utm,
      ...extra,
    }),
    keepalive: true,
  }).catch(() => {});
}
