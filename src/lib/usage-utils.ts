export const FREE_DAILY_SECONDS_LIMIT = 10 * 60; // 600 seconds = 10 minutes
export const FREE_LESSONS_LIMIT = 5;

export type PlanType = "FREE" | "PRO";
export type PracticeMode =
  | "LESSONS"
  | "GRAMMAR"
  | "QUIZ"
  | "TASK"
  | "WRITING"
  | "LISTENING"
  | "SPEAKING";

export const PRO_ONLY_MODES: PracticeMode[] = [
  "WRITING",
  "LISTENING",
  "SPEAKING",
];

/**
 * Returns local calendar date key in YYYY-MM-DD format.
 * Automatically rolls over at midnight (00:00:00).
 */
export function getDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns number of seconds remaining until next midnight (00:00:00).
 */
export function getSecondsUntilMidnight(now: Date = new Date()): number {
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((nextMidnight.getTime() - now.getTime()) / 1000));
}

export function calculateRemainingSeconds(
  plan: string,
  secondsUsedToday: number
): number | null {
  if (plan === "PRO") return null; // Unlimited
  return Math.max(0, FREE_DAILY_SECONDS_LIMIT - secondsUsedToday);
}

export function canAccessMode(plan: string, mode: PracticeMode): boolean {
  if (plan === "PRO") return true;
  return !PRO_ONLY_MODES.includes(mode);
}
