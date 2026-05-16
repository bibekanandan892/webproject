package com.bibek.webproject.components

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import com.bibek.webproject.models.ExternalNav
import com.bibek.webproject.models.Glass
import com.bibek.webproject.models.NavSections
import com.bibek.webproject.models.Theme
import com.bibek.webproject.styles.LogoStyle
import com.bibek.webproject.styles.NavigationItemStyle
import com.bibek.webproject.utils.Constants.FONT_FAMILY
import com.bibek.webproject.utils.Res
import com.varabyte.kobweb.compose.css.FontWeight
import com.varabyte.kobweb.compose.css.TextDecorationLine
import com.varabyte.kobweb.compose.foundation.layout.Arrangement
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.foundation.layout.Row
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.compose.ui.styleModifier
import com.varabyte.kobweb.compose.ui.toAttrs
import com.varabyte.kobweb.silk.components.graphics.Image
import com.varabyte.kobweb.silk.components.icons.fa.FaBars
import com.varabyte.kobweb.silk.components.icons.fa.IconSize
import com.varabyte.kobweb.silk.components.navigation.Link
import com.varabyte.kobweb.silk.components.style.breakpoint.Breakpoint
import com.varabyte.kobweb.silk.components.style.toModifier
import com.varabyte.kobweb.silk.theme.breakpoint.rememberBreakpoint
import org.jetbrains.compose.web.css.percent
import org.jetbrains.compose.web.css.px
import org.jetbrains.compose.web.dom.P
import org.jetbrains.compose.web.dom.Text

@Composable
fun Header(onMenuClicked: () -> Unit) {
    val breakpoint by rememberBreakpoint()
    Row(
        modifier = Modifier
            .fillMaxWidth(if (breakpoint > Breakpoint.MD) 80.percent else 90.percent)
            .margin(topBottom = 50.px),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        LeftSide(
            breakpoint = breakpoint,
            onMenuClicked = onMenuClicked
        )
        if (breakpoint > Breakpoint.MD) {
            RightSide()
        }
    }
}

@Composable
fun LeftSide(
    breakpoint: Breakpoint,
    onMenuClicked: () -> Unit = {}
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        if (breakpoint <= Breakpoint.MD) {
            FaBars(
                modifier = Modifier
                    .margin(right = 15.px)
                    .onClick {
                        onMenuClicked()
                    },
                size = IconSize.XL
            )
        }
        if (breakpoint <= Breakpoint.MD) {
            Column() {
                TitleContent(breakpoint = breakpoint, firstTitle = "Software", secondTitle = "Engineer")
            }
        } else {
            TitleContent(breakpoint = breakpoint, firstTitle = "Software", secondTitle = "Engineer")
        }

    }
}

@Composable
fun RightSide() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .borderRadius(r = 50.px)
            .styleModifier {
                property("background-color", "rgba(255, 255, 255, 0.06)")
                property("backdrop-filter", Glass.NavBlur)
                property("-webkit-backdrop-filter", Glass.NavBlur)
                property("border", "1px solid ${Glass.Border}")
            }
            .padding(all = 20.px),
        horizontalArrangement = Arrangement.End
    ) {
        NavSections.forEach { section ->
            Link(
                modifier = NavigationItemStyle.toModifier()
                    .padding(right = 24.px)
                    .fontFamily(FONT_FAMILY)
                    .fontSize(16.px)
                    .fontWeight(FontWeight.Normal)
                    .textDecorationLine(TextDecorationLine.None),
                path = section.path,
                text = section.title
            )
        }
        Link(
            modifier = NavigationItemStyle.toModifier()
                .padding(right = 8.px)
                .fontFamily(FONT_FAMILY)
                .fontSize(16.px)
                .fontWeight(FontWeight.Bold)
                .color(Theme.Accent.rgb)
                .textDecorationLine(TextDecorationLine.None),
            path = ExternalNav.Blog.path,
            text = ExternalNav.Blog.title
        )
    }
}

@Composable
fun TitleContent(breakpoint: Breakpoint , firstTitle : String, secondTitle : String) {
    P(
        attrs = Modifier
            .margin(top = 0.px, bottom = 0.px)
            .fontFamily(FONT_FAMILY)
            .fontSize(
                if (breakpoint >= Breakpoint.LG) 35.px
                else if (breakpoint < Breakpoint.SM) 20.px
                else 26.px
            )
            .fontWeight(FontWeight.Bolder)
            .color(Theme.Primary.rgb)
            .toAttrs()
    ) {
        Text(firstTitle)
    }
    P(
        attrs = Modifier
            .margin(top = 0.px, bottom = 0.px, right = 0.px)
            .padding(right = 10.px)
            .fontFamily(FONT_FAMILY)
            .fontSize(
                if (breakpoint >= Breakpoint.LG) 35.px
                else if (breakpoint < Breakpoint.SM) 20.px
                else 26.px
            )
            .fontWeight(FontWeight.Bolder)
            .color(Theme.Secondary.rgb)
            .toAttrs()
    ) {
        Text(secondTitle)
    }
}