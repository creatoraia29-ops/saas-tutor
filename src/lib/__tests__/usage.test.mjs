import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  FREE_DAILY_SECONDS_LIMIT,
  calculateRemainingSeconds,
  canAccessMode,
  getDateKey,
  getSecondsUntilMidnight,
} = require("../usage-utils.ts");

describe("Daily usage & tier gating", () => {
  it("rolls over dateKey at midnight", () => {
    const beforeMidnight = new Date(2026, 10, 25, 23, 59, 59);
    const afterMidnight = new Date(2026, 10, 26, 0, 0, 0);

    assert.equal(getDateKey(beforeMidnight), "2026-11-25");
    assert.equal(getDateKey(afterMidnight), "2026-11-26");
  });

  it("calculates seconds until midnight", () => {
    const at2350 = new Date(2026, 10, 25, 23, 50, 0);
    assert.equal(getSecondsUntilMidnight(at2350), 600);
  });

  it("enforces 10-minute (600s) daily limit on FREE and unlimited on PRO", () => {
    assert.equal(FREE_DAILY_SECONDS_LIMIT, 600);
    assert.equal(calculateRemainingSeconds("FREE", 120), 480);
    assert.equal(calculateRemainingSeconds("FREE", 700), 0);
    assert.equal(calculateRemainingSeconds("PRO", 9999), null);
  });

  it("gates Pro-only modes while allowing Free modes", () => {
    assert.equal(canAccessMode("FREE", "LESSONS"), true);
    assert.equal(canAccessMode("FREE", "GRAMMAR"), true);
    assert.equal(canAccessMode("FREE", "QUIZ"), true);
    assert.equal(canAccessMode("FREE", "TASK"), true);

    assert.equal(canAccessMode("FREE", "WRITING"), false);
    assert.equal(canAccessMode("FREE", "LISTENING"), false);
    assert.equal(canAccessMode("FREE", "SPEAKING"), false);

    assert.equal(canAccessMode("PRO", "WRITING"), true);
    assert.equal(canAccessMode("PRO", "LISTENING"), true);
    assert.equal(canAccessMode("PRO", "SPEAKING"), true);
  });
});
