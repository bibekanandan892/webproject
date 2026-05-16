package com.bibek.webproject.sections

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import com.bibek.webproject.components.SectionTitle
import com.bibek.webproject.models.LookingFor
import com.bibek.webproject.models.Section
import com.bibek.webproject.models.Theme
import com.bibek.webproject.styles.GlassButtonStyle
import com.bibek.webproject.styles.GlassCardStyle
import com.bibek.webproject.utils.Constants.FONT_FAMILY
import com.bibek.webproject.utils.Constants.SECTION_WIDTH
import com.varabyte.kobweb.compose.css.FontWeight
import com.varabyte.kobweb.compose.css.TextDecorationLine
import com.varabyte.kobweb.compose.foundation.layout.Arrangement
import com.varabyte.kobweb.compose.foundation.layout.Box
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.foundation.layout.Row
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
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
fun LookingForSection() {
    Box(
        modifier = Modifier
            .id(Section.LookingFor.id)
            .maxWidth(SECTION_WIDTH.px)
            .padding(topBottom = 100.px),
        contentAlignment = Alignment.Center
    ) {
        LookingForContent()
    }
}

@Composable
private fun LookingForContent() {
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
            section = Section.LookingFor
        )

        Box(
            modifier = GlassCardStyle.toModifier()
                .fillMaxWidth(if (breakpoint >= Breakpoint.MD) 80.percent else 95.percent)
                .padding(all = if (breakpoint >= Breakpoint.MD) 40.px else 24.px)
        ) {
            Column(modifier = Modifier.fillMaxWidth()) {
                P(
                    attrs = Modifier
                        .margin(top = 0.px, bottom = 12.px)
                        .fontFamily(FONT_FAMILY)
                        .fontSize(if (breakpoint >= Breakpoint.MD) 24.px else 20.px)
                        .fontWeight(FontWeight.Bold)
                        .color(Theme.TextPrimary.rgb)
                        .toAttrs()
                ) { Text(LookingFor.headline) }

                P(
                    attrs = Modifier
                        .margin(top = 0.px, bottom = 32.px)
                        .fontFamily(FONT_FAMILY)
                        .fontSize(15.px)
                        .lineHeight(1.7)
                        .color(Theme.TextMuted.rgb)
                        .toAttrs()
                ) { Text(LookingFor.pitch) }

                if (breakpoint >= Breakpoint.MD) {
                    Row(
                        modifier = Modifier.fillMaxWidth().margin(bottom = 32.px),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        InfoColumn(title = "Role I want", items = LookingFor.role)
                        InfoColumn(title = "Domains I love", items = LookingFor.domains)
                        ContactsColumn()
                    }
                } else {
                    Column(modifier = Modifier.fillMaxWidth().margin(bottom = 24.px)) {
                        InfoColumn(title = "Role I want", items = LookingFor.role)
                        InfoColumn(title = "Domains I love", items = LookingFor.domains)
                        ContactsColumn()
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Link(
                        modifier = GlassButtonStyle.toModifier()
                            .fontFamily(FONT_FAMILY)
                            .fontSize(15.px)
                            .fontWeight(FontWeight.Medium)
                            .textDecorationLine(TextDecorationLine.None),
                        path = LookingFor.contacts.first().href,
                        text = "Get in touch"
                    )
                }
            }
        }
    }
}

@Composable
private fun InfoColumn(title: String, items: List<String>) {
    Column(
        modifier = Modifier
            .fillMaxWidth(33.percent)
            .padding(right = 16.px, bottom = 16.px)
    ) {
        P(
            attrs = Modifier
                .margin(top = 0.px, bottom = 12.px)
                .fontFamily(FONT_FAMILY)
                .fontSize(13.px)
                .fontWeight(FontWeight.Bold)
                .color(Theme.Accent.rgb)
                .toAttrs()
        ) { Text(title.uppercase()) }
        items.forEach { line ->
            P(
                attrs = Modifier
                    .margin(top = 0.px, bottom = 8.px)
                    .fontFamily(FONT_FAMILY)
                    .fontSize(14.px)
                    .color(Theme.TextPrimary.rgb)
                    .toAttrs()
            ) { Text(line) }
        }
    }
}

@Composable
private fun ContactsColumn() {
    Column(
        modifier = Modifier
            .fillMaxWidth(33.percent)
            .padding(bottom = 16.px)
    ) {
        P(
            attrs = Modifier
                .margin(top = 0.px, bottom = 12.px)
                .fontFamily(FONT_FAMILY)
                .fontSize(13.px)
                .fontWeight(FontWeight.Bold)
                .color(Theme.Accent.rgb)
                .toAttrs()
        ) { Text("HOW TO REACH ME") }
        LookingFor.contacts.forEach { contact ->
            Link(
                modifier = Modifier
                    .margin(bottom = 8.px)
                    .fontFamily(FONT_FAMILY)
                    .fontSize(14.px)
                    .color(Theme.TextPrimary.rgb)
                    .textDecorationLine(TextDecorationLine.None),
                path = contact.href,
                text = contact.label
            )
        }
    }
}
