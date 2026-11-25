import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const level = String(body.level ?? "BEGINNER");

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Заполните имя, email и пароль." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Пароль должен содержать минимум 6 символов." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует." },
        { status: 409 }
      );
    }

    const validLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
    const safeLevel = validLevels.includes(level) ? level : "BEGINNER";

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        plan: "FREE",
        level: safeLevel,
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        level: true,
      },
    });

    const token = await createSessionToken({ userId: user.id, email: user.email });
    await setSessionCookie(token);

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Не удалось завершить регистрацию." },
      { status: 500 }
    );
  }
}
