package com.bibek.webproject.styles

import com.bibek.webproject.models.Glass
import com.bibek.webproject.models.Theme
import com.varabyte.kobweb.compose.css.CSSTransition
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.graphics.Colors
import com.varabyte.kobweb.compose.ui.modifiers.backgroundColor
import com.varabyte.kobweb.compose.ui.modifiers.borderRadius
import com.varabyte.kobweb.compose.ui.modifiers.color
import com.varabyte.kobweb.compose.ui.modifiers.transition
import com.varabyte.kobweb.compose.ui.styleModifier
import com.varabyte.kobweb.silk.components.style.ComponentStyle
import com.varabyte.kobweb.silk.components.style.hover
import org.jetbrains.compose.web.css.ms
import org.jetbrains.compose.web.css.px

val ServiceCardStyle by ComponentStyle {
    base {
        Modifier
            .borderRadius(20.px)
            .styleModifier {
                property("background-color", Glass.White)
                property("backdrop-filter", Glass.Blur)
                property("-webkit-backdrop-filter", Glass.Blur)
                property("border", "1px solid ${Glass.Border}")
                property("box-shadow", "${Glass.Shadow}, ${Glass.InsetHighlight}")
            }
            .transition(CSSTransition(property = "all", duration = 250.ms))
    }
    hover {
        Modifier.styleModifier {
            property("background-color", Glass.AccentMuted)
            property("border", "1px solid rgba(125, 249, 255, 0.55)")
            property("transform", "translateY(-4px)")
        }
    }

    cssRule(" > #iconBox") {
        Modifier
            .backgroundColor(Colors.Transparent)
            .transition(CSSTransition(property = "background", duration = 200.ms))
    }

    cssRule(":hover > #iconBox") {
        Modifier.styleModifier {
            property("background-color", "rgba(125, 249, 255, 0.20)")
        }
    }

    cssRule(" > p") {
        Modifier
            .color(Theme.TextPrimary.rgb)
            .transition(CSSTransition(property = "color", duration = 200.ms))
    }

    cssRule(":hover > p") {
        Modifier.color(Theme.Accent.rgb)
    }
}