package com.bibek.webproject.styles

import com.bibek.webproject.models.Theme
import com.varabyte.kobweb.compose.css.CSSTransition
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.silk.components.style.*
import kotlinx.coroutines.selects.select
import org.jetbrains.compose.web.css.LineStyle
import org.jetbrains.compose.web.css.ms
import org.jetbrains.compose.web.css.px

val InputStyle by ComponentStyle {
    base {
        Modifier
            .border(
                width = 0.px,
                style = LineStyle.Solid,
                color = Theme.LightGray.rgb
            )
            .fontSize(18.px)
            .padding(20.px)
            .borderRadius(50.px)
            .transition(CSSTransition(property = "border", duration = 200.ms))
    }
    focus {
        Modifier.border(
            width = 0.px,
            style = LineStyle.Solid,
            color = Theme.LightGray.rgb
        )
    }
    hover {
        Modifier.border(
            width = 0.px,
            style = LineStyle.Solid,
            color = Theme.Primary.rgb
        )
    }

}