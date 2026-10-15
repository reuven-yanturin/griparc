import { test } from "node:test";
import assert from "node:assert/strict";
import {
  completeAssessment,
  startingLevel,
  validAnswer,
} from "../lib/assessment";
const answers = {
  experience: "beginner",
  goal: "pullup",
  pushups: "6-15",
  pullups: "0",
  equipment: ["bar"],
  days: "3",
  duration: "30",
};
test("all seven answers are required and enum values enforced", () => {
  assert.equal(completeAssessment(answers), true);
  assert.equal(completeAssessment({ ...answers, duration: undefined }), false);
  assert.equal(completeAssessment({ ...answers, pushups: "1000" }), false);
  assert.equal(completeAssessment(null), false);
});
test("equipment rejects contradictions, duplicates, and unknown options", () => {
  assert.equal(validAnswer("equipment", ["none"]), true);
  assert.equal(validAnswer("equipment", ["bar", "rings"]), true);
  for (const value of [[], ["none", "bar"], ["bar", "bar"], ["gym"], "bar"])
    assert.equal(validAnswer("equipment", value), false);
});
test("starting chapters follow disclosed rules, not a fitness score", () => {
  assert.equal(
    startingLevel({ ...answers, experience: "new", pullups: "4+" }).node,
    0,
  );
  assert.equal(startingLevel({ ...answers, pushups: "0" }).node, 0);
  assert.equal(startingLevel(answers).node, 1);
  assert.equal(startingLevel({ ...answers, pullups: "1-3" }).node, 2);
});
