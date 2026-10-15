"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Header, Footer } from "./ui";
import { questions, validAnswer, type Answers } from "@/lib/assessment";
import { saveFunnel, captureAttribution, track } from "@/lib/funnel";
export default function AssessmentFlow() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [adult, setAdult] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const f = captureAttribution();
    setAnswers(f.answers);
    setAdult(f.adult);
    setReady(true);
  }, []);
  const q = questions[step];
  const value = answers[q.key];
  function choose(option: string) {
    let next: string | string[] = option;
    if (q.key === "equipment") {
      const current = Array.isArray(value) ? value : [];
      next =
        option === "none"
          ? ["none"]
          : current.includes(option)
            ? current.filter((x) => x !== option)
            : [...current.filter((x) => x !== "none"), option];
    }
    const updated = { ...answers, [q.key]: next };
    setAnswers(updated);
    saveFunnel({ answers: updated, completed: false });
    setError("");
  }
  function proceed() {
    if (!validAnswer(q.key, value)) {
      setError("Choose an option to continue.");
      return;
    }
    track("assessment_step_completed", { step: step + 1 });
    if (step === questions.length - 1) {
      saveFunnel({ answers, completed: true });
      track("assessment_completed");
      router.push("/results");
    } else {
      setStep(step + 1);
      setError("");
      requestAnimationFrame(() => title.current?.focus());
    }
  }
  function start() {
    if (!accepted) {
      setError("Please confirm that you’re 18 or older to continue.");
      return;
    }
    saveFunnel({ adult: true });
    setAdult(true);
    setError("");
    track("assessment_started");
  }
  return (
    <>
      <Header simple />
      <main id="main" className="flow-main container">
        <div className="flow-kicker">
          <span className="small-logo">
            <Sparkles size={18} />
          </span>
          YOUR NEXT CHAPTER
        </div>
        {!ready ? (
          <div className="loading" role="status">
            Getting your starting point ready…
          </div>
        ) : !adult ? (
          <section className="assessment-panel intro-panel">
            <span className="mini-tag">A QUICK INTRODUCTION</span>
            <h1>
              A stronger you
              <br />
              starts somewhere.
            </h1>
            <p>
              Seven quick questions. A clearer starting point.
              <br />
              Let’s explore what your calisthenics journey could look like.
            </p>
            <div className="intro-points">
              <span>
                <Check size={17} />
                About 2 minutes
              </span>
              <span>
                <Check size={17} />
                No account needed
              </span>
              <span>
                <Check size={17} />
                No physical test
              </span>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  setError("");
                }}
              />
              <span>I confirm I am 18 or older.</span>
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" onClick={start}>
              Let’s find my starting point
              <ArrowRight size={18} />
            </button>
            <p className="flow-disclaimer">
              <ShieldCheck size={16} />
              This is a concept preview, not a validated fitness assessment or
              training prescription. The iOS app is in development.
            </p>
          </section>
        ) : (
          <section className="assessment-panel">
            <div className="assessment-progress-top">
              <span>YOUR STARTING POINT</span>
              <span>
                {String(step + 1).padStart(2, "0")}{" "}
                <span className="muted">/ 07</span>
              </span>
            </div>
            <div
              className="assessment-progress"
              role="progressbar"
              aria-label="Assessment progress"
              aria-valuenow={step + 1}
              aria-valuemin={0}
              aria-valuemax={7}
            >
              <span style={{ width: `${((step + 1) / 7) * 100}%` }} />
            </div>
            <div className="question-content" key={step}>
              <h1 ref={title} tabIndex={-1}>
                {q.title}
              </h1>
              <p className="question-hint" id="question-hint">
                {q.hint}
              </p>
              <div
                className="answer-options"
                role="group"
                aria-label={q.title}
                aria-describedby="question-hint"
              >
                {q.options.map((o) => {
                  const selected = Array.isArray(value)
                    ? value.includes(o[0])
                    : value === o[0];
                  return (
                    <button
                      key={o[0]}
                      type="button"
                      className={`answer-card ${selected ? "selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => choose(o[0])}
                    >
                      <span
                        className={`selection-mark ${q.key === "equipment" ? "square" : ""}`}
                      >
                        {selected && <Check size={14} />}
                      </span>
                      <span>
                        <strong>{o[1]}</strong>
                        {o[2] && <small>{o[2]}</small>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="assessment-actions">
              <button
                className="back-button"
                onClick={() => {
                  if (step === 0) setAdult(false);
                  else setStep(step - 1);
                  setError("");
                }}
              >
                <ArrowLeft size={17} />
                Back
              </button>
              <button className="button primary" onClick={proceed}>
                {step === 6 ? "See My Starting Point" : "Continue"}
                <ArrowRight size={18} />
              </button>
            </div>
            <p className="flow-disclaimer">
              Your answers stay in this tab until you choose to join early
              access.
            </p>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
