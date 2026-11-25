import { prisma } from "@/lib/db";
import {
  FREE_DAILY_SECONDS_LIMIT,
  FREE_LESSONS_LIMIT,
  calculateRemainingSeconds,
  canAccessMode,
  getDateKey,
  getSecondsUntilMidnight,
  type PlanType,
  type PracticeMode,
} from "@/lib/usage-utils";

export {
  FREE_DAILY_SECONDS_LIMIT,
  FREE_LESSONS_LIMIT,
  calculateRemainingSeconds,
  canAccessMode,
  getDateKey,
  getSecondsUntilMidnight,
  type PlanType,
  type PracticeMode,
};

export async function getUserUsageSummary(userId: string, plan: string) {
  const now = new Date();
  const dateKey = getDateKey(now);

  const [usage, completedLessonsCount] = await Promise.all([
    prisma.dailyUsage.findUnique({
      where: { userId_dateKey: { userId, dateKey } },
    }),
    prisma.lessonProgress.count({
      where: { userId, completed: true },
    }),
  ]);

  const secondsUsed = usage?.secondsUsed ?? 0;
  const remainingSeconds = calculateRemainingSeconds(plan, secondsUsed);

  return {
    plan: plan as PlanType,
    dateKey,
    secondsUsed,
    dailyLimitSeconds: plan === "PRO" ? null : FREE_DAILY_SECONDS_LIMIT,
    remainingSeconds,
    isDailyLimitReached: plan !== "PRO" && (remainingSeconds ?? 0) <= 0,
    secondsUntilMidnight: getSecondsUntilMidnight(now),
    completedLessonsCount,
    freeLessonsLimit: plan === "PRO" ? null : FREE_LESSONS_LIMIT,
  };
}

export async function incrementDailyUsage(
  userId: string,
  plan: string,
  deltaSeconds: number
) {
  const clampedDelta = Math.max(0, Math.min(60, Math.floor(deltaSeconds)));
  const now = new Date();
  const dateKey = getDateKey(now);

  if (clampedDelta > 0) {
    await prisma.dailyUsage.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      update: { secondsUsed: { increment: clampedDelta } },
      create: { userId, dateKey, secondsUsed: clampedDelta },
    });
  }

  return getUserUsageSummary(userId, plan);
}
