"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Crown, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        setMessage(data.error || "Не удалось создать платёжную сессию Stripe.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setMessage("Ошибка соединения со Stripe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Выберите тариф</h1>
          <p className="mt-2 text-muted-foreground">
            Начните бесплатно с ежедневным обновлением в полночь или откройте полный Pro-доступ через Stripe
          </p>
        </div>

        {message && (
          <Alert className="mb-6">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-3xl">Free</CardTitle>
                <Badge variant="secondary">Бесплатно</Badge>
              </div>
              <CardDescription>
                Идеально для регулярных коротких тренировок
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm">
              {[
                "10 минут практики в день (сброс в 00:00)",
                "Базовые темы и 5 уроков бесплатно",
                "Квизы и практические задачи",
                "Проверка грамматики и правописания",
                "Доступ ко всем 4 этапам изучения",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Link
                href="/dashboard"
                className={buttonVariants({ variant: "outline", className: "w-full" })}
              >
                Перейти в кабинет
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
                <Badge>$19 / мес</Badge>
              </div>
              <CardDescription>
                Безлимитный AI-репетитор на базе gemini-3.5-flash-lite
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 text-sm">
              {[
                "Неограниченное время практики без таймера",
                "Speaking и проверка произношения с микрофона",
                "Listening: аудирование и проверка понимания",
                "Правильное оценивание Writing по критериям",
                "Детальный разбор ошибок и все уроки без лимита",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? "Переход к Stripe..." : "Оплатить через Stripe"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
