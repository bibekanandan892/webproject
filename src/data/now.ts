export type WorkStatus = "in-progress" | "shipping-soon" | "research";

export interface NowEntry {
  title: string;
  description: string;
  status: WorkStatus;
  techStack: string[];
  link?: string;
}

export const STATUS_LABELS: Record<WorkStatus, string> = {
  "in-progress": "In Progress",
  "shipping-soon": "Shipping Soon",
  "research": "Research",
};

export const nowEntries: NowEntry[] = [
  {
    title: "AI Job Application Agent",
    description:
      "Autonomous LangGraph + Playwright agent that searches, ranks, and auto-applies to roles end-to-end. Local-first with a Next.js dashboard for human-in-the-loop oversight.",
    status: "in-progress",
    techStack: ["Python", "LangGraph", "Playwright", "FastAPI", "Next.js"],
    link: "https://github.com/bibekanandan892/ai-job-application-agent",
  },
  {
    title: "This portfolio (you're on it)",
    description:
      "Rebuilt from scratch in Next.js 16 with a terminal-dark aesthetic, static-exported and deployed to Render. Replaced an experimental Kotlin/Kobweb version.",
    status: "shipping-soon",
    techStack: ["Next.js 16", "TypeScript", "Tailwind v4", "Framer Motion"],
    link: "https://github.com/bibekanandan892/webproject",
  },
  {
    title: "On-device LLM experiments",
    description:
      "Exploring Foundation Models on Android and Compose Multiplatform — quantized inference, prompt caching strategies, and latency budgets for mobile-first AI features.",
    status: "research",
    techStack: ["Kotlin", "Compose", "ML Kit"],
  },
];
