package com.bibek.webproject

import androidx.compose.runtime.*
import com.bibek.webproject.models.Theme
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.core.App
import com.varabyte.kobweb.silk.init.InitSilk
import com.varabyte.kobweb.silk.init.InitSilkContext
import com.varabyte.kobweb.silk.SilkApp
import com.varabyte.kobweb.silk.components.layout.Surface
import com.varabyte.kobweb.silk.components.style.common.SmoothColorStyle
import com.varabyte.kobweb.silk.components.style.toModifier

import org.jetbrains.compose.web.css.*

@InitSilk
fun updateTheme(ctx: InitSilkContext) {
    ctx.stylesheet.registerBaseStyle("html, body") {
        styleModifier {
            property("background", "radial-gradient(circle at 20% 0%, #14213D 0%, #0B0F1A 45%, #06080F 100%)")
            property("background-attachment", "fixed")
            property("color", Theme.TextPrimary.hex)
            property("margin", "0")
            property("min-height", "100vh")
        }
    }
}

@App
@Composable
fun MyApp(content: @Composable () -> Unit) {
    SilkApp {
        Surface(
            SmoothColorStyle.toModifier()
                .minHeight(100.vh)
                .styleModifier {
                    property("background", "transparent")
                }
        ) {
            content()
        }
    }
}
