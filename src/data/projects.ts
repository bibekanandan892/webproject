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
    title: "ChatApplication",
    description:
      "Realtime Android stranger-chat over Ktor WebSockets — ACK-based delivery, offline message queue, random pairing, Clean Architecture with Compose + Hilt + Room.",
    cover: "https://opengraph.githubassets.com/1/bibekanandan892/ChatApplication",
    tags: ["Kotlin", "Compose", "Ktor", "WebSockets", "Hilt"],
    links: { github: "https://github.com/bibekanandan892/ChatApplication" },
  },
  {
    title: "Pokemon App",
    description:
      "Compose Pokédex built on Clean Architecture — Hilt, Ktor, Room offline-first cache, Paging 3, Coil, Lottie. Portrait + landscape support.",
    cover: "https://opengraph.githubassets.com/1/bibekanandan892/Pokemon_App",
    tags: ["Kotlin", "Compose", "Clean Architecture", "Paging"],
    links: { github: "https://github.com/bibekanandan892/Pokemon_App" },
  },
  {
    title: "Recipe Database",
    description:
      "Recipe discovery and meal-planning app with shopping list generation, smart reminders, and offline-first Room storage backed by the Spoonacular API.",
    cover: "/projects/recipe-database.png",
    tags: ["Android", "Jetpack", "MVVM", "Room"],
    links: { github: "https://github.com/bibekanandan892/Recipe-Database" },
  },
  {
    title: "Where Is My Heart",
    description:
      "Two-person Android location-sharing companion app — Firebase Realtime DB for live position sync, FCM geofence pushes, Compose UI, Hilt DI.",
    cover: "/projects/where-is-my-heart.jpeg",
    tags: ["Android", "Firebase", "Compose", "Realtime"],
    links: { github: "https://github.com/bibekanandan892/Where_is_my_heart" },
  },
  {
    title: "Task Manager CLI · LRU Cache",
    description:
      "Kotlin command-line task manager backed by a hand-rolled LRU cache (doubly-linked list + hashmap) — least-recently-used tasks evict when the user-defined capacity is exceeded.",
    cover: "https://opengraph.githubassets.com/1/bibekanandan892/Task-Manager-CLI-with-LRU-Cache",
    tags: ["Kotlin", "CLI", "Data Structures"],
    links: { github: "https://github.com/bibekanandan892/Task-Manager-CLI-with-LRU-Cache" },
  },
];
