"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Flame,
  Clock,
  LockKeyhole,
  CalendarDays,
} from "lucide-react";
import { Header, Footer, SectionLabel, SkillTree } from "./ui";
import { getFunnel, track, type Funnel } from "@/lib/funnel";
import {
  completeAssessment,
  startingLevel,
  goalLabels,
} from "@/lib/assessment";
export default function ResultsPreview() {
  const [f, setF] = useState<Funnel>();
  const router = useRouter();
  useEffect(() => {
    const value = getFunnel();
    if (
      !value.adult ||
      !value.completed ||
      !completeAssessment(value.answers)
    ) {
      router.replace("/assessment");
      return;
    }
    setF(value);
    track("results_viewed");
  }, [router]);
  if (!f)
    return (
      <>
        <Header simple />
        <main id="main" className="flow-main loading" role="status">
          Preparing your preview…
        </main>
      </>
    );
  const level = startingLevel(f.answers);
  return (
    <>
      <Header simple />
      <main id="main" className="container results-main">
        <Link className="back-button" href="/assessment">
          <ArrowLeft size={16} />
          Revisit my answers
        </Link>
        <div className="results-heading">
          <SectionLabel>YOUR JOURNEY, REIMAGINED</SectionLabel>
          <h1>
            Meet your
            <br />
            <span className="green">starting point.</span>
          </h1>
          <p>This could be the start of something strong.</p>
        </div>
        <div className="results-grid">
          <div>
            <section className="level-card">
              <div className="level-icon">
                <Sparkles size={28} />
              </div>
              <span className="mini-tag">YOUR SUGGESTED CHAPTER</span>
              <h2>{level.name}</h2>
              <p>{level.description}</p>
              <div className="goal-summary">
                <span>YOUR NORTH STAR</span>
                <strong>{goalLabels[String(f.answers.goal)]}</strong>
              </div>
              <details className="rules-details">
                <summary>How did we choose this chapter?</summary>
                <p>
                  New to calisthenics, or no push-ups yet? Foundation Explorer.
                  Some experience but no pull-ups? Strength Builder. Otherwise,
                  Skill Explorer. These simple self-report rules are for
                  exploring the concept, not a validated measure of your
                  ability.
                </p>
              </details>
            </section>
            <section className="workout-preview">
              <div className="preview-heading">
                <span className="mono">TODAY’S WORKOUT</span>
                <LockKeyhole size={16} />
              </div>
              <h3>
                A little structure.
                <br />A clear next step.
              </h3>
              <div className="workout-meta">
                <span>
                  <Clock size={14} />
                  Example session
                </span>
                <span>
                  <CalendarDays size={14} />
                  Future iOS app
                </span>
              </div>
              <div className="workout-stage">
                <span>01</span>Movement preparation<span>WARM UP</span>
              </div>
              <div className="workout-stage">
                <span>02</span>Foundation practice<span>EXPLORE</span>
              </div>
              <div className="workout-stage">
                <span>03</span>Reflection & progress<span>WRAP UP</span>
              </div>
              <p>
                Example layout only, not a workout to follow. The future iOS app
                will provide structured training. No exercises, sets, or reps
                are prescribed here.
              </p>
            </section>
          </div>
          <div>
            <SkillTree current={level.node} />
            <div className="reward-preview">
              <span className="reward-icon">
                <Trophy size={24} />
              </span>
              <div>
                <strong>Small wins. A bigger story.</strong>
                <p>Example: +100 XP · First Chapter badge</p>
              </div>
              <Flame className="green" size={23} />
            </div>
            <p className="concept-note">
              Illustrative UI. No XP, workouts, or skills are actually tracked
              or unlocked.
            </p>
          </div>
        </div>
        <div className="results-cta">
          <div>
            <SectionLabel>LIKE WHERE THIS IS GOING?</SectionLabel>
            <h2>Help shape the first chapter.</h2>
            <p>
              Explore planned pricing and join free early access. The iOS app is
              still in development.
            </p>
          </div>
          <Link href="/early-access" className="button primary">
            Explore Early Access
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="preview-notice">
          This preview is educational and illustrative. It is not a validated
          physical assessment, medical advice, or a personalized exercise
          prescription.
        </p>
      </main>
      <Footer />
    </>
  );
}
