package com.bibek.webproject.models

import org.jetbrains.compose.web.css.CSSColorValue
import org.jetbrains.compose.web.css.rgb

enum class Theme(
    val hex: String,
    val rgb: CSSColorValue
) {
    Base(hex = "#0B0F1A", rgb = rgb(r = 11, g = 15, b = 26)),
    BaseElevated(hex = "#111726", rgb = rgb(r = 17, g = 23, b = 38)),
    Accent(hex = "#7DF9FF", rgb = rgb(r = 125, g = 249, b = 255)),
    Chip(hex = "#A78BFA", rgb = rgb(r = 167, g = 139, b = 250)),
    TextPrimary(hex = "#EAEAF2", rgb = rgb(r = 234, g = 234, b = 242)),
    TextMuted(hex = "#9AA0B4", rgb = rgb(r = 154, g = 160, b = 180)),
    Danger(hex = "#FF6B6B", rgb = rgb(r = 255, g = 107, b = 107)),

    // Legacy aliases — kept so existing call sites keep compiling.
    // They now point at the Aurora Dark equivalents.
    Primary(hex = "#7DF9FF", rgb = rgb(r = 125, g = 249, b = 255)),
    Secondary(hex = "#EAEAF2", rgb = rgb(r = 234, g = 234, b = 242)),
    Gray(hex = "#9AA0B4", rgb = rgb(r = 154, g = 160, b = 180)),
    LightGray(hex = "#1A2236", rgb = rgb(r = 26, g = 34, b = 54)),
    LighterGray(hex = "#0B0F1A", rgb = rgb(r = 11, g = 15, b = 26))
}

object Glass {
    const val White = "rgba(255, 255, 255, 0.08)"
    const val WhiteHover = "rgba(255, 255, 255, 0.14)"
    const val Border = "rgba(255, 255, 255, 0.16)"
    const val BorderHover = "rgba(255, 255, 255, 0.28)"
    const val AccentMuted = "rgba(125, 249, 255, 0.18)"
    const val ChipMuted = "rgba(167, 139, 250, 0.18)"
    const val Shadow = "0 8px 32px rgba(0, 0, 0, 0.4)"
    const val InsetHighlight = "inset 0 1px 0 rgba(255, 255, 255, 0.10)"
    const val Blur = "blur(20px) saturate(180%)"
    const val NavBlur = "blur(24px) saturate(180%)"
}