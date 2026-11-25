import { Suspense } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Crown,
  Headphones,
  Mic,
  PenTool,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGES } from "@/data/curriculum";
import { getCurrentUser } from "@/lib/auth";

async function HomeContent() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-border/60 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium">
              Powered by Gemini 3.5 Flash Lite
            </Badge>
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Персональный AI-репетитор английского языка
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              От первых фраз до свободного владения. Практикуйте грамматику, квизы,
              произношение, аудирование и письмо с мгновенным разбором ошибок.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={user ? "/practice" : "/register"}
                className={buttonVariants({ size: "lg" })}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {user ? "Перейти к практике" : "Начать бесплатно (10 мин/день)"}
              </Link>
              <Link
                href="/pricing"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Смотреть тарифы
              </Link>
            </div>
          </div>
        </section>

        {/* 4 Stages */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">
                4 этапа изучения языка
              </h2>
              <p className="mt-2 text-muted-foreground">
                Адаптивная программа подстраивается под ваш текущий уровень
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STAGES.map((stage, idx) => (
                <Card key={stage.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Этап {idx + 1}</Badge>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {stage.cefr}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-2xl">{stage.titleRu}</CardTitle>
                    <CardDescription>{stage.descriptionRu}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {stage.focusTopics.map((topic) => (
                        <li key={topic} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Free vs Pro */}
        <section className="border-t border-border/60 py-16">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Тарифы</h2>
              <p className="mt-2 text-muted-foreground">
                Бесплатный тариф обновляется каждый день ровно в полночь
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-3xl">Free</CardTitle>
                    <Badge variant="secondary">0 ₽ / мес</Badge>
                  </div>
                  <CardDescription>
                    Ежедневная базовая практика со сбросом лимита в 00:00
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>10 минут практики в день (сброс в полночь)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-primary" />
                    <span>Базовые темы и 5 уроков бесплатно</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Квизы и практические задачи</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Проверка грамматики и правописания</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href="/register"
                    className={buttonVariants({ variant: "outline", className: "w-full" })}
                  >
                    Начать бесплатно
                  </Link>
                </CardFooter>
              </Card>

              <Card className="flex flex-col border-2 border-primary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-3xl">
                      <Crown className="h-6 w-6 text-primary" />
                      Pro
                    </CardTitle>
                    <Badge>Stripe Подписка</Badge>
                  </div>
                  <CardDescription>
                    Полный набор инструментов AI-репетитора без ограничений по времени
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Неограниченное время использования</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-primary" />
                    <span>Speaking и проверка произношения</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-primary" />
                    <span>Listening (тренировка восприятия на слух)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-primary" />
                    <span>Правильное оценивание Writing и глубокий разбор ошибок</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href="/pricing"
                    className={buttonVariants({ className: "w-full" })}
                  >
                    Перейти на Pro
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <HomeContent />
    </Suspense>
  );
}
