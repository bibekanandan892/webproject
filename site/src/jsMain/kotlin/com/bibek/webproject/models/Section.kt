package com.bibek.webproject.models

enum class Section(
    val id: String,
    val title: String,
    val subtitle: String,
    val path: String
) {
    Home(
        id = "home",
        title = "Home",
        subtitle = "",
        path = "#home"
    ),
    Now(
        id = "now",
        title = "Now",
        subtitle = "What I'm Building",
        path = "#now"
    ),
    LookingFor(
        id = "lookingFor",
        title = "Looking For",
        subtitle = "What I Want Next",
        path = "#lookingFor"
    ),
    Experience(
        id = "experience",
        title = "Experience",
        subtitle = "Work Experience",
        path = "#experience"
    ),
    Programming(
        id = "Programming",
        title = "Programming",
        subtitle = "I can Code in",
        path = "#Programming"
    ),
    Technology(
        id = "Technology",
        title = "Technology",
        subtitle = "I'm Good at",
        path = "#Technology"
    ),
    Projects(
        id = "Projects",
        title = "Projects",
        subtitle = "My Work",
        path = "#Projects"
    ),
    Contact(
        id = "contact",
        title = "Contact",
        subtitle = "Get in Touch",
        path = "#contact"
    ),
    Testimonial(
        id = "testimonial",
        title = "Testimonial",
        subtitle = "Happy Customers",
        path = "#testimonial"
    ),
    Achievements(
        id = "achievements",
        title = "Achievements",
        subtitle = "Personal Achievements",
        path = "#achievements"
    )
}

data class ExternalNavItem(val title: String, val path: String)

object ExternalNav {
    val Blog = ExternalNavItem(title = "Blog", path = "/blogs/")
}

// Sections that should appear as scroll-anchor links in the top nav.
// Order in this list = order in the nav bar.
val NavSections: List<Section> = listOf(
    Section.Home,
    Section.Now,
    Section.Experience,
    Section.Programming,
    Section.Technology,
    Section.Projects,
    Section.Contact
)