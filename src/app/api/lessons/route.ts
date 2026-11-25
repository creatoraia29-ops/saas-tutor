import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LESSONS } from "@/data/curriculum";
import { FREE_LESSONS_LIMIT } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = await prisma.lessonProgress.findMany({
    where: { userId: user.id },
  });

  return NextResponse.json({
    lessons: LESSONS,
    progress,
    freeLessonsLimit: user.plan === "PRO" ? null : FREE_LESSONS_LIMIT,
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const lessonId = String(body.lessonId ?? "");
  const lesson = LESSONS.find((l) => l.id === lessonId);

  if (!lesson) {
    return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
  }

  if (user.plan !== "PRO") {
    if (!lesson.isFree) {
      return NextResponse.json(
        { error: "Этот урок доступен только на тарифе Pro.", code: "PRO_REQUIRED" },
        { status: 403 }
      );
    }

    const completedCount = await prisma.lessonProgress.count({
      where: { userId: user.id, completed: true },
    });

    const alreadyCompleted = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
    });

    if (!alreadyCompleted && completedCount >= FREE_LESSONS_LIMIT) {
      return NextResponse.json(
        {
          error: `Вы уже завершили ${FREE_LESSONS_LIMIT} бесплатных уроков.`,
          code: "FREE_LESSONS_LIMIT",
        },
        { status: 403 }
      );
    }
  }

  const record = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { completed: true, score: 100, completedAt: new Date() },
    create: {
      userId: user.id,
      lessonId,
      stage: lesson.stage,
      completed: true,
      score: 100,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({ record });
}
