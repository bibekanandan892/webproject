package com.bibek.webproject.models

import com.bibek.webproject.utils.Constants.INEURON_DES
import com.bibek.webproject.utils.Constants.I_SERVEU_DES
import com.bibek.webproject.utils.Constants.LOREM_IPSUM_LONG

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
        jobPosition = "Kotlin Android Developer",
        description = I_SERVEU_DES,
        company = "iServeU Technology Pvt. Ltd.",
        from = "January 2022",
        to = "NOW",
    )
    ,
    Second(
        number = "02",
        jobPosition = "Machine Learning Intern",
        description = INEURON_DES,
        company = "Ineuron Technology Pvt. Ltd",
        from = "January 2020",
        to = "October 2020",
    ),
//    Third(
//        number = "03",
//        jobPosition = "Freelancer",
//        description = LOREM_IPSUM_LONG,
//        company = "Netflix",
//        from = "March 2020",
//        to = "August 2020",
//    )
}