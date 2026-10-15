"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import athlete from "@/public/athlete.jpg";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Smartphone,
  Flame,
  Trophy,
  Users,
  Sparkles,
  MoveUpRight,
  Target,
  Dumbbell,
} from "lucide-react";
import { Header, Footer, JourneyButton, SectionLabel, SkillTree } from "./ui";
import { Pricing } from "./pricing";
import { captureAttribution, saveFunnel, track } from "@/lib/funnel";
import type { Variant } from "@/lib/assessment";
export default function Landing({
  variant: initialVariant,
}: {
  variant?: Variant;
}) {
  const [variant, setVariant] = useState<Variant>(initialVariant || "beginner");
  useEffect(() => {
    const f = captureAttribution();
    const active = initialVariant || f.variant;
    setVariant(active);
    saveFunnel({ variant: active });
    track("landing_view");
  }, [initialVariant]);
  return (
    <>
      <Header />
      <main id="main">
        <section className="hero container">
          <div className="hero-copy">
            <div className="launch-pill">
              <span />A NEW WAY TO TRAIN · COMING TO iOS
            </div>
            <h1>
              Your Calisthenics
              <br />
              Journey
              <br />
              Starts{" "}
              <span className="accent-word">
                Here
                <svg viewBox="0 0 240 16" aria-hidden="true">
                  <path d="M2 12Q100 -3 237 5" />
                </svg>
              </span>
              .
            </h1>
            <p className="hero-position">
              {variant === "pullup"
                ? "Unlock your first pull-up."
                : "Start calisthenics from zero."}
            </p>
            <p className="hero-description">
              Discover your starting level, follow your progression, and unlock
              real bodyweight skills.
            </p>
            <JourneyButton placement="hero" />
            <div className="hero-reassurance">
              <span>
                <Check size={14} />
                Free 2-minute assessment
              </span>
              <span>
                <Check size={14} />
                No experience needed
              </span>
            </div>
            <div className="development-note">
              <Smartphone size={15} />
              <span>
                The iOS app is in development. Your journey starts with a
                preview.
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              <Image
                src={athlete}
                alt="Athlete performing a push-up in a gym"
                fill
                preload
                sizes="(max-width: 600px) 100vw, 50vw"
                placeholder="blur"
              />
            </div>
            <div className="visual-grid" />
            <span className="visual-coordinate mono">THE ONLY WAY IS UP ↗</span>
            <div className="skill-unlocked">
              <span className="trophy-icon">
                <Trophy size={20} />
              </span>
              <div>
                <span className="mono">YOUR NEXT CHAPTER</span>
                <strong>
                  {variant === "pullup"
                    ? "Your first pull-up"
                    : "Stronger than yesterday"}
                </strong>
              </div>
              <Sparkles size={17} />
            </div>
            <div className="hero-quest">
              <div className="quest-heading">
                <span className="quest-icon">
                  <Target size={20} />
                </span>
                <span>SMALL STEPS. REAL STRENGTH.</span>
                <span className="quest-dots">•••</span>
              </div>
              <h3>Every rep has a purpose.</h3>
              <div className="quest-progress">
                <span />
              </div>
              <div className="quest-bottom">
                <span>
                  Foundation <ArrowRight size={12} /> Your first pull-up
                </span>
                <span>PREVIEW</span>
              </div>
            </div>
            <div className="photo-caption">
              <span>YOUR BODY. YOUR POTENTIAL.</span>
              <MoveUpRight size={22} />
            </div>
          </div>
        </section>
        <div className="principles">
          <div className="container principles-inner">
            <span>
              <Target size={19} />A starting point that’s yours
            </span>
            <i />
            <span>
              <Dumbbell size={19} />
              Skills over scales
            </span>
            <i />
            <span>
              <Flame size={19} />
              Progress you can feel
            </span>
            <i />
            <span>
              <Smartphone size={19} />
              Designed for iPhone
            </span>
          </div>
        </div>
        <section className="section container" id="how-it-works">
          <div className="section-heading">
            <div>
              <SectionLabel>YOUR FIRST CHAPTER</SectionLabel>
              <h2>
                Big goals.
                <br />
                <span className="muted">Small, intentional steps.</span>
              </h2>
            </div>
            <p>
              You don’t need to know where to start.
              <br />
              That’s what we’re building GripArc for.
            </p>
          </div>
          <div className="steps-grid">
            {[
              {
                n: "01",
                icon: Target,
                title: "Find your starting point",
                text: "A quick assessment helps you explore where you are and what you want to work toward.",
              },
              {
                n: "02",
                icon: Dumbbell,
                title: "See your path forward",
                text: "Preview a progression built around skills, with clear milestones to make the next step feel possible.",
              },
              {
                n: "03",
                icon: Trophy,
                title: "Build your next chapter",
                text: "Join early access for a future iOS experience designed to make showing up feel rewarding.",
              },
            ].map((s) => (
              <article className="how-card" key={s.n}>
                <div className="how-top">
                  <s.icon size={25} />
                  <span>{s.n}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section progression-section" id="progression">
          <div className="container progression-grid">
            <div className="progression-copy">
              <SectionLabel>NOT JUST REPS. REAL MILESTONES.</SectionLabel>
              <h2>
                Don’t just work out.
                <br />
                <span className="green">Level up.</span>
              </h2>
              <p>
                From your first push-up to your first pull-up, every skill has a
                beginning. See how small wins could connect to something bigger.
              </p>
              <ul className="feature-list">
                <li>
                  <Check />A path that starts at your level
                </li>
                <li>
                  <Check />
                  Skills broken into visible milestones
                </li>
                <li>
                  <Check />
                  Your progress, made tangible
                </li>
              </ul>
              <JourneyButton>Discover My Starting Point</JourneyButton>
              <small>
                Illustrative concept. Your preview is not a training program.
              </small>
            </div>
            <SkillTree />
          </div>
        </section>
        <section className="section container motivation">
          <div className="section-heading">
            <div>
              <SectionLabel>BUILT TO KEEP YOU GOING</SectionLabel>
              <h2>
                A little more motivation.
                <br />
                <span className="muted">A lot more you.</span>
              </h2>
            </div>
            <p>
              We’re building tools that celebrate the effort.
              <br />
              Because showing up is a skill, too.
            </p>
          </div>
          <div className="motivation-grid">
            <article className="motivation-card">
              <div className="achievement-art">
                <div className="achievement-rings">
                  <Trophy size={40} />
                </div>
                <span className="xp-badge">+100 XP</span>
                <div className="achievement-caption">
                  FIRST CHAPTER COMPLETE
                </div>
              </div>
              <div className="card-copy">
                <span className="mini-tag">PLANNED FEATURE</span>
                <h3>Make small wins feel big.</h3>
                <p>
                  Earn XP, celebrate consistency, and collect achievements as
                  your skills develop.
                </p>
              </div>
            </article>
            <article className="motivation-card friends-card">
              <div className="friends-art">
                <div className="friend-avatar">
                  <Users size={31} />
                </div>
                <div className="challenge-line">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="friend-flame">
                  <Flame size={28} />
                </span>
                <div className="challenge-label">
                  A LITTLE FRIENDLY COMPETITION.
                </div>
              </div>
              <div className="card-copy">
                <span className="mini-tag">FUTURE CONCEPT</span>
                <h3>Better with a little backup.</h3>
                <p>
                  Future friend challenges could bring shared goals and extra
                  encouragement to your journey.
                </p>
              </div>
            </article>
          </div>
          <p className="concept-note">
            Concept UI shown. XP, achievements, and challenges are illustrative,
            not tracked activity.
          </p>
        </section>
        <section className="section pricing-section" id="pricing">
          <div className="container pricing-container">
            <div className="center-heading">
              <SectionLabel>ONE JOURNEY. YOUR PACE.</SectionLabel>
              <h2>
                Invest in your potential.
                <br />
                <span className="muted">When you’re ready.</span>
              </h2>
              <p>
                A preview of our planned subscription. Help us build something
                worth showing up for.
              </p>
            </div>
            <Pricing />
            <div className="included-note">
              <Sparkles size={16} />
              Planned: personalized programs, skill trees, workout tracking,
              progress analytics, achievements, and future friend challenges.
            </div>
          </div>
        </section>
        <section className="section container">
          <div className="early-banner">
            <div>
              <SectionLabel>BE HERE FOR THE BEGINNING</SectionLabel>
              <h2>
                Your next chapter
                <br />
                starts with you.
              </h2>
              <p>
                Get your starting point. Preview your path.
                <br />
                Be first to hear when GripArc is ready.
              </p>
              <JourneyButton />
              <small>
                Free to join. iOS app in development. No payment required.
              </small>
            </div>
            <div className="banner-mark" aria-hidden="true">
              <MoveUpRight strokeWidth={1.5} />
            </div>
          </div>
        </section>
        <section className="section container faq-section">
          <div>
            <SectionLabel>A FEW THINGS TO KNOW</SectionLabel>
            <h2>
              Good questions.
              <br />
              <span className="muted">Straight answers.</span>
            </h2>
            <p>Still exploring? You’re in the right place.</p>
          </div>
          <div className="faq-list">
            {[
              {
                q: "Is GripArc available to download?",
                a: "Not yet. GripArc is an iOS app in development. This website lets you explore the concept, complete a short assessment, and join the free early-access list. We don’t have a launch date to announce yet.",
              },
              {
                q: "Can I start with no experience?",
                a: "Absolutely. We’re designing GripArc for adults who are new to calisthenics, including people who can’t do a pull-up yet. The preview helps you explore a possible starting chapter, not a validated fitness score.",
              },
              {
                q: "Do I need a gym or equipment?",
                a: "You can explore the assessment with no equipment. Some future skill paths, such as pull-ups, will need appropriate equipment. The app’s training content is still being developed.",
              },
              {
                q: "Will joining early access charge me?",
                a: "No. Joining is free. We don’t collect payment details or start a subscription. The $9.99/month and $59.99/year plans are proposed pricing; choosing one only tells us what interests you.",
              },
              {
                q: "Is the assessment a personalized training plan?",
                a: "No. It uses a few simple answers to show an illustrative starting chapter and skill map. It is not a validated physical assessment, medical advice, or an exercise prescription.",
              },
              {
                q: "What happens after I join?",
                a: "We’ll save your preferences and send launch-related emails if you consent. You can ask to be removed at any time through the link in those emails. Early access does not guarantee a release date or availability.",
              },
            ].map((f) => (
              <details key={f.q}>
                <summary>
                  {f.q}
                  <ChevronDown size={18} />
                </summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
