import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const level = String(body.level ?? "");
  const validLevels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
  if (!validLevels.includes(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { level },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      level: true,
    },
  });

  return NextResponse.json({ user: updated });
}
