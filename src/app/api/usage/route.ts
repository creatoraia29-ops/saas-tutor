import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserUsageSummary, incrementDailyUsage } from "@/lib/usage";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await getUserUsageSummary(user.id, user.plan);
  return NextResponse.json(summary);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const deltaSeconds = Number(body.deltaSeconds ?? 0);

  const summary = await incrementDailyUsage(user.id, user.plan, deltaSeconds);
  return NextResponse.json(summary);
}
