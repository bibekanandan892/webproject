package com.bibek.webproject.models
import com.bibek.webproject.utils.Res

enum class Projects(
    val image: String,
    val title: String,
    val description: String,
    val link: String
) {
    One(
        image = Res.Image.byteStream,
        title = "Byte Stream",
        description = "A file downloading library for Android",
        link = "https://github.com/bibekanandan892/Byte-Stream"
    ),
    Two(
        image = Res.Image.recipe_database,
        title = "Recipe Database",
        description = "A Meal Planning App with notifications and reminders.",
        link = "https://github.com/bibekanandan892/Recipe-Database"
    ),
    Three(
        image = Res.Image.heart,
        title = "Where is my Heart",
        description = "Android & Ktor",
        link = "https://github.com/bibekanandan892/Where_is_my_heart"
    ),
    Four(
        image = Res.Image.portfolio3,
        title = "NFT Application",
        description = "Frontend/Backend",
        link = ""
    ),
    Five(
        image = Res.Image.portfolio5,
        title = "Platform for Online Courses",
        description = "Web/Mobile App",
        link = ""
    )
}