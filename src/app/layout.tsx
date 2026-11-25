import type { Metadata } from "next";
import { Cuprum, Red_Hat_Text } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const cuprum = Cuprum({
  variable: "--font-cuprum",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const redHatText = Red_Hat_Text({
  variable: "--font-red-hat-text",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LinguaForge AI — Персональный AI-репетитор английского языка",
  description:
    "SaaS-платформа для изучения английского с AI-репетитором Gemini: 4 уровня подготовки, грамматика, квизы, Speaking, Listening и Writing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${cuprum.variable} ${redHatText.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
