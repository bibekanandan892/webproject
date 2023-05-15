package com.bibek.webproject.models
import com.bibek.webproject.utils.Res

enum class Projects(
    val image: String,
    val title: String,
    val description: String
) {
    One(
        image = Res.Image.heart,
        title = "Where is my Heart",
        description = "Android & Ktor"

    ),
    Two(
        image = Res.Image.boruto,
        title = "Boruto: Naruto Next Generations App",
        description = "Compose UI Android"
    ),
    Three(
        image = Res.Image.portfolio3,
        title = "NFT Application",
        description = "Frontend/Backend"
    ),
    Four(
        image = Res.Image.portfolio4,
        title = "Game Statistics Application",
        description = "Web/Mobile App"
    ),
    Five(
        image = Res.Image.portfolio5,
        title = "Platform for Online Courses",
        description = "Web/Mobile App"
    )
}