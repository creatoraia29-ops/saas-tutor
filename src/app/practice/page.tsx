import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { PracticeWorkspace } from "@/components/PracticeWorkspace";
import { getCurrentUser } from "@/lib/auth";
import { getUserUsageSummary } from "@/lib/usage";
import { prisma } from "@/lib/db";

async function PracticeContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const [usage, completedLessons] = await Promise.all([
    getUserUsageSummary(user.id, user.plan),
    prisma.lessonProgress.findMany({
      where: { userId: user.id, completed: true },
      select: { lessonId: true },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <PracticeWorkspace
          user={user}
          initialUsage={usage}
          completedLessonIds={completedLessons.map((l) => l.lessonId)}
          initialTab={params.tab || "LESSONS"}
        />
      </main>
    </div>
  );
}

export default function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Загрузка студии практики...
        </div>
      }
    >
      <PracticeContent searchParams={searchParams} />
    </Suspense>
  );
}
