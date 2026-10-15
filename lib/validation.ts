import { completeAssessment, goalLabels, questions } from "./assessment";
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
] as const;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validSession(v: unknown): v is string {
  return typeof v === "string" && uuid.test(v);
}
export function cleanAttribution(v: unknown) {
  const result: Record<string, string> = {};
  if (!v || typeof v !== "object") return result;
  for (const key of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "acquisition_source",
  ]) {
    const value = (v as Record<string, unknown>)[key];
    if (typeof value === "string")
      result[key] = value.replace(/[\u0000-\u001f]/g, "").slice(0, 120);
  }
  return result;
}
export function validateLead(v: unknown) {
  if (!v || typeof v !== "object")
    throw new Error("Please check your details.");
  const b = v as Record<string, unknown>;
  if (b.website) throw new Error("Unable to accept this submission.");
  if (typeof b.email !== "string")
    throw new Error("Enter a valid email address.");
  const email = b.email.trim().toLowerCase();
  if (email.length > 254 || !/^\S+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  if (typeof b.goal !== "string" || !Object.hasOwn(goalLabels, b.goal))
    throw new Error("Choose your fitness goal.");
  if (!["new", "beginner", "consistent"].includes(String(b.experience)))
    throw new Error("Choose your experience level.");
  if (!["beginner", "pullup"].includes(String(b.variant)))
    throw new Error("Invalid marketing variant.");
  if (
    b.plan !== null &&
    b.plan !== undefined &&
    !["monthly", "annual"].includes(String(b.plan))
  )
    throw new Error("Choose a valid plan preference.");
  if (b.adult !== true) throw new Error("You must be 18 or older to join.");
  if (b.consent !== true)
    throw new Error("Please consent to launch-related emails to join.");
  let assessment = null;
  if (b.assessment !== null && b.assessment !== undefined) {
    if (!completeAssessment(b.assessment))
      throw new Error(
        "Your assessment is incomplete. Revisit it or sign up without an assessment.",
      );
    const source = b.assessment;
    assessment = {
      ...Object.fromEntries(questions.map((q) => [q.key, source[q.key]])),
      goal: b.goal,
      experience: b.experience,
    };
  }
  return {
    email,
    selected_goal: b.goal,
    experience_level: b.experience,
    marketing_variant: b.variant,
    selected_plan: b.plan || null,
    assessment,
    attribution: cleanAttribution(b.utm),
    adult_confirmed: true,
    email_consent: true,
    consent_version: "2026-10-14",
  };
}
export function validateEvent(v: unknown) {
  if (!v || typeof v !== "object") return null;
  const b = v as Record<string, unknown>;
  if (
    !eventNames.includes(b.event as (typeof eventNames)[number]) ||
    !validSession(b.session) ||
    !["beginner", "pullup"].includes(String(b.marketing_variant))
  )
    return null;
  const properties: Record<string, string | number> = {
    ...cleanAttribution(b),
  };
  if (
    typeof b.selected_goal === "string" &&
    Object.hasOwn(goalLabels, b.selected_goal)
  )
    properties.selected_goal = b.selected_goal;
  if (["new", "beginner", "consistent"].includes(String(b.experience_level)))
    properties.experience_level = String(b.experience_level);
  if (["monthly", "annual"].includes(String(b.selected_plan)))
    properties.selected_plan = String(b.selected_plan);
  if (b.event === "assessment_step_completed") {
    if (
      typeof b.step !== "number" ||
      !Number.isInteger(b.step) ||
      b.step < 1 ||
      b.step > 7
    )
      return null;
    properties.step = b.step;
  }
  return {
    event_name: String(b.event),
    session_id: b.session,
    marketing_variant: String(b.marketing_variant),
    properties,
  };
}
