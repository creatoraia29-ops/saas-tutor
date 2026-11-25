import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { DashboardClient } from "@/components/DashboardClient";
import { getCurrentUser } from "@/lib/auth";
import { getUserUsageSummary } from "@/lib/usage";

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const usage = await getUserUsageSummary(user.id, user.plan);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <DashboardClient user={user} usage={usage} />
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-muted-foreground">
          Загрузка кабинета...
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
