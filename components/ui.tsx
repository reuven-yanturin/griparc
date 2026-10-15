"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  MoveUpRight,
  LockKeyhole,
  Sprout,
  Dumbbell,
  Target,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { track } from "@/lib/funnel";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="GripArc home">
      <span className="brand-symbol">
        <MoveUpRight size={26} strokeWidth={3} />
      </span>
      GripArc<span className="brand-dot">.</span>
    </Link>
  );
}
export function Header({ simple = false }: { simple?: boolean }) {
  return (
    <header className="header">
      <div className="container nav">
        <Brand />
        {!simple && (
          <nav aria-label="Main navigation">
            <a href="/#how-it-works">How it works</a>
            <a href="/#progression">Your progression</a>
            <a href="/#pricing">Pricing</a>
          </nav>
        )}
        <Link className="nav-cta" href="/early-access">
          Get early access <ArrowUpRight size={16} />
        </Link>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="container footer">
      <Brand />
      <p>Built for the journey. Coming to iOS.</p>
      <div>
        <Link href="/privacy">Privacy</Link>
        <span>© {new Date().getFullYear()} GripArc</span>
      </div>
    </footer>
  );
}
export function JourneyButton({
  children = "Start My Journey",
  className = "",
  placement = "section",
}: {
  children?: React.ReactNode;
  className?: string;
  placement?: "hero" | "section";
}) {
  return (
    <Link
      href="/assessment"
      className={`button primary ${className}`}
      onClick={() => {
        if (placement === "hero") track("hero_cta_click");
      }}
    >
      {children}
      <ArrowUpRight size={19} />
    </Link>
  );
}
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="eyebrow">
      <span />
      {children}
    </div>
  );
}
export const skillNodes = [
  {
    name: "Foundation",
    subtitle: "Your first chapter",
    detail:
      "Explore bodyweight movement, form, and consistency. This is where your future progression begins.",
    icon: Sprout,
  },
  {
    name: "Strength development",
    subtitle: "Build your base",
    detail:
      "A preview of a future chapter focused on developing foundational bodyweight strength.",
    icon: Dumbbell,
  },
  {
    name: "Pull-up progression",
    subtitle: "Make that first rep happen",
    detail:
      "A future skill path toward a first pull-up, with smaller milestones along the way. No timeline or outcome is guaranteed.",
    icon: Target,
  },
  {
    name: "Advanced skills",
    subtitle: "A whole new horizon",
    detail:
      "Explore future paths such as L-sits and handstands. These are illustrative milestones, not a training prescription.",
    icon: Sparkles,
  },
];
export function SkillTree({
  current = 0,
  compact = false,
}: {
  current?: number;
  compact?: boolean;
}) {
  const [selected, setSelected] = useState(current);
  return (
    <div className={`skill-tree ${compact ? "compact" : ""}`}>
      <div className="tree-top">
        <span className="mono">YOUR SKILL PATH</span>
        <span className="mini-tag">ILLUSTRATIVE PREVIEW</span>
      </div>
      <div className="tree-path">
        {skillNodes.map((node, i) => {
          const Icon = node.icon;
          return (
            <div
              className={`tree-row node-${i} ${i === current ? "current" : ""} ${i === selected ? "selected" : ""}`}
              key={node.name}
            >
              <button
                aria-pressed={i === selected}
                aria-label={`${node.name}${i === current ? ", current starting chapter" : ", future chapter"}`}
                onClick={() => setSelected(i)}
                className="node-icon"
              >
                <Icon size={23} />
                {i !== current && (
                  <LockKeyhole className="node-lock" size={10} />
                )}
              </button>
              <button onClick={() => setSelected(i)} className="node-label">
                <strong>{node.name}</strong>
                <span>
                  {i === current ? "YOUR STARTING POINT" : node.subtitle}
                </span>
              </button>
              {i === current && <span className="you-tag">YOU ARE HERE</span>}
            </div>
          );
        })}
      </div>
      <div className="tree-detail" aria-live="polite">
        <span>
          <Sparkles size={15} />
          {skillNodes[selected].name}
        </span>
        <p>{skillNodes[selected].detail}</p>
      </div>
    </div>
  );
}
