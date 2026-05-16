package com.bibek.webproject.models

data class LookingForContact(val label: String, val href: String)

object LookingFor {
    const val headline = "Open to Senior Android / AI engineering roles"
    const val pitch =
        "I build at the intersection of Android, Kotlin Multiplatform, and applied AI. " +
        "I am most useful on teams that ship to real users at scale and care as much about " +
        "performance, accessibility, and craft as they do about velocity."

    val role: List<String> = listOf(
        "Senior / Staff Android Engineer",
        "Kotlin Multiplatform Tech Lead",
        "Applied AI / Agent Engineer (mobile-adjacent)"
    )

    val domains: List<String> = listOf(
        "Android & Compose Multiplatform",
        "Applied AI agents and tool use",
        "On-device ML & Foundation Models",
        "Developer experience and platform tooling"
    )

    val contacts: List<LookingForContact> = listOf(
        LookingForContact(label = "Email", href = "mailto:bibekanandan892@gmail.com"),
        LookingForContact(label = "GitHub", href = "https://github.com/bibekanandan892"),
        LookingForContact(label = "LinkedIn", href = "https://www.linkedin.com/in/bibekanandan892/")
    )
}
