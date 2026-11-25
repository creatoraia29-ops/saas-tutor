"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Crown,
  Headphones,
  Lock,
  Mic,
  PenTool,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STAGES, type StageId } from "@/data/curriculum";

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    plan: string;
    level: string;
    stripeCustomerId: string | null;
  };
  usage: {
    secondsUsed: number;
    dailyLimitSeconds: number | null;
    remainingSeconds: number | null;
    secondsUntilMidnight: number;
    completedLessonsCount: number;
    freeLessonsLimit: number | null;
  };
}

function formatDuration(totalSec: number) {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatMidnightCountdown(totalSec: number) {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  return `${hrs} ч ${mins} мин`;
}

export function DashboardClient({ user, usage }: DashboardClientProps) {
  const [level, setLevel] = useState<StageId>(user.level as StageId);
  const [savingLevel, setSavingLevel] = useState(false);

  const isPro = user.plan === "PRO";
  const dailyPercent =
    usage.dailyLimitSeconds && usage.dailyLimitSeconds > 0
      ? Math.min(100, Math.round((usage.secondsUsed / usage.dailyLimitSeconds) * 100))
      : 0;

  async function handleLevelChange(nextLevel: StageId | null) {
    if (!nextLevel) return;
    setLevel(nextLevel);
    setSavingLevel(true);
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: nextLevel }),
      });
    } finally {
      setSavingLevel(false);
    }
  }

  async function openBillingPortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  const practiceCards = [
    {
      title: "Уроки по темам",
      desc: isPro ? "Все уроки без ограничений" : "5 базовых уроков бесплатно",
      href: "/practice?tab=LESSONS",
      icon: BookOpen,
      proOnly: false,
    },
    {
      title: "Грамматика и правописание",
      desc: "Мгновенная проверка текста и объяснение правил",
      href: "/practice?tab=GRAMMAR",
      icon: CheckCircle2,
      proOnly: false,
    },
    {
      title: "Квизы и задачи",
      desc: "Интерактивные тесты под ваш уровень",
      href: "/practice?tab=QUIZ",
      icon: HelpCircle,
      proOnly: false,
    },
    {
      title: "Writing и разбор ошибок",
      desc: "Точное оценивание эссе по критериям CEFR/IELTS",
      href: "/practice?tab=WRITING",
      icon: PenTool,
      proOnly: true,
    },
    {
      title: "Listening",
      desc: "Аудирование и проверка понимания речи на слух",
      href: "/practice?tab=LISTENING",
      icon: Headphones,
      proOnly: true,
    },
    {
      title: "Speaking и произношение",
      desc: "Запись голоса и AI-анализ произношения",
      href: "/practice?tab=SPEAKING",
      icon: Mic,
      proOnly: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-4xl font-bold">Добро пожаловать, {user.name}</h1>
          <p className="text-muted-foreground">
            Управляйте уровнем обучения и отслеживайте дневной прогресс
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isPro && user.stripeCustomerId ? (
            <Button variant="outline" onClick={openBillingPortal}>
              Управление подпиской
            </Button>
          ) : !isPro ? (
            <Link href="/pricing" className={buttonVariants()}>
              <Crown className="mr-2 h-4 w-4" />
              Перейти на Pro
            </Link>
          ) : null}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Дневной лимит практики
            </CardDescription>
            <CardTitle className="text-3xl">
              {isPro
                ? "Безлимит"
                : `${formatDuration(usage.remainingSeconds ?? 0)} осталось`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!isPro ? (
              <>
                <Progress value={dailyPercent} />
                <p className="text-xs text-muted-foreground">
                  Использовано {formatDuration(usage.secondsUsed)} из 10:00. Сброс в
                  полночь (через {formatMidnightCountdown(usage.secondsUntilMidnight)}).
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                На тарифе Pro нет ограничений по времени в день.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Пройдено уроков
            </CardDescription>
            <CardTitle className="text-3xl">
              {isPro
                ? `${usage.completedLessonsCount}`
                : `${usage.completedLessonsCount} / ${usage.freeLessonsLimit}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isPro
                ? "Доступ ко всем урокам открыт"
                : "На тарифе Free доступно 5 бесплатных уроков"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Этап изучения языка
            </CardDescription>
            <CardTitle className="text-2xl">
              {STAGES.find((s) => s.id === level)?.titleRu}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={level} onValueChange={handleLevelChange} disabled={savingLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.titleRu} ({s.cefr})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Practice Grid */}
      <div>
        <h2 className="mb-4 text-3xl font-bold">Режимы практики</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {practiceCards.map((item) => {
            const locked = item.proOnly && !isPro;
            const Icon = item.icon;
            return (
              <Card key={item.title} className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    {item.proOnly && (
                      <Badge variant={locked ? "secondary" : "default"}>
                        {locked ? (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Pro
                          </span>
                        ) : (
                          "Pro"
                        )}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-3 text-2xl">{item.title}</CardTitle>
                  <CardDescription>{item.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={locked ? "/pricing" : item.href}
                    className={buttonVariants({
                      variant: locked ? "outline" : "default",
                      className: "w-full",
                    })}
                  >
                    {locked ? "Открыть в Pro" : "Начать практику"}
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
