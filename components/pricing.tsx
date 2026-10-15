"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { saveFunnel, track } from "@/lib/funnel";
import type { Plan } from "@/lib/assessment";
export function Pricing({
  onSelect,
  selected,
}: {
  onSelect?: (plan: Plan) => void;
  selected?: Plan;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          track("pricing_viewed");
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  function choose(plan: Plan) {
    saveFunnel({ plan });
    track("plan_selected", { selected_plan: plan });
    onSelect?.(plan);
  }
  return (
    <div ref={ref}>
      <div className="pricing-grid">
        {(
          [
            {
              id: "monthly",
              label: "Monthly",
              price: "9.99",
              period: "/ month",
              desc: "A little flexibility for your journey.",
            },
            {
              id: "annual",
              label: "Annual",
              price: "59.99",
              period: "/ year",
              desc: "About $5 a month, billed yearly.",
            },
          ] as const
        ).map((plan) => (
          <div
            className={`price-card ${plan.id === "annual" ? "featured" : ""} ${selected === plan.id ? "chosen" : ""}`}
            key={plan.id}
          >
            {plan.id === "annual" && (
              <span className="value-tag">BEST PLANNED VALUE · SAVE 50%</span>
            )}
            <span className="mono">{plan.label.toUpperCase()}</span>
            <p className="price">
              <span>$</span>
              {plan.price}
              <small>{plan.period}</small>
            </p>
            <p>{plan.desc}</p>
            <div className="price-line" />
            <ul>
              {[
                "Your personalized training path",
                "Skill trees & progress tracking",
                "Achievements & future challenges",
              ].map((x) => (
                <li key={x}>
                  <Check size={15} />
                  {x}
                </li>
              ))}
            </ul>
            {onSelect ? (
              <button
                type="button"
                className={`button ${selected === plan.id ? "primary" : "secondary"}`}
                aria-pressed={selected === plan.id}
                onClick={() => choose(plan.id)}
              >
                {selected === plan.id
                  ? "Plan preference selected"
                  : `I’m interested in ${plan.label.toLowerCase()}`}
                <Check size={17} />
              </button>
            ) : (
              <Link
                href="/early-access"
                onClick={() => choose(plan.id)}
                className={`button ${plan.id === "annual" ? "primary" : "secondary"}`}
              >
                Join free early access
                <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
        ))}
      </div>
      <p className="pricing-note">
        Planned pricing. Free to join. No payment details. No subscription
        starts today.
        <br />
        Choosing a plan shares your interest; it is not a purchase or a
        commitment.
      </p>
    </div>
  );
}
