import { GoogleGenAI } from "@google/genai";
import type { StageId } from "@/data/curriculum";

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

async function generateWithRetry(
  ai: GoogleGenAI,
  contents:
    | string
    | Array<string | { inlineData: { data: string; mimeType: string } }>,
  maxAttempts = 3
) {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
      });
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      const isTransient = status === 503 || status === 429;
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, attempt * 500));
    }
  }
  throw lastErr;
}

export interface GrammarResult {
  correctedText: string;
  isCorrect: boolean;
  errors: { original: string; correction: string; explanationRu: string }[];
  overallFeedbackRu: string;
  demoMode?: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanationRu: string;
  demoMode?: boolean;
}

export interface WritingEvaluation {
  overallScore: number;
  cefrEstimate: string;
  criteria: {
    grammar: number;
    vocabulary: number;
    coherence: number;
    taskAchievement: number;
  };
  errorBreakdown: {
    excerpt: string;
    suggestion: string;
    reasonRu: string;
  }[];
  improvedVersion: string;
  summaryRu: string;
  demoMode?: boolean;
}

export interface SpeakingEvaluation {
  pronunciationScore: number;
  fluencyScore: number;
  accuracyScore: number;
  transcript: string;
  phoneticTipsRu: string[];
  errorBreakdown: {
    spoken: string;
    naturalAlternative: string;
    explanationRu: string;
  }[];
  summaryRu: string;
  demoMode?: boolean;
}

function safeParseJson<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

export async function evaluateGrammarAndSpelling(
  text: string,
  stage: StageId
): Promise<GrammarResult> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      correctedText: text,
      isCorrect: false,
      errors: [
        {
          original: text.slice(0, 40),
          correction: text.slice(0, 40),
          explanationRu:
            "Демо-режим: добавьте GEMINI_API_KEY в .env.local для живого разбора от gemini-3.5-flash-lite.",
        },
      ],
      overallFeedbackRu:
        "Подключите GEMINI_API_KEY, чтобы получать мгновенную проверку грамматики и орфографии.",
      demoMode: true,
    };
  }

  const prompt = `You are an expert English tutor for a Russian-speaking student at stage "${stage}".
Analyze the following English text for grammar and spelling mistakes.
Return ONLY valid JSON matching this schema:
{
  "correctedText": "string",
  "isCorrect": boolean,
  "errors": [{ "original": "string", "correction": "string", "explanationRu": "string in Russian" }],
  "overallFeedbackRu": "concise encouraging feedback in Russian"
}
Student text: """${text}"""`;

  const response = await generateWithRetry(ai, prompt);

  return safeParseJson<GrammarResult>(response.text, {
    correctedText: text,
    isCorrect: true,
    errors: [],
    overallFeedbackRu: response.text || "Проверка завершена.",
  });
}

export async function generateQuizOrTask(
  stage: StageId,
  mode: "QUIZ" | "TASK"
): Promise<QuizQuestion> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      question:
        stage === "BEGINNER"
          ? "Choose the correct sentence:"
          : "Select the most natural phrasing:",
      options: [
        "She go to work every day.",
        "She goes to work every day.",
        "She going to work every day.",
        "She is go to work every day.",
      ],
      correctIndex: 1,
      explanationRu:
        "Демо-вопрос: в Present Simple для третьего лица единственного числа (she) добавляется окончание -es (goes).",
      demoMode: true,
    };
  }

  const prompt = `Create 1 ${mode === "QUIZ" ? "multiple-choice grammar/vocabulary quiz" : "practical sentence-completion task"} for an English learner at level "${stage}".
Return ONLY valid JSON:
{
  "question": "string in English",
  "options": ["option A", "option B", "option C", "option D"],
  "correctIndex": 0,
  "explanationRu": "clear explanation in Russian"
}`;

  const response = await generateWithRetry(ai, prompt);

  return safeParseJson<QuizQuestion>(response.text, {
    question: "Choose the grammatically correct sentence:",
    options: [
      "I have been here since two hours.",
      "I have been here for two hours.",
      "I am here since two hours.",
      "I was here for two hours now.",
    ],
    correctIndex: 1,
    explanationRu: "Предлог 'for' используется для указания длительности периода.",
  });
}

export async function evaluateWritingPro(
  promptText: string,
  essay: string,
  stage: StageId
): Promise<WritingEvaluation> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      overallScore: 78,
      cefrEstimate: stage,
      criteria: {
        grammar: 76,
        vocabulary: 80,
        coherence: 79,
        taskAchievement: 77,
      },
      errorBreakdown: [
        {
          excerpt: essay.slice(0, 45) || "Sample sentence",
          suggestion: "Consider using stronger linking words.",
          reasonRu:
            "Демо-режим (Pro): добавьте GEMINI_API_KEY для глубокого оценивания Writing моделью gemini-3.5-flash-lite.",
        },
      ],
      improvedVersion: essay,
      summaryRu:
        "Хорошая структура текста! В боевом режиме AI оценит эссе по 4 критериям и предложит улучшенную версию.",
      demoMode: true,
    };
  }

  const prompt = `You are an IELTS/Cambridge examiner evaluating a Russian-speaking student's writing at target stage "${stage}".
Task prompt: "${promptText}"
Student writing: """${essay}"""
Return ONLY valid JSON:
{
  "overallScore": 0-100,
  "cefrEstimate": "A1/A2/B1/B2/C1/C2",
  "criteria": {
    "grammar": 0-100,
    "vocabulary": 0-100,
    "coherence": 0-100,
    "taskAchievement": 0-100
  },
  "errorBreakdown": [
    { "excerpt": "string", "suggestion": "string", "reasonRu": "detailed explanation in Russian" }
  ],
  "improvedVersion": "rewritten polished version in English",
  "summaryRu": "comprehensive feedback in Russian"
}`;

  const response = await generateWithRetry(ai, prompt);

  return safeParseJson<WritingEvaluation>(response.text, {
    overallScore: 75,
    cefrEstimate: stage,
    criteria: { grammar: 75, vocabulary: 75, coherence: 75, taskAchievement: 75 },
    errorBreakdown: [],
    improvedVersion: essay,
    summaryRu: response.text || "Оценка завершена.",
  });
}

export async function evaluateSpeakingPro(params: {
  promptText: string;
  transcript?: string;
  audioBase64?: string;
  audioMimeType?: string;
  stage: StageId;
}): Promise<SpeakingEvaluation> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      pronunciationScore: 82,
      fluencyScore: 79,
      accuracyScore: 80,
      transcript:
        params.transcript ||
        "Hello, my name is Alex and I practice English every day.",
      phoneticTipsRu: [
        "Обратите внимание на межзубный звук /θ/ в словах think, three.",
        "Следите за редукцией безударных гласных в беглой речи.",
      ],
      errorBreakdown: [
        {
          spoken: "I practice English every days",
          naturalAlternative: "I practice English every day",
          explanationRu:
            "Демо-режим (Pro): подключите GEMINI_API_KEY для реального анализа произношения с микрофона.",
        },
      ],
      summaryRu:
        "Отличная попытка! Подключите GEMINI_API_KEY, чтобы gemini-3.5-flash-lite анализировал ваше аудио.",
      demoMode: true,
    };
  }

  const instruction = `You are an English pronunciation & speaking coach for a Russian speaker at stage "${params.stage}".
Speaking prompt: "${params.promptText}"
${params.transcript ? `Transcript provided: "${params.transcript}"` : ""}
Analyze pronunciation, fluency, and grammar. Return ONLY valid JSON:
{
  "pronunciationScore": 0-100,
  "fluencyScore": 0-100,
  "accuracyScore": 0-100,
  "transcript": "what the student said",
  "phoneticTipsRu": ["specific pronunciation tip in Russian"],
  "errorBreakdown": [{ "spoken": "string", "naturalAlternative": "string", "explanationRu": "string in Russian" }],
  "summaryRu": "encouraging summary in Russian"
}`;

  const contents: Array<
    string | { inlineData: { data: string; mimeType: string } }
  > = [instruction];

  if (params.audioBase64 && params.audioMimeType) {
    contents.push({
      inlineData: {
        data: params.audioBase64,
        mimeType: params.audioMimeType,
      },
    });
  }

  const response = await generateWithRetry(ai, contents);

  return safeParseJson<SpeakingEvaluation>(response.text, {
    pronunciationScore: 80,
    fluencyScore: 80,
    accuracyScore: 80,
    transcript: params.transcript || "",
    phoneticTipsRu: ["Продолжайте практиковаться вслух каждый день."],
    errorBreakdown: [],
    summaryRu: response.text || "Анализ речи завершён.",
  });
}

export async function evaluateListeningAnswer(
  script: string,
  question: string,
  userAnswer: string,
  stage: StageId
): Promise<{ isCorrect: boolean; score: number; feedbackRu: string; demoMode?: boolean }> {
  const ai = getGeminiClient();
  if (!ai) {
    return {
      isCorrect: userAnswer.trim().length > 5,
      score: userAnswer.trim().length > 5 ? 85 : 30,
      feedbackRu:
        "Демо-режим (Pro): добавьте GEMINI_API_KEY для точной проверки понимания на слух.",
      demoMode: true,
    };
  }

  const prompt = `Evaluate a student's listening comprehension answer at stage "${stage}".
Audio script: "${script}"
Question: "${question}"
Student answer: "${userAnswer}"
Return ONLY valid JSON:
{
  "isCorrect": boolean,
  "score": 0-100,
  "feedbackRu": "clear explanation in Russian"
}`;

  const response = await generateWithRetry(ai, prompt);

  return safeParseJson(response.text, {
    isCorrect: true,
    score: 80,
    feedbackRu: response.text || "Ответ проверен.",
  });
}
