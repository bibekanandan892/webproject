export interface ContactLink {
  label: string;
  href: string;
}

export const lookingFor = {
  headline: "Open to Senior Android / Applied AI engineering roles",
  pitch:
    "I build at the intersection of Android, Kotlin Multiplatform, and applied AI. I'm most useful on teams that ship to real users at scale and care as much about performance, accessibility, and craft as they do about velocity.",
  role: [
    "Senior / Staff Android Engineer",
    "Kotlin Multiplatform Tech Lead",
    "Applied AI / Agent Engineer (mobile-adjacent)",
  ],
  domains: [
    "Android & Compose Multiplatform",
    "Applied AI agents and tool use",
    "On-device ML & Foundation Models",
    "Developer experience & platform tooling",
  ],
  contacts: [
    { label: "Email", href: "mailto:bibekanandan892@gmail.com" },
    { label: "GitHub", href: "https://github.com/bibekanandan892" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/bibekanandan892/" },
  ] satisfies ContactLink[],
} as const;
