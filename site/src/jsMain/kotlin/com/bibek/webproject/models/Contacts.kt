package com.bibek.webproject.models

import com.bibek.webproject.utils.Res

enum class Contacts(
    val icon: String,
    val title: String,
    val details: String
) {
    Email(
        icon = Res.Icon.email,
        title = "Email",
        details = "Bibekanandan892@gmail.com"
    ),
    Mobile(
        icon = Res.Icon.mobile,
        title = "Mobile",
        details = "+91 9337037932"
    ),
    Phone(
        icon = Res.Icon.phone,
        title = "Phone",
        details = "+91 9337037932"
    )
}