export interface ExperienceEntry {
  company: string;
  role: string;
  from: string;
  to: string;
  logo: string;
  description: string;
  highlights: string[];
}

export const experiences: ExperienceEntry[] = [
  {
    company: "Swiggy",
    role: "Software Engineer I",
    from: "Feb 2025",
    to: "Present",
    logo: "/logos/swiggy.webp",
    description:
      "Working on Android consumer apps used by tens of millions of users every day. Focused on performance, reliability, and shipping new commerce features end-to-end.",
    highlights: [
      "Kotlin + Jetpack Compose feature work in a large monorepo",
      "Performance & startup-time investigations across large surfaces",
      "Cross-functional design / product / backend collaboration",
    ],
  },
  {
    company: "iServeU",
    role: "Kotlin Android Developer",
    from: "Jan 2022",
    to: "Feb 2025",
    logo: "/logos/iserveu.jpg",
    description:
      "Built and shipped financial-services Android apps for India's micro-banking and agent-banking networks. Owned multiple modules end-to-end from product spec to release.",
    highlights: [
      "MVVM, Coroutines, Hilt, Room, Retrofit production stack",
      "Modularisation, build-time reduction, CI hardening",
      "Mentored juniors and ran code-review culture",
    ],
  },
];
