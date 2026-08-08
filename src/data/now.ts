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
    title: "VyaparPay Voice Support Agent",
    description:
      "Asha — a screen-aware voice AI support agent for Android merchants. Real-time WebRTC voice with Deepgram STT, Claude via OpenRouter, and streamed TTS, ingesting live screen context to open support calls with full context before the user speaks.",
    status: "in-progress",
    techStack: ["Kotlin", "Python", "WebRTC", "FastAPI", "pgvector"],
    link: "https://github.com/bibekanandan892/vyaparpay-voice-agent",
  },
  {
    title: "AI Job Application Agent",
    description:
      "Autonomous LangGraph + Playwright agent that searches, ranks, and auto-applies to roles end-to-end. Local-first with a Next.js dashboard for human-in-the-loop oversight.",
    status: "in-progress",
    techStack: ["Python", "LangGraph", "Playwright", "FastAPI", "Next.js"],
    link: "https://github.com/bibekanandan892/ai-job-application-agent",
  },
  {
    title: "Memory in LLMs",
    description:
      "Digging into how agents remember across sessions instead of forgetting at the edge of the context window. Comparing vector-similarity recall, rolling summarization, and structured episodic stores — and measuring where each one quietly loses information the others would have kept.",
    status: "research",
    techStack: ["pgvector", "Embeddings", "RAG", "LangGraph"],
  },
];
