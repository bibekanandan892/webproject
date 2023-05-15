package com.bibek.webproject.sections

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import com.bibek.webproject.components.SectionTitle
import com.bibek.webproject.components.ServiceCard
import com.bibek.webproject.models.Section
import com.bibek.webproject.models.Technologys
import com.bibek.webproject.utils.Constants.SECTION_WIDTH

import com.varabyte.kobweb.compose.foundation.layout.Box
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.silk.components.layout.SimpleGrid
import com.varabyte.kobweb.silk.components.layout.numColumns
import com.varabyte.kobweb.silk.components.style.breakpoint.Breakpoint
import com.varabyte.kobweb.silk.theme.breakpoint.rememberBreakpoint
import org.jetbrains.compose.web.css.percent
import org.jetbrains.compose.web.css.px
@Composable
fun TechnologySection() {
    Box(
        modifier = Modifier
            .id(Section.Technology.id)
            .maxWidth(SECTION_WIDTH.px)
            .padding(topBottom = 100.px),
        contentAlignment = Alignment.Center
    ) {
        TechnologyContent()
    }
}


@Composable
fun TechnologyContent() {
    val breakpoint by rememberBreakpoint()
    Column(
        modifier = Modifier
            .fillMaxWidth(
                if (breakpoint >= Breakpoint.MD) 100.percent
                else 90.percent
            ),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        SectionTitle(
            modifier = Modifier
                .fillMaxWidth()
                .margin(bottom = 20.px),
            section = Section.Technology,
            alignment = Alignment.CenterHorizontally
        )
        SimpleGrid(numColumns = numColumns(base = 1, sm = 2, md = 3)) {
            Technologys.values().forEach { technology ->
                ServiceCard(technologys = technology)
            }
        }
    }
}