"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Crown,
  Headphones,
  Lock,
  Mic,
  Square,
  Volume2,
  Loader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LESSONS,
  LISTENING_SCRIPTS,
  SPEAKING_PROMPTS,
  STAGES,
  WRITING_PROMPTS,
  type StageId,
} from "@/data/curriculum";
import type {
  GrammarResult,
  QuizQuestion,
  SpeakingEvaluation,
  WritingEvaluation,
} from "@/lib/gemini";

interface PracticeWorkspaceProps {
  user: {
    id: string;
    name: string;
    plan: string;
    level: string;
  };
  initialUsage: {
    remainingSeconds: number | null;
    isDailyLimitReached: boolean;
    secondsUntilMidnight: number;
  };
  completedLessonIds: string[];
  initialTab?: string;
}

function formatTimer(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PracticeWorkspace({
  user,
  initialUsage,
  completedLessonIds,
  initialTab = "LESSONS",
}: PracticeWorkspaceProps) {
  const isPro = user.plan === "PRO";
  const [stage, setStage] = useState<StageId>(user.level as StageId);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    initialUsage.remainingSeconds
  );
  const [limitReached, setLimitReached] = useState(initialUsage.isDailyLimitReached);
  const [completedIds, setCompletedIds] = useState<string[]>(completedLessonIds);

  // Grammar state
  const [grammarText, setGrammarText] = useState("");
  const [grammarResult, setGrammarResult] = useState<GrammarResult | null>(null);
  const [grammarLoading, setGrammarLoading] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Writing (Pro)
  const [essay, setEssay] = useState("");
  const [writingResult, setWritingResult] = useState<WritingEvaluation | null>(null);
  const [writingLoading, setWritingLoading] = useState(false);

  // Listening (Pro)
  const [listeningAnswer, setListeningAnswer] = useState("");
  const [listeningResult, setListeningResult] = useState<{
    isCorrect: boolean;
    score: number;
    feedbackRu: string;
  } | null>(null);
  const [listeningLoading, setListeningLoading] = useState(false);

  // Speaking (Pro)
  const [speakingTranscript, setSpeakingTranscript] = useState("");
  const [speakingResult, setSpeakingResult] = useState<SpeakingEvaluation | null>(null);
  const [speakingLoading, setSpeakingLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Heartbeat timer for Free users (ticks every 1s locally, syncs every 15s)
  useEffect(() => {
    if (isPro || limitReached) return;

    const tick = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          setLimitReached(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const sync = setInterval(async () => {
      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deltaSeconds: 15 }),
      });
      if (res.ok) {
        const data = await res.json();
        setRemainingSeconds(data.remainingSeconds);
        setLimitReached(data.isDailyLimitReached);
      }
    }, 15000);

    return () => {
      clearInterval(tick);
      clearInterval(sync);
    };
  }, [isPro, limitReached]);

  async function completeLesson(lessonId: string) {
    setErrorMsg(null);
    const res = await fetch("/api/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Не удалось завершить урок.");
      return;
    }
    setCompletedIds((prev) => (prev.includes(lessonId) ? prev : [...prev, lessonId]));
  }

  async function checkGrammar() {
    setErrorMsg(null);
    setGrammarLoading(true);
    try {
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "GRAMMAR", stage, text: grammarText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      setGrammarResult(data.result);
    } finally {
      setGrammarLoading(false);
    }
  }

  async function loadQuiz(mode: "QUIZ" | "TASK" = "QUIZ") {
    setErrorMsg(null);
    setSelectedOption(null);
    setQuizLoading(true);
    try {
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, stage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      setQuiz(data.result);
    } finally {
      setQuizLoading(false);
    }
  }

  async function submitWriting() {
    setErrorMsg(null);
    setWritingLoading(true);
    try {
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "WRITING",
          stage,
          promptText: WRITING_PROMPTS[stage],
          essay,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      setWritingResult(data.result);
    } finally {
      setWritingLoading(false);
    }
  }

  function playListeningScript() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(LISTENING_SCRIPTS[stage].script);
    utterance.lang = "en-US";
    utterance.rate = stage === "BEGINNER" ? 0.85 : 1.0;
    window.speechSynthesis.speak(utterance);
  }

  async function submitListening() {
    setErrorMsg(null);
    setListeningLoading(true);
    try {
      const item = LISTENING_SCRIPTS[stage];
      const res = await fetch("/api/ai/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "LISTENING",
          stage,
          script: item.script,
          question: item.question,
          userAnswer: listeningAnswer,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      setListeningResult(data.result);
    } finally {
      setListeningLoading(false);
    }
  }

  async function startRecording() {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = String(reader.result).split(",")[1];
          await submitSpeaking({ audioBase64: base64, audioMimeType: "audio/webm" });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setErrorMsg("Не удалось получить доступ к микрофону. Вы можете ввести текст ниже.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function submitSpeaking(payload?: {
    audioBase64?: string;
    audioMimeType?: string;
  }) {
    setErrorMsg(null);
    setSpeakingLoading(true);
    try {
      const res = await fetch("/api/ai/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage,
          promptText: SPEAKING_PROMPTS[stage],
          transcript: speakingTranscript || undefined,
          ...payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error);
        return;
      }
      setSpeakingResult(data.result);
    } finally {
      setSpeakingLoading(false);
    }
  }

  const stageLessons = LESSONS.filter((l) => l.stage === stage);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      {/* Header Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">Студия практики</h1>
          <Select value={stage} onValueChange={(v) => setStage(v as StageId)}>
            <SelectTrigger className="w-56">
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
        </div>

        <div className="flex items-center gap-3">
          {isPro ? (
            <Badge className="px-3 py-1">
              <Crown className="mr-1.5 h-3.5 w-3.5" />
              Pro — Безлимит
            </Badge>
          ) : (
            <Badge
              variant={limitReached ? "destructive" : "secondary"}
              className="px-3 py-1 text-sm"
            >
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              {limitReached
                ? "Лимит на сегодня исчерпан"
                : `Осталось: ${formatTimer(remainingSeconds ?? 0)}`}
            </Badge>
          )}
        </div>
      </div>

      {limitReached && !isPro && (
        <Alert variant="destructive">
          <AlertTitle>Дневные 10 минут закончились</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Бесплатный лимит автоматически обновится в полночь (00:00). Либо
              перейдите на Pro для безлимитной практики.
            </span>
            <Link href="/pricing" className={buttonVariants({ size: "sm" })}>
              Перейти на Pro
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="LESSONS">Уроки</TabsTrigger>
          <TabsTrigger value="GRAMMAR">Грамматика</TabsTrigger>
          <TabsTrigger value="QUIZ">Квизы и задачи</TabsTrigger>
          <TabsTrigger value="WRITING" className="gap-1">
            {!isPro && <Lock className="h-3 w-3" />} Writing (Pro)
          </TabsTrigger>
          <TabsTrigger value="LISTENING" className="gap-1">
            {!isPro && <Lock className="h-3 w-3" />} Listening (Pro)
          </TabsTrigger>
          <TabsTrigger value="SPEAKING" className="gap-1">
            {!isPro && <Lock className="h-3 w-3" />} Speaking (Pro)
          </TabsTrigger>
        </TabsList>

        {/* LESSONS */}
        <TabsContent value="LESSONS" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {stageLessons.map((lesson) => {
              const done = completedIds.includes(lesson.id);
              const locked = !lesson.isFree && !isPro;
              return (
                <Card key={lesson.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant={lesson.isFree ? "secondary" : "default"}>
                        {lesson.isFree ? "Бесплатный урок" : "Pro урок"}
                      </Badge>
                      {done && (
                        <span className="flex items-center gap-1 text-xs font-medium text-primary">
                          <CheckCircle2 className="h-4 w-4" /> Пройдено
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{lesson.titleRu}</CardTitle>
                    <CardDescription>{lesson.summaryRu}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <p className="rounded-md bg-muted/60 p-3">{lesson.grammarRule}</p>
                    <div className="space-y-1">
                      {lesson.examples.map((ex) => (
                        <p key={ex.en}>
                          <strong className="font-medium">{ex.en}</strong> —{" "}
                          <span className="text-muted-foreground">{ex.ru}</span>
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Задание: {lesson.exercisePrompt}
                    </p>
                    {locked ? (
                      <Link
                        href="/pricing"
                        className={buttonVariants({
                          variant: "outline",
                          className: "w-full",
                        })}
                      >
                        Доступно в Pro
                      </Link>
                    ) : (
                      <Button
                        className="w-full"
                        variant={done ? "secondary" : "default"}
                        disabled={done || limitReached}
                        onClick={() => completeLesson(lesson.id)}
                      >
                        {done ? "Урок завершён" : "Отметить пройденным"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* GRAMMAR */}
        <TabsContent value="GRAMMAR" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Проверка грамматики и правописания
              </CardTitle>
              <CardDescription>
                Напишите предложение или абзац на английском — AI (gemini-3.5-flash-lite)
                проверит ошибки и объяснит правила
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={4}
                placeholder="Например: Yesterday I go to the store and buyed some apples..."
                value={grammarText}
                onChange={(e) => setGrammarText(e.target.value)}
                disabled={limitReached}
              />
              <Button
                onClick={checkGrammar}
                disabled={grammarLoading || !grammarText.trim() || limitReached}
              >
                {grammarLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Проверить текст
              </Button>

              {grammarResult && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">
                    Исправленный вариант:{" "}
                    <span className="text-primary">{grammarResult.correctedText}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {grammarResult.overallFeedbackRu}
                  </p>
                  {grammarResult.errors.map((err, i) => (
                    <div key={i} className="rounded bg-muted/50 p-2 text-sm">
                      <span className="line-through text-destructive">{err.original}</span>{" "}
                      → <span className="font-semibold text-primary">{err.correction}</span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {err.explanationRu}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QUIZ */}
        <TabsContent value="QUIZ" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Квизы и практические задачи</CardTitle>
              <CardDescription>
                Генерация вопросов под уровень{" "}
                {STAGES.find((s) => s.id === stage)?.titleRu}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => loadQuiz("QUIZ")}
                  disabled={quizLoading || limitReached}
                >
                  {quizLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Новый квиз
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadQuiz("TASK")}
                  disabled={quizLoading || limitReached}
                >
                  Новая задача
                </Button>
              </div>

              {quiz && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <p className="font-medium">{quiz.question}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {quiz.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === quiz.correctIndex;
                      let variant: "outline" | "default" | "destructive" = "outline";
                      if (selectedOption !== null) {
                        if (isCorrect) variant = "default";
                        else if (isSelected) variant = "destructive";
                      }
                      return (
                        <Button
                          key={idx}
                          variant={variant}
                          className="justify-start text-left h-auto py-2.5"
                          onClick={() => setSelectedOption(idx)}
                        >
                          {opt}
                        </Button>
                      );
                    })}
                  </div>
                  {selectedOption !== null && (
                    <p className="text-sm text-muted-foreground">
                      {quiz.explanationRu}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* WRITING (PRO) */}
        <TabsContent value="WRITING" className="mt-6">
          {!isPro ? (
            <ProLockCard title="Оценивание Writing и разбор ошибок" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Writing Evaluation (Pro)</CardTitle>
                <CardDescription>{WRITING_PROMPTS[stage]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  rows={6}
                  placeholder="Напишите ваш ответ на английском..."
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                />
                <Button
                  onClick={submitWriting}
                  disabled={writingLoading || !essay.trim()}
                >
                  {writingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Оценить Writing
                </Button>

                {writingResult && (
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="text-base">
                        Балл: {writingResult.overallScore}/100
                      </Badge>
                      <Badge variant="secondary">
                        Уровень: {writingResult.cefrEstimate}
                      </Badge>
                    </div>
                    <p className="text-sm">{writingResult.summaryRu}</p>
                    <div className="rounded bg-muted/50 p-3 text-sm">
                      <p className="font-semibold">Улучшенная версия:</p>
                      <p className="mt-1">{writingResult.improvedVersion}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* LISTENING (PRO) */}
        <TabsContent value="LISTENING" className="mt-6">
          {!isPro ? (
            <ProLockCard title="Listening — тренировка восприятия на слух" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Headphones className="h-5 w-5" />
                  {LISTENING_SCRIPTS[stage].title}
                </CardTitle>
                <CardDescription>
                  Прослушайте аудиофрагмент и ответьте на вопрос
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" onClick={playListeningScript}>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Воспроизвести аудио
                </Button>
                <p className="font-medium">{LISTENING_SCRIPTS[stage].question}</p>
                <Textarea
                  rows={3}
                  placeholder="Ваш ответ..."
                  value={listeningAnswer}
                  onChange={(e) => setListeningAnswer(e.target.value)}
                />
                <Button
                  onClick={submitListening}
                  disabled={listeningLoading || !listeningAnswer.trim()}
                >
                  {listeningLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Проверить ответ
                </Button>

                {listeningResult && (
                  <div className="rounded-lg border border-border p-4 text-sm">
                    <p className="font-semibold">
                      Результат: {listeningResult.score}/100
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {listeningResult.feedbackRu}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SPEAKING (PRO) */}
        <TabsContent value="SPEAKING" className="mt-6">
          {!isPro ? (
            <ProLockCard title="Speaking и проверка произношения" />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Speaking & Проверка произношения (Pro)
                </CardTitle>
                <CardDescription>{SPEAKING_PROMPTS[stage]}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {!recording ? (
                    <Button onClick={startRecording} disabled={speakingLoading}>
                      <Mic className="mr-2 h-4 w-4" />
                      Записать голос
                    </Button>
                  ) : (
                    <Button variant="destructive" onClick={stopRecording}>
                      <Square className="mr-2 h-4 w-4" />
                      Остановить и отправить
                    </Button>
                  )}
                </div>

                <Textarea
                  rows={3}
                  placeholder="Или введите транскрипт речи вручную для текстового разбора..."
                  value={speakingTranscript}
                  onChange={(e) => setSpeakingTranscript(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => submitSpeaking()}
                  disabled={speakingLoading || !speakingTranscript.trim()}
                >
                  {speakingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Анализировать текст речи
                </Button>

                {speakingResult && (
                  <div className="space-y-3 rounded-lg border border-border p-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Badge>Произношение: {speakingResult.pronunciationScore}%</Badge>
                      <Badge variant="secondary">
                        Беглость: {speakingResult.fluencyScore}%
                      </Badge>
                      <Badge variant="outline">
                        Точность: {speakingResult.accuracyScore}%
                      </Badge>
                    </div>
                    <p>{speakingResult.summaryRu}</p>
                    <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                      {speakingResult.phoneticTipsRu.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProLockCard({ title }: { title: string }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Lock className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>
          Этот режим доступен на тарифе Pro без ограничений по времени.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/pricing" className={buttonVariants()}>
          <Crown className="mr-2 h-4 w-4" />
          Открыть Pro через Stripe
        </Link>
      </CardContent>
    </Card>
  );
}
