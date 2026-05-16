package com.bibek.webproject.sections

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import com.bibek.webproject.components.SectionTitle
import com.bibek.webproject.models.CurrentWork
import com.bibek.webproject.models.CurrentWorkEntry
import com.bibek.webproject.models.Section
import com.bibek.webproject.models.Theme
import com.bibek.webproject.models.WorkStatus
import com.bibek.webproject.styles.GlassCardStyle
import com.bibek.webproject.styles.GlassChipStyle
import com.bibek.webproject.utils.Constants.FONT_FAMILY
import com.bibek.webproject.utils.Constants.SECTION_WIDTH
import com.varabyte.kobweb.compose.css.FontWeight
import com.varabyte.kobweb.compose.css.TextDecorationLine
import com.varabyte.kobweb.compose.foundation.layout.Arrangement
import com.varabyte.kobweb.compose.foundation.layout.Box
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.foundation.layout.Row
import com.varabyte.kobweb.compose.foundation.layout.Spacer
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.compose.ui.styleModifier
import com.varabyte.kobweb.compose.ui.toAttrs
import com.varabyte.kobweb.silk.components.navigation.Link
import com.varabyte.kobweb.silk.components.style.breakpoint.Breakpoint
import com.varabyte.kobweb.silk.components.style.toModifier
import com.varabyte.kobweb.silk.theme.breakpoint.rememberBreakpoint
import org.jetbrains.compose.web.css.percent
import org.jetbrains.compose.web.css.px
import org.jetbrains.compose.web.dom.P
import org.jetbrains.compose.web.dom.Text

@Composable
fun CurrentlyWorkingSection() {
    Box(
        modifier = Modifier
            .id(Section.Now.id)
            .maxWidth(SECTION_WIDTH.px)
            .padding(topBottom = 100.px),
        contentAlignment = Alignment.Center
    ) {
        CurrentlyWorkingContent()
    }
}

@Composable
private fun CurrentlyWorkingContent() {
    val breakpoint by rememberBreakpoint()
    Column(
        modifier = Modifier
            .fillMaxWidth(if (breakpoint >= Breakpoint.MD) 100.percent else 90.percent),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SectionTitle(
            modifier = Modifier
                .fillMaxWidth(if (breakpoint >= Breakpoint.MD) 60.percent else 90.percent)
                .margin(bottom = 40.px),
            section = Section.Now
        )

        val columns = when {
            breakpoint >= Breakpoint.LG -> 3
            breakpoint >= Breakpoint.MD -> 2
            else -> 1
        }

        val rows = CurrentWork.chunked(columns)
        rows.forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth().margin(bottom = 24.px),
                horizontalArrangement = Arrangement.Center
            ) {
                row.forEach { entry ->
                    Box(
                        modifier = Modifier
                            .fillMaxWidth((100 / columns).percent)
                            .padding(all = 12.px)
                    ) {
                        WorkCard(entry = entry)
                    }
                }
            }
        }
    }
}

@Composable
private fun WorkCard(entry: CurrentWorkEntry) {
    Column(
        modifier = GlassCardStyle.toModifier()
            .fillMaxWidth()
            .padding(all = 24.px)
            .minHeight(280.px)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            P(
                attrs = Modifier
                    .margin(top = 0.px, bottom = 0.px)
                    .fontFamily(FONT_FAMILY)
                    .fontSize(20.px)
                    .fontWeight(FontWeight.Bold)
                    .color(Theme.TextPrimary.rgb)
                    .toAttrs()
            ) { Text(entry.title) }
            Spacer()
            StatusBadge(status = entry.status)
        }

        P(
            attrs = Modifier
                .margin(top = 16.px, bottom = 16.px)
                .fontFamily(FONT_FAMILY)
                .fontSize(14.px)
                .lineHeight(1.6)
                .color(Theme.TextMuted.rgb)
                .toAttrs()
        ) { Text(entry.description) }

        Spacer()

        Row(
            modifier = Modifier.fillMaxWidth().margin(top = 12.px),
            verticalAlignment = Alignment.CenterVertically
        ) {
            entry.techStack.take(3).forEach { tech ->
                Box(
                    modifier = Modifier
                        .margin(right = 8.px)
                        .padding(leftRight = 10.px, topBottom = 4.px)
                        .borderRadius(999.px)
                        .styleModifier {
                            property("background-color", "rgba(125, 249, 255, 0.10)")
                            property("border", "1px solid rgba(125, 249, 255, 0.30)")
                        }
                ) {
                    P(
                        attrs = Modifier
                            .margin(topBottom = 0.px)
                            .fontFamily(FONT_FAMILY)
                            .fontSize(11.px)
                            .color(Theme.Accent.rgb)
                            .toAttrs()
                    ) { Text(tech) }
                }
            }
            Spacer()
            if (entry.link != null) {
                Link(
                    modifier = Modifier
                        .fontFamily(FONT_FAMILY)
                        .fontSize(13.px)
                        .fontWeight(FontWeight.Medium)
                        .color(Theme.Accent.rgb)
                        .textDecorationLine(TextDecorationLine.None),
                    path = entry.link,
                    text = "View ->"
                )
            }
        }
    }
}

@Composable
private fun StatusBadge(status: WorkStatus) {
    Box(
        modifier = GlassChipStyle.toModifier()
    ) {
        P(
            attrs = Modifier
                .margin(topBottom = 0.px)
                .fontFamily(FONT_FAMILY)
                .fontSize(11.px)
                .fontWeight(FontWeight.Medium)
                .color(Theme.Chip.rgb)
                .toAttrs()
        ) { Text(status.label) }
    }
}
