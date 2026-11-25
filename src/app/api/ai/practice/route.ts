import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessMode, getUserUsageSummary, type PracticeMode } from "@/lib/usage";
import {
  evaluateGrammarAndSpelling,
  evaluateListeningAnswer,
  evaluateWritingPro,
  generateQuizOrTask,
} from "@/lib/gemini";
import { prisma } from "@/lib/db";
import type { StageId } from "@/data/curriculum";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация." }, { status: 401 });
  }

  const body = await req.json();
  const mode = String(body.mode ?? "") as PracticeMode;
  const stage = (String(body.stage ?? user.level) || "BEGINNER") as StageId;

  if (!canAccessMode(user.plan, mode)) {
    return NextResponse.json(
      {
        error: "Этот режим доступен только на тарифе Pro.",
        code: "PRO_REQUIRED",
      },
      { status: 403 }
    );
  }

  const usage = await getUserUsageSummary(user.id, user.plan);
  if (usage.isDailyLimitReached) {
    return NextResponse.json(
      {
        error:
          "Дневной лимит 10 минут исчерпан. Возвращайтесь после полуночи или перейдите на Pro.",
        code: "DAILY_LIMIT_REACHED",
        usage,
      },
      { status: 429 }
    );
  }

  try {
    if (mode === "GRAMMAR") {
      const text = String(body.text ?? "").trim();
      if (!text) {
        return NextResponse.json({ error: "Введите текст для проверки." }, { status: 400 });
      }
      const result = await evaluateGrammarAndSpelling(text, stage);
      await prisma.practiceAttempt.create({
        data: {
          userId: user.id,
          mode,
          stage,
          prompt: "Grammar & Spelling check",
          userResponse: text,
          aiFeedback: JSON.stringify(result),
          score: result.isCorrect ? 100 : 70,
        },
      });
      return NextResponse.json({ result });
    }

    if (mode === "QUIZ" || mode === "TASK") {
      const result = await generateQuizOrTask(stage, mode);
      return NextResponse.json({ result });
    }

    if (mode === "WRITING") {
      const promptText = String(body.promptText ?? "");
      const essay = String(body.essay ?? "").trim();
      if (!essay) {
        return NextResponse.json({ error: "Напишите текст эссе." }, { status: 400 });
      }
      const result = await evaluateWritingPro(promptText, essay, stage);
      await prisma.practiceAttempt.create({
        data: {
          userId: user.id,
          mode,
          stage,
          prompt: promptText,
          userResponse: essay,
          aiFeedback: JSON.stringify(result),
          score: result.overallScore,
        },
      });
      return NextResponse.json({ result });
    }

    if (mode === "LISTENING") {
      const script = String(body.script ?? "");
      const question = String(body.question ?? "");
      const userAnswer = String(body.userAnswer ?? "").trim();
      if (!userAnswer) {
        return NextResponse.json({ error: "Введите ответ на вопрос." }, { status: 400 });
      }
      const result = await evaluateListeningAnswer(script, question, userAnswer, stage);
      await prisma.practiceAttempt.create({
        data: {
          userId: user.id,
          mode,
          stage,
          prompt: question,
          userResponse: userAnswer,
          aiFeedback: JSON.stringify(result),
          score: result.score,
        },
      });
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: "Неизвестный режим." }, { status: 400 });
  } catch (err: unknown) {
    console.error("AI practice error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 503 || status === 429) {
      return NextResponse.json(
        {
          error:
            "Модель Gemini временно перегружена. Пожалуйста, нажмите кнопку ещё раз через пару секунд.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Ошибка при обращении к AI-репетитору." },
      { status: 500 }
    );
  }
}
