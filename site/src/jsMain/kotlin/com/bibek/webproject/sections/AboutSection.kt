package com.bibek.webproject.sections
import androidx.compose.runtime.*
import com.bibek.webproject.components.SectionTitle
import com.bibek.webproject.components.SkillBar
import com.bibek.webproject.models.Section
import com.bibek.webproject.models.Code
import com.bibek.webproject.models.Theme
import com.bibek.webproject.styles.AboutImageStyle
import com.bibek.webproject.styles.AboutTextStyle
import com.bibek.webproject.utils.Constants.CODE_DES
import com.bibek.webproject.utils.Constants.FONT_FAMILY
import com.bibek.webproject.utils.Constants.LOREM_IPSUM_SHORT
import com.bibek.webproject.utils.Constants.SECTION_WIDTH
import com.bibek.webproject.utils.ObserveViewportEntered
import com.bibek.webproject.utils.Res
import com.bibek.webproject.utils.animateNumbers

import com.varabyte.kobweb.compose.css.FontStyle
import com.varabyte.kobweb.compose.css.FontWeight
import com.varabyte.kobweb.compose.foundation.layout.Arrangement
import com.varabyte.kobweb.compose.foundation.layout.Box
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.compose.ui.toAttrs
import com.varabyte.kobweb.silk.components.graphics.Image
import com.varabyte.kobweb.silk.components.layout.SimpleGrid
import com.varabyte.kobweb.silk.components.layout.numColumns
import com.varabyte.kobweb.silk.components.style.breakpoint.Breakpoint
import com.varabyte.kobweb.silk.components.style.toModifier
import com.varabyte.kobweb.silk.theme.breakpoint.rememberBreakpoint
import kotlinx.coroutines.launch
import org.jetbrains.compose.web.css.percent
import org.jetbrains.compose.web.css.px
import org.jetbrains.compose.web.dom.P
import org.jetbrains.compose.web.dom.Text

@Composable
fun AboutSection() {
    Box(
        modifier = Modifier
            .id(Section.Programming.id)
            .maxWidth(SECTION_WIDTH.px)
            .padding(topBottom = 150.px),
        contentAlignment = Alignment.Center
    ) {
        AboutContent()
    }
}

@Composable
fun AboutContent() {
    val breakpoint by rememberBreakpoint()
    Column(
        modifier = Modifier
            .fillMaxWidth(
                if (breakpoint >= Breakpoint.MD) 100.percent
                else 90.percent
            )
            .maxWidth(1200.px),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SimpleGrid(
            modifier = Modifier.fillMaxWidth(
                if (breakpoint >= Breakpoint.MD) 90.percent
                else 100.percent
            ),
            numColumns = numColumns(base = 1, md = 2)
        ) {
            if (breakpoint >= Breakpoint.MD) {
                AboutImage()
            }
            AboutMe()
        }
    }
}

@Composable
fun AboutImage() {
    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = Alignment.CenterStart
    ) {
        Image(
            modifier = AboutImageStyle.toModifier()
                .fillMaxWidth(80.percent),
            src = Res.Image.coding,
            desc = "About Image"
        )
    }
}

@Composable
fun AboutMe() {
    val scope = rememberCoroutineScope()
    var viewportEntered by remember { mutableStateOf(false) }
    val animatedPercentage = remember { mutableStateListOf(0, 0, 0, 0, 0) }

    ObserveViewportEntered(
        sectionId = Section.Programming.id,
        distanceFromTop = 300.0,
        onViewportEntered = {
            viewportEntered = true
            Code.values().forEach { skill ->
                scope.launch {
                    animateNumbers(
                        number = skill.percentage.value.toInt(),
                        onUpdate = {
                            animatedPercentage[skill.ordinal] = it
                        }
                    )
                }
            }
        }
    )

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.Center
    ) {
        SectionTitle(section = Section.Programming)
        P(
            attrs = Modifier
                .margin(topBottom = 25.px)
                .maxWidth(500.px)
                .fontFamily(FONT_FAMILY)
                .fontSize(18.px)
                .fontWeight(FontWeight.Normal)
                .fontStyle(FontStyle.Italic)
                .color(Theme.Secondary.rgb)
                .toAttrs()
        ) {
            Text(CODE_DES)
        }
        Code.values().forEach { skill ->
            SkillBar(
                title = skill.title,
                index = skill.ordinal,
                percentage = if (viewportEntered) skill.percentage else 0.percent,
                animatedPercentage = if (viewportEntered) animatedPercentage[skill.ordinal] else 0
            )
        }
    }
}