package com.bibek.webproject.models

enum class WorkStatus(val label: String) {
    InProgress(label = "In Progress"),
    ShippingSoon(label = "Shipping Soon"),
    Research(label = "Research")
}

data class CurrentWorkEntry(
    val title: String,
    val description: String,
    val status: WorkStatus,
    val techStack: List<String>,
    val link: String? = null
)

val CurrentWork: List<CurrentWorkEntry> = listOf(
    CurrentWorkEntry(
        title = "AI Job Application Agent",
        description = "Autonomous LangGraph + Playwright agent that searches, ranks, and auto-applies to roles end-to-end. Local-first with a Next.js dashboard for human-in-the-loop oversight.",
        status = WorkStatus.InProgress,
        techStack = listOf("Python", "LangGraph", "Playwright", "FastAPI", "Next.js"),
        link = "https://github.com/bibekanandan892/ai-job-application-agent"
    ),
    CurrentWorkEntry(
        title = "Liquid Glass Portfolio",
        description = "Redesigning this site itself: Aurora Dark palette, frosted-glass cards, and a Markdown-driven blog covering AI and Android engineering.",
        status = WorkStatus.ShippingSoon,
        techStack = listOf("Kotlin", "Kobweb", "Compose HTML"),
        link = "https://github.com/bibekanandan892/webproject"
    ),
    CurrentWorkEntry(
        title = "On-device LLM Experiments",
        description = "Exploring Foundation Models on Android and Compose Multiplatform - quantized inference, prompt caching strategies, and latency budgets for mobile.",
        status = WorkStatus.Research,
        techStack = listOf("Kotlin", "Compose", "ML Kit"),
        link = null
    )
)
