package com.bibek.webproject.models

import com.bibek.webproject.utils.Constants.I_SERVEU_DES
import com.bibek.webproject.utils.Constants.SWIGGY_DES
import com.bibek.webproject.utils.Res

enum class Experience(
    val number: String,
    val jobPosition: String,
    val description: String,
    val company: String,
    val from: String,
    val to: String,
    val companyLogo: String
) {
    First(
        number = "01",
        jobPosition = "SDE I",
        description = SWIGGY_DES,
        company = "Swiggy Limited",
        from = "February 2025",
        to = "Now",
        companyLogo = Res.Image.swiggyLogo
    ),
    Second(
        number = "02",
        jobPosition = "Kotlin Android Developer",
        description = I_SERVEU_DES,
        company = "iServeU Technology Pvt. Ltd.",
        from = "January 2022",
        to = "February 2025",
        companyLogo = Res.Image.iserveuLogo
    )
}