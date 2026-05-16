export interface ProjectLinks {
  github?: string;
  demo?: string;
}

export interface Project {
  title: string;
  description: string;
  cover: string;
  tags: string[];
  links: ProjectLinks;
  featured?: boolean;
}

export const projects: Project[] = [
  {
    title: "Byte-Stream",
    description:
      "Feature-rich Android file downloading library in Kotlin with parallel downloads, pause/resume, retry policies, and persistent state.",
    cover: "/projects/byte-stream.png",
    tags: ["Kotlin", "Android", "Coroutines", "Library"],
    links: { github: "https://github.com/bibekanandan892/Byte-Stream" },
    featured: true,
  },
  {
    title: "Recipe Database",
    description:
      "Recipe discovery and meal-planning app with shopping list generation, smart reminders, and offline-first storage.",
    cover: "/projects/recipe-database.png",
    tags: ["Android", "Jetpack", "MVVM", "Room"],
    links: { github: "https://github.com/bibekanandan892/Recipe-Database" },
  },
  {
    title: "Where Is My Heart",
    description:
      "Location-sharing companion app with real-time map sync and a Ktor backend. Built as a personal-stack exploration.",
    cover: "/projects/where-is-my-heart.jpeg",
    tags: ["Android", "Ktor", "Realtime"],
    links: { github: "https://github.com/bibekanandan892/Where_is_my_heart" },
  },
  {
    title: "NFT Application",
    description:
      "Concept Android app for browsing, bidding, and collecting NFTs with wallet integration and an animated detail view.",
    cover: "/projects/nft-application.png",
    tags: ["Android", "Compose", "Web3"],
    links: {},
  },
  {
    title: "Online Courses Platform",
    description:
      "Course catalog + learning experience prototype with Android consumer and Ktor backend feeding lesson + progress data.",
    cover: "/projects/online-courses.png",
    tags: ["Android", "Ktor", "Education"],
    links: {},
  },
];
