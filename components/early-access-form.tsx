"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Header, Footer, SectionLabel } from "./ui";
import { Pricing } from "./pricing";
import {
  captureAttribution,
  saveFunnel,
  track,
  type Funnel,
} from "@/lib/funnel";
import { goalLabels, type Plan } from "@/lib/assessment";
export default function EarlyAccessForm() {
  const [f, setF] = useState<Funnel>();
  const [plan, setPlan] = useState<Plan>();
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [adult, setAdult] = useState(false);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  async function challenge() {
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const body = await res.json();
      if (res.ok) setToken(body.token);
    } catch {}
  }
  useEffect(() => {
    const value = captureAttribution();
    setF(value);
    setPlan(value.plan);
    setGoal(String(value.answers.goal || ""));
    setExperience(String(value.answers.experience || ""));
    setAdult(value.adult);
    track("early_access_started");
    void challenge();
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          goal,
          experience,
          session: f?.session,
          analytics:
            navigator.doNotTrack !== "1" &&
            !(navigator as Navigator & { globalPrivacyControl?: boolean })
              .globalPrivacyControl,
          plan: plan || null,
          adult,
          consent: form.get("consent") === "on",
          website: form.get("website"),
          token,
          variant: f?.variant || "beginner",
          utm: f?.utm || {},
          assessment: f?.completed ? f.answers : null,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "Something went wrong. Please try again.",
        );
      saveFunnel({ adult, plan, answers: { ...f?.answers, goal, experience } });
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Please try again in a moment.",
      );
      setStatus("error");
      void challenge();
    }
  }
  return (
    <>
      <Header simple />
      <main id="main" className="container early-main">
        <div className="center-heading">
          <SectionLabel>THE BEGINNING OF SOMETHING STRONG</SectionLabel>
          <h1>
            Your journey.
            <br />
            <span className="green">Our next chapter.</span>
          </h1>
          <p>
            GripArc is being built for iPhone. Join free early access
            <br />
            and help us understand what matters to you.
          </p>
        </div>
        <div className="early-grid">
          <div className="early-pricing" id="planned-pricing">
            <h2>What would work for you?</h2>
            <p className="muted">
              Optional: choose the plan you’d be interested in at launch.
            </p>
            <Pricing selected={plan} onSelect={setPlan} />
            {plan && (
              <button
                type="button"
                className="back-button clear-plan"
                onClick={() => {
                  setPlan(undefined);
                  saveFunnel({ plan: undefined });
                }}
              >
                Clear plan preference
              </button>
            )}
            <div className="planned-includes">
              <span className="mono">WHAT WE’RE PLANNING</span>
              <p>
                Personalized training programs, skill progression trees, workout
                tracking, progress analytics, achievements, and future friend
                challenges.
              </p>
            </div>
          </div>
          <div className="signup-card" id="signup">
            {status === "success" ? (
              <div className="success-state" role="status">
                <CheckCircle2 size={50} />
                <span className="mini-tag">YOU’RE ON THE LIST</span>
                <h2>
                  Your next chapter
                  <br />
                  is on the horizon.
                </h2>
                <p>
                  Your early-access interest has been registered. If this email
                  is already on our list, you’re all set.
                </p>
                <div className="free-note">
                  <Check size={17} />
                  No charge. No subscription. Just possibility.
                </div>
                <Link href="/" className="button secondary">
                  Back to GripArc
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            ) : (
              <>
                <span className="mini-tag">
                  FREE EARLY ACCESS · US ADULTS 18+
                </span>
                <h2>Be here for the beginning.</h2>
                <p>Leave your email. We’ll keep you posted on launch.</p>
                <form onSubmit={submit}>
                  <label className="field-label" htmlFor="email">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label className="field-label" htmlFor="goal">
                    Your main goal
                  </label>
                  <select
                    id="goal"
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option value="" disabled>
                      Select your goal
                    </option>
                    {Object.entries(goalLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <label className="field-label" htmlFor="experience">
                    Your experience level
                  </label>
                  <select
                    id="experience"
                    required
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  >
                    <option value="" disabled>
                      Select your experience
                    </option>
                    <option value="new">Brand new to calisthenics</option>
                    <option value="beginner">A little experience</option>
                    <option value="consistent">Training consistently</option>
                  </select>
                  <label className="field-label" htmlFor="plan">
                    Plan interest{" "}
                    <span className="muted">(optional · no purchase)</span>
                  </label>
                  <select
                    id="plan"
                    onFocus={() => track("pricing_viewed")}
                    value={plan || ""}
                    onChange={(e) => {
                      const selected = (e.target.value || undefined) as
                        Plan | undefined;
                      setPlan(selected);
                      saveFunnel({ plan: selected });
                      if (selected)
                        track("plan_selected", { selected_plan: selected });
                    }}
                  >
                    <option value="">No preference yet</option>
                    <option value="monthly">
                      Monthly — $9.99/month at launch
                    </option>
                    <option value="annual">
                      Annual — $59.99/year at launch
                    </option>
                  </select>
                  <a className="pricing-details-link" href="#planned-pricing">
                    See planned pricing details ↗
                  </a>
                  <div className="honeypot" aria-hidden="true">
                    <label htmlFor="website">Leave this field empty</label>
                    <input
                      id="website"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      required
                      checked={adult}
                      onChange={(e) => setAdult(e.target.checked)}
                    />
                    <span>I confirm I’m 18 or older.</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="consent" required />
                    <span>
                      I agree to receive launch-related emails from GripArc. I
                      can unsubscribe at any time.
                    </span>
                  </label>
                  <p className="form-privacy">
                    We’ll save your email, preferences, and assessment answers
                    if completed. See our{" "}
                    <Link href="/privacy">Privacy Notice</Link>.
                  </p>
                  {error && (
                    <p className="form-error" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    className="button primary"
                    disabled={status === "sending"}
                    type="submit"
                  >
                    {status === "sending" ? (
                      <>
                        <LoaderCircle className="spin" size={18} />
                        Joining…
                      </>
                    ) : (
                      <>
                        Join Early Access
                        <ArrowUpRight size={18} />
                      </>
                    )}
                  </button>
                  <p className="signup-footnote">
                    <ShieldCheck size={14} />
                    Free to join. No payment details required.
                  </p>
                </form>
                <div className="signup-development">
                  The iOS app is in development. Joining does not purchase or
                  activate a subscription. Plan selection measures interest
                  only.
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
