import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessMode } from "@/lib/usage";
import { evaluateSpeakingPro } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import type { StageId } from "@/data/curriculum";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Необходима авторизация." }, { status: 401 });
  }

  if (!canAccessMode(user.plan, "SPEAKING")) {
    return NextResponse.json(
      {
        error: "Speaking и проверка произношения доступны только на тарифе Pro.",
        code: "PRO_REQUIRED",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const stage = (String(body.stage ?? user.level) || "BEGINNER") as StageId;
    const promptText = String(body.promptText ?? "");
    const transcript = body.transcript ? String(body.transcript) : undefined;
    const audioBase64 = body.audioBase64 ? String(body.audioBase64) : undefined;
    const audioMimeType = body.audioMimeType ? String(body.audioMimeType) : undefined;

    if (!transcript && !audioBase64) {
      return NextResponse.json(
        { error: "Запишите голос или введите текст ответа." },
        { status: 400 }
      );
    }

    const result = await evaluateSpeakingPro({
      promptText,
      transcript,
      audioBase64,
      audioMimeType,
      stage,
    });

    await prisma.practiceAttempt.create({
      data: {
        userId: user.id,
        mode: "SPEAKING",
        stage,
        prompt: promptText,
        userResponse: result.transcript || transcript || "[audio]",
        aiFeedback: JSON.stringify(result),
        score: result.pronunciationScore,
      },
    });

    return NextResponse.json({ result });
  } catch (err: unknown) {
    console.error("AI speaking error:", err);
    const status = (err as { status?: number })?.status;
    if (status === 503 || status === 429) {
      return NextResponse.json(
        {
          error:
            "Модель Gemini временно перегружена. Пожалуйста, повторите отправку через пару секунд.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Ошибка анализа произношения." },
      { status: 500 }
    );
  }
}
