package com.bibek.webproject.styles

import com.bibek.webproject.models.Glass
import com.varabyte.kobweb.compose.css.CSSTransition
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.borderRadius
import com.varabyte.kobweb.compose.ui.modifiers.styleModifier
import com.varabyte.kobweb.compose.ui.modifiers.transition
import com.varabyte.kobweb.silk.components.style.ComponentStyle
import com.varabyte.kobweb.silk.components.style.hover
import org.jetbrains.compose.web.css.ms
import org.jetbrains.compose.web.css.px

val GlassCardStyle by ComponentStyle {
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
            property("background-color", Glass.WhiteHover)
            property("border", "1px solid ${Glass.BorderHover}")
        }
    }
}

val GlassNavStyle by ComponentStyle {
    base {
        Modifier
            .styleModifier {
                property("background-color", "rgba(11, 15, 26, 0.55)")
                property("backdrop-filter", Glass.NavBlur)
                property("-webkit-backdrop-filter", Glass.NavBlur)
                property("border-bottom", "1px solid ${Glass.Border}")
                property("position", "sticky")
                property("top", "0")
                property("z-index", "100")
            }
    }
}

val GlassChipStyle by ComponentStyle {
    base {
        Modifier
            .borderRadius(999.px)
            .styleModifier {
                property("background-color", Glass.ChipMuted)
                property("border", "1px solid rgba(167, 139, 250, 0.45)")
                property("padding", "4px 12px")
            }
    }
}

val GlassHoverLift by ComponentStyle {
    base {
        Modifier
            .styleModifier {
                property("transform", "translateY(0) scale(1)")
            }
            .transition(CSSTransition(property = "transform", duration = 250.ms))
    }
    hover {
        Modifier.styleModifier {
            property("transform", "translateY(-4px) scale(1.01)")
        }
    }
}

val GlassButtonStyle by ComponentStyle {
    base {
        Modifier
            .borderRadius(999.px)
            .styleModifier {
                property("background-color", Glass.AccentMuted)
                property("color", "#7DF9FF")
                property("border", "1px solid rgba(125, 249, 255, 0.45)")
                property("padding", "12px 24px")
                property("backdrop-filter", "blur(12px) saturate(180%)")
                property("-webkit-backdrop-filter", "blur(12px) saturate(180%)")
                property("cursor", "pointer")
            }
            .transition(CSSTransition(property = "all", duration = 200.ms))
    }
    hover {
        Modifier.styleModifier {
            property("background-color", "rgba(125, 249, 255, 0.30)")
            property("border", "1px solid rgba(125, 249, 255, 0.75)")
        }
    }
}
