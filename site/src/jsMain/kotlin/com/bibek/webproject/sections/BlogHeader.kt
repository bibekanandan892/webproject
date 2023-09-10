package com.bibek.webproject.sections

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import com.bibek.webproject.components.LeftSide
import com.bibek.webproject.components.RightSide
import com.bibek.webproject.components.TitleContent
import com.bibek.webproject.models.Section
import com.bibek.webproject.models.Theme
import com.bibek.webproject.styles.InputStyle
import com.bibek.webproject.styles.NavigationItemStyle
import com.bibek.webproject.utils.Constants
import com.varabyte.kobweb.compose.css.FontWeight
import com.varabyte.kobweb.compose.css.TextDecorationLine
import com.varabyte.kobweb.compose.foundation.layout.Arrangement
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.foundation.layout.Row
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.attrsModifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.compose.ui.toAttrs
import com.varabyte.kobweb.silk.components.icons.fa.FaBars
import com.varabyte.kobweb.silk.components.icons.fa.IconSize
import com.varabyte.kobweb.silk.components.navigation.Link
import com.varabyte.kobweb.silk.components.style.breakpoint.Breakpoint
import com.varabyte.kobweb.silk.components.style.toModifier
import com.varabyte.kobweb.silk.theme.breakpoint.rememberBreakpoint
import org.jetbrains.compose.web.attributes.InputType
import org.jetbrains.compose.web.css.percent
import org.jetbrains.compose.web.css.px
import org.jetbrains.compose.web.dom.Input
import org.jetbrains.compose.web.dom.P
import org.jetbrains.compose.web.dom.Text

@Composable
fun BlogHeader() {
    val breakpoint by rememberBreakpoint()
    Row(
        modifier = Modifier
            .fillMaxWidth(if (breakpoint > Breakpoint.MD) 85.percent else 90.percent)
            .margin(topBottom = 50.px),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Title(
            breakpoint = breakpoint,
        )
        SearchBox(breakpoint = breakpoint)
    }
}

@Composable
fun Title(
    breakpoint: Breakpoint,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        TitleContent(breakpoint = breakpoint, firstTitle = "My", secondTitle = "Blogs")
    }
}

@Composable
fun SearchBox(breakpoint: Breakpoint) {
    Row(
        modifier = Modifier
            .borderRadius(r = 50.px)
            .backgroundColor(Theme.LighterGray.rgb)
            .padding(all = 0.px),
        horizontalArrangement = Arrangement.End
    ) {
        Input(
            type = InputType.Text,
            attrs = InputStyle.toModifier()
                .id("inputName")
                .classNames("form-control")
                .width(
                    if (breakpoint >= Breakpoint.MD) 500.px
                    else 250.px
                )
                .backgroundColor(Theme.LighterGray.rgb)
                .boxShadow(0.px, 0.px, 0.px, 0.px, null)
                .attrsModifier {
                    attr("placeholder", "Search Here")
                    attr("name", "name")
                    attr("required", "true")

                }
                .toAttrs()
        )
    }
}
