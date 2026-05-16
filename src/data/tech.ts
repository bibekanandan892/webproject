export interface TechItem {
  name: string;
  icon?: string;
}

export interface TechCategory {
  category: string;
  description: string;
  items: TechItem[];
}

export const techStack: TechCategory[] = [
  {
    category: "Mobile",
    description: "Production Android + Kotlin Multiplatform work for years.",
    items: [
      { name: "Kotlin" },
      { name: "Android SDK", icon: "/icons/android_icon.svg" },
      { name: "Jetpack Compose", icon: "/icons/compose.svg" },
      { name: "Compose Multiplatform" },
      { name: "Coroutines & Flow" },
      { name: "Hilt / Dagger" },
    ],
  },
  {
    category: "Backend",
    description: "API surfaces for the apps I ship.",
    items: [
      { name: "Ktor", icon: "/icons/ktor.svg" },
      { name: "FastAPI" },
      { name: "Node / Next.js" },
      { name: "PostgreSQL" },
      { name: "MongoDB" },
      { name: "REST + WebSocket" },
    ],
  },
  {
    category: "Applied AI",
    description: "Agents, retrieval, and on-device inference.",
    items: [
      { name: "Anthropic SDK" },
      { name: "LangGraph" },
      { name: "Playwright Agents" },
      { name: "Prompt caching" },
      { name: "ML Kit / on-device" },
      { name: "OpenAI SDK" },
    ],
  },
  {
    category: "Platform",
    description: "Where it runs.",
    items: [
      { name: "AWS", icon: "/icons/aws.svg" },
      { name: "Linux", icon: "/icons/linux.svg" },
      { name: "Docker" },
      { name: "GitHub Actions" },
    ],
  },
];
