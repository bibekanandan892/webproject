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
    Experience(
        id = "experience",
        title = "Experience",
        subtitle = "Work Experience",
        path = "#experience"
    ),
    About(
        id = "about",
        title = "About me",
        subtitle = "Why Hire Me?",
        path = "#about"
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
        title = "Contact me",
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