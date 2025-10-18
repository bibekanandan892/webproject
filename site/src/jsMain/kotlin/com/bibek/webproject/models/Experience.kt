package com.bibek.webproject.models

import com.bibek.webproject.utils.Constants.INEURON_DES
import com.bibek.webproject.utils.Constants.I_SERVEU_DES
import com.bibek.webproject.utils.Constants.LOREM_IPSUM_LONG
import com.bibek.webproject.utils.Constants.SWIGGY_DES

enum class Experience(
    val number: String,
    val jobPosition: String,
    val description: String,
    val company: String,
    val from: String,
    val to: String
) {
    First(
        number = "01",
        jobPosition = "SDE 1",
        description = SWIGGY_DES,
        company = "Swiggy Limited",
        from = "February 2025",
        to = "Now",
    )
    ,
    Second(
        number = "02",
        jobPosition = "Kotlin Android Developer",
        description = I_SERVEU_DES,
        company = "iServeU Technology Pvt. Ltd.",
        from = "January 2022",
        to = "February 2025",
    ),
    Third(
        number = "03",
        jobPosition = "Machine Learning Intern",
        description = INEURON_DES,
        company = "Ineuron Technology Pvt. Ltd",
        from = "February 2020",
        to = "May 2020",
    )
}