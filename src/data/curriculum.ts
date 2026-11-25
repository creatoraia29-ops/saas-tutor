export type StageId = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

export interface StageInfo {
  id: StageId;
  titleRu: string;
  cefr: string;
  descriptionRu: string;
  focusTopics: string[];
}

export interface LessonItem {
  id: string;
  stage: StageId;
  title: string;
  titleRu: string;
  isFree: boolean;
  durationMinutes: number;
  summaryRu: string;
  grammarRule: string;
  examples: { en: string; ru: string }[];
  exercisePrompt: string;
}

export const STAGES: StageInfo[] = [
  {
    id: "BEGINNER",
    titleRu: "Начальный",
    cefr: "A1–A2",
    descriptionRu:
      "Базовая грамматика, повседневная лексика, простые времена и построение первых фраз.",
    focusTopics: [
      "Present Simple & Continuous",
      "Артикли a / an / the",
      "Повседневные диалоги",
      "Базовое правописание",
    ],
  },
  {
    id: "INTERMEDIATE",
    titleRu: "Средний",
    cefr: "B1–B2",
    descriptionRu:
      "Уверенное общение, условные предложения, фразовые глаголы и структурированные тексты.",
    focusTopics: [
      "Present Perfect vs Past Simple",
      "Conditionals (0, 1, 2)",
      "Фразовые глаголы",
      "Аргументация и эссе",
    ],
  },
  {
    id: "ADVANCED",
    titleRu: "Продвинутый",
    cefr: "C1",
    descriptionRu:
      "Сложные грамматические конструкции, идиоматика, академическое письмо и беглая речь.",
    focusTopics: [
      "Инверсия и смешанные Conditionals",
      "Академическая лексика",
      "Идиомы и коллокации",
      "Деловая коммуникация",
    ],
  },
  {
    id: "EXPERT",
    titleRu: "Эксперт",
    cefr: "C2",
    descriptionRu:
      "Стилистические нюансы носителей, риторика, точная редактура и профессиональные дебаты.",
    focusTopics: [
      "Тонкая стилистика и регистр",
      "Риторические приёмы",
      "Нюансы интонации и акцента",
      "Профессиональная редактура",
    ],
  },
];

export const LESSONS: LessonItem[] = [
  {
    id: "lesson-1",
    stage: "BEGINNER",
    title: "Present Simple & Daily Routine",
    titleRu: "Урок 1: Present Simple и распорядок дня",
    isFree: true,
    durationMinutes: 5,
    summaryRu: "Научитесь рассказывать о привычках и регулярных действиях.",
    grammarRule:
      "Для he/she/it в утвердительных предложениях добавляется окончание -s/-es. Вопросы строятся с помощью do/does.",
    examples: [
      { en: "I drink coffee every morning.", ru: "Я пью кофе каждое утро." },
      {
        en: "She works from home on Fridays.",
        ru: "Она работает из дома по пятницам.",
      },
    ],
    exercisePrompt: "Опишите свой обычный будний день в 3–4 предложениях на английском.",
  },
  {
    id: "lesson-2",
    stage: "BEGINNER",
    title: "Articles: A, An, The",
    titleRu: "Урок 2: Артикли a, an, the",
    isFree: true,
    durationMinutes: 5,
    summaryRu: "Разберитесь, когда использовать определённый и неопределённый артикли.",
    grammarRule:
      "Используйте a/an для исчисляемых существительных в единственном числе при первом упоминании, и the — когда предмет уже известен собеседнику.",
    examples: [
      { en: "I bought a new laptop yesterday.", ru: "Вчера я купил новый ноутбук." },
      { en: "The laptop is very fast.", ru: "Этот ноутбук очень быстрый." },
    ],
    exercisePrompt: "Составьте 3 предложения, используя артикли a, an и the.",
  },
  {
    id: "lesson-3",
    stage: "INTERMEDIATE",
    title: "Present Perfect vs Past Simple",
    titleRu: "Урок 3: Present Perfect против Past Simple",
    isFree: true,
    durationMinutes: 7,
    summaryRu: "Поймите разницу между завершённым прошлым и опытом, связанным с настоящим.",
    grammarRule:
      "Past Simple используется с точным указанием времени в прошлом (yesterday, in 2022). Present Perfect (have/has + V3) — когда важен результат сейчас.",
    examples: [
      { en: "I visited London in 2023.", ru: "Я посетил Лондон в 2023 году." },
      { en: "I have already finished the report.", ru: "Я уже закончил отчёт." },
    ],
    exercisePrompt:
      "Напишите 2 предложения в Past Simple и 2 в Present Perfect о своих достижениях.",
  },
  {
    id: "lesson-4",
    stage: "INTERMEDIATE",
    title: "First & Second Conditionals",
    titleRu: "Урок 4: Условные предложения 1 и 2 типа",
    isFree: true,
    durationMinutes: 7,
    summaryRu: "Говорите о реальных планах и гипотетических ситуациях.",
    grammarRule:
      "First Conditional: If + Present Simple, will + V1 (реально). Second Conditional: If + Past Simple, would + V1 (воображаемо).",
    examples: [
      {
        en: "If it rains tomorrow, we will stay inside.",
        ru: "Если завтра пойдёт дождь, мы останемся дома.",
      },
      {
        en: "If I had more time, I would learn Spanish.",
        ru: "Если бы у меня было больше времени, я бы выучил испанский.",
      },
    ],
    exercisePrompt: "Придумайте по одному примеру на First и Second Conditional.",
  },
  {
    id: "lesson-5",
    stage: "ADVANCED",
    title: "Inversion for Emphasis",
    titleRu: "Урок 5: Инверсия для усиления речи",
    isFree: true,
    durationMinutes: 8,
    summaryRu: "Освойте выразительные конструкции уровня C1.",
    grammarRule:
      "После отрицательных наречий в начале предложения (Never, Seldom, Not only) порядок слов меняется на вопросительный: вспомогательный глагол + подлежащее.",
    examples: [
      {
        en: "Never have I seen such a detailed analysis.",
        ru: "Никогда я ещё не видел столь подробного анализа.",
      },
    ],
    exercisePrompt: "Перефразируйте 2 обычных предложения с помощью инверсии (Never / Not only).",
  },
  {
    id: "lesson-6",
    stage: "ADVANCED",
    title: "Mixed Conditionals & Nuance",
    titleRu: "Урок 6: Смешанные условные предложения",
    isFree: false,
    durationMinutes: 10,
    summaryRu: "Связывайте причины в прошлом с результатами в настоящем (Pro).",
    grammarRule:
      "If + Past Perfect, would + V1 — когда прошлое решение влияет на текущую ситуацию.",
    examples: [
      {
        en: "If I had accepted that offer, I would live in Berlin now.",
        ru: "Если бы я принял то предложение, сейчас я бы жил в Берлине.",
      },
    ],
    exercisePrompt: "Напишите 3 предложения о том, как прошлые события повлияли на ваше настоящее.",
  },
  {
    id: "lesson-7",
    stage: "EXPERT",
    title: "Rhetoric & Executive Register",
    titleRu: "Урок 7: Риторика и деловой регистр C2",
    isFree: false,
    durationMinutes: 12,
    summaryRu: "Оттачивайте убедительность и стилистическую точность на уровне носителя (Pro).",
    grammarRule:
      "Сочетание параллельных конструкций, точных модальных оттенков (might well, could arguably) и эллипсиса.",
    examples: [
      {
        en: "Had it not been for their foresight, the initiative would have stalled.",
        ru: "Если бы не их дальновидность, инициатива зашла бы в тупик.",
      },
    ],
    exercisePrompt: "Напишите краткий аналитический абзац (80–120 слов) в формальном регистре.",
  },
];

export const WRITING_PROMPTS: Record<StageId, string> = {
  BEGINNER:
    "Write a short paragraph (50–80 words) about your favorite weekend activity and why you enjoy it.",
  INTERMEDIATE:
    "Write an opinion paragraph (100–150 words): Should remote work become the standard for tech companies?",
  ADVANCED:
    "Write a structured mini-essay (150–220 words) analyzing the impact of AI tutors on personalized education.",
  EXPERT:
    "Craft an executive briefing (200–280 words) evaluating the trade-offs between rapid AI adoption and institutional governance.",
};

export const SPEAKING_PROMPTS: Record<StageId, string> = {
  BEGINNER: "Introduce yourself, your hobbies, and what you usually do on weekends.",
  INTERMEDIATE: "Describe a memorable trip you took and explain what made it special.",
  ADVANCED: "Discuss a recent technological trend and how it changes the way people work.",
  EXPERT: "Present a persuasive 1-minute argument on balancing innovation with ethics.",
};

export const LISTENING_SCRIPTS: Record<
  StageId,
  { title: string; script: string; question: string }
> = {
  BEGINNER: {
    title: "At the Coffee Shop",
    script:
      "Hi! Can I get a medium oat milk latte and a blueberry muffin, please? Oh, and could you warm up the muffin? Thanks, I will sit by the window.",
    question: "What did the customer order, and where will they sit?",
  },
  INTERMEDIATE: {
    title: "Planning a Team Sprint",
    script:
      "Before we kick off Monday's sprint, let's make sure the API documentation is finalized. Sarah will handle the onboarding flow, while Alex focuses on performance benchmarks.",
    question: "Who is responsible for performance benchmarks, and what needs to be finalized before Monday?",
  },
  ADVANCED: {
    title: "Urban Mobility Podcast",
    script:
      "Cities that invested in integrated cycling infrastructure over the past decade didn't just cut emissions; they measurably boosted foot traffic for local retail.",
    question: "Besides cutting emissions, what economic benefit did cycling infrastructure bring?",
  },
  EXPERT: {
    title: "Monetary Policy Roundtable",
    script:
      "While headline inflation has moderated, core services remain stubbornly sticky, prompting central bankers to signal a cautious, data-dependent posture rather than premature easing.",
    question: "Why are central bankers signaling caution despite moderating headline inflation?",
  },
};
