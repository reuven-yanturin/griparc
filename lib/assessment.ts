export const questions = [
  {
    key: "experience",
    title: "What's your experience with calisthenics?",
    hint: "Every journey has a starting point. This is yours.",
    options: [
      ["new", "Brand new", "I’m ready to start from zero."],
      [
        "beginner",
        "A little experience",
        "I’ve tried a few bodyweight workouts.",
      ],
      [
        "consistent",
        "Training consistently",
        "I have the basics. I want a clear direction.",
      ],
    ],
  },
  {
    key: "goal",
    title: "What's your main fitness goal?",
    hint: "Choose the thing that would make you proud.",
    options: [
      [
        "start",
        "Build a strong foundation",
        "Feel stronger and learn the basics.",
      ],
      ["pullup", "Get my first pull-up", "Get my chin over that bar."],
      [
        "skills",
        "Unlock bodyweight skills",
        "Work toward skills like an L-sit.",
      ],
      [
        "consistency",
        "Build a consistent routine",
        "Make movement part of my week.",
      ],
    ],
  },
  {
    key: "pushups",
    title: "How many push-ups can you currently perform?",
    hint: "Your best estimate is enough. No need to test yourself.",
    options: [
      ["0", "Not yet", "Starting from the beginning is welcome."],
      ["1-5", "1–5 push-ups", ""],
      ["6-15", "6–15 push-ups", ""],
      ["16+", "16 or more", ""],
    ],
  },
  {
    key: "pullups",
    title: "How many pull-ups can you currently perform?",
    hint: "Zero is a perfectly good place to start.",
    options: [
      ["0", "Not yet", "That first rep can be a future milestone."],
      ["1-3", "1–3 pull-ups", ""],
      ["4+", "4 or more", ""],
    ],
  },
  {
    key: "equipment",
    title: "What equipment do you have access to?",
    hint: "Select everything you have. Bodyweight is a starting point.",
    multi: true,
    options: [
      ["none", "Just me and some floor space", "No equipment."],
      ["bar", "Pull-up bar", "At home, a gym, or an outdoor park."],
      ["bands", "Resistance bands", ""],
      ["rings", "Gymnastic rings or parallel bars", ""],
    ],
  },
  {
    key: "days",
    title: "How many days per week can you train?",
    hint: "Choose what fits your life, not your most ambitious week.",
    options: [
      ["2", "2 days", "Room to build a habit."],
      ["3", "3 days", "A little structure in my week."],
      ["4", "4 days", "I’m ready to make time."],
      ["5+", "5 or more days", "Movement is already part of my routine."],
    ],
  },
  {
    key: "duration",
    title: "How much time can you dedicate per workout?",
    hint: "Small steps count. Pick a realistic window.",
    options: [
      ["15", "15 minutes", "Short and focused."],
      ["30", "30 minutes", "A little more time for me."],
      ["45", "45 minutes", "Time to settle into a session."],
      ["60", "60 minutes", "I like to take my time."],
    ],
  },
] as const;
export type AnswerKey = (typeof questions)[number]["key"];
export type Answers = Partial<Record<AnswerKey, string | string[]>>;
export type Variant = "beginner" | "pullup";
export type Plan = "monthly" | "annual";
export function validAnswer(key: AnswerKey, value: unknown): boolean {
  const q = questions.find((q) => q.key === key)!;
  const allowed: string[] = q.options.map((o) => o[0]);
  if (key === "equipment")
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.length <= allowed.length &&
      new Set(value).size === value.length &&
      value.every((v) => typeof v === "string" && allowed.includes(v)) &&
      !(value.includes("none") && value.length > 1)
    );
  return typeof value === "string" && allowed.includes(value);
}
export function completeAssessment(value: unknown): value is Answers {
  return (
    !!value &&
    typeof value === "object" &&
    questions.every((q) => validAnswer(q.key, (value as Answers)[q.key]))
  );
}
export function startingLevel(a: Answers) {
  if (a.experience === "new" || a.pushups === "0")
    return {
      name: "Foundation Explorer",
      node: 0,
      description:
        "Start by discovering the basics of bodyweight movement. Every skill begins with a foundation.",
    };
  if (a.pullups === "0")
    return {
      name: "Strength Builder",
      node: 1,
      description:
        "You have some movement experience. Building foundational strength could be your next chapter.",
    };
  return {
    name: "Skill Explorer",
    node: 2,
    description:
      "You’ve explored the basics. A clearer path toward your next bodyweight skill could help you stay motivated.",
  };
}
export const goalLabels: Record<string, string> = {
  start: "Build a strong foundation",
  pullup: "Get my first pull-up",
  skills: "Unlock bodyweight skills",
  consistency: "Build a consistent routine",
};
