package com.bibek.webproject.models
import com.bibek.webproject.utils.Constants.ANDROID_DEV_DEC
import com.bibek.webproject.utils.Constants.AWS_DEV_DES
import com.bibek.webproject.utils.Constants.COMPOSE_MULT_DEV_DEC
import com.bibek.webproject.utils.Constants.KTOR_DEV_DEC
import com.bibek.webproject.utils.Constants.LINUX_DEV_DES
import com.bibek.webproject.utils.Constants.LOREM_IPSUM_SHORTEST
import com.bibek.webproject.utils.Constants.WEB_DEV_DEC
import com.bibek.webproject.utils.Res

enum class Technologys(
    val icon: String,
    val imageDesc: String,
    val title: String,
    val description: String
) {
    Android(
        icon = Res.Icon.android,
        imageDesc = "Android Icon",
        title = "Android Development",
        description = ANDROID_DEV_DEC
    ),
    IOS(
        icon = Res.Icon.Ktor,
        imageDesc = "Ktor Icon",
        title = "Ktor Development",
        description = KTOR_DEV_DEC
    ),
    Web(
        icon = Res.Icon.web,
        imageDesc = "Desktop Icon",
        title = "Compose Web Development",
        description = WEB_DEV_DEC
    ),
    Design(
        icon = Res.Icon.compose,
        imageDesc = "compose Icon",
        title = "Compose Multiplatform",
        description = COMPOSE_MULT_DEV_DEC
    ),
    Business(
        icon = Res.Icon.aws,
        imageDesc = "Aws Icon",
        title = "Aws Cloud",
        description = AWS_DEV_DES
    ),
    SEO(
        icon = Res.Icon.linux,
        imageDesc = "Linux Icon",
        title = "Linux Operating System",
        description = LINUX_DEV_DES
    )
}