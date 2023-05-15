package com.bibek.webproject.models

import org.jetbrains.compose.web.css.CSSSizeValue
import org.jetbrains.compose.web.css.CSSUnit
import org.jetbrains.compose.web.css.percent

enum class Code(
    val title: String,
    val percentage: CSSSizeValue<CSSUnit.percent>
) {
    Creative(
        title = "Kotlin",
        percentage = 90.percent
    ),
    Accountable(
        title = "Java",
        percentage = 90.percent
    ),
    HardWorking(
        title = "C++",
        percentage = 80.percent
    )
}