package com.bibek.webproject.sections

import androidx.compose.runtime.Composable
import com.bibek.webproject.models.Blog
import com.bibek.webproject.models.Technologys
import com.bibek.webproject.models.Theme
import com.bibek.webproject.styles.ServiceCardStyle
import com.bibek.webproject.utils.Constants
import com.varabyte.kobweb.compose.css.FontWeight
import com.varabyte.kobweb.compose.foundation.layout.Box
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.compose.ui.toAttrs
import com.varabyte.kobweb.core.rememberPageContext
import com.varabyte.kobweb.silk.components.graphics.Image
import com.varabyte.kobweb.silk.components.style.toModifier
import org.jetbrains.compose.web.css.LineStyle
import org.jetbrains.compose.web.css.px
import org.jetbrains.compose.web.dom.P
import org.jetbrains.compose.web.dom.Text

@Composable
fun BlogItem(blog: Blog) {
    val ctx = rememberPageContext()

    Column(
        modifier = ServiceCardStyle.toModifier()
            .maxWidth(500.px)
            .margin(all = 20.px)
            .padding(all = 20.px)
            .onClick {
                ctx.router.navigateTo("/blogs/blog")
            }
    ) {

        P(
            attrs = Modifier
                .fillMaxWidth()
                .margin(top = 0.px, bottom = 10.px)
                .fontFamily(Constants.FONT_FAMILY)
                .fontSize(18.px)
                .fontWeight(FontWeight.Bold)
                .toAttrs()
        ) {
            Text(blog.title)
        }
        P(
            attrs = Modifier
                .fillMaxWidth()
                .margin(top = 0.px, bottom = 0.px)
                .fontFamily(Constants.FONT_FAMILY)
                .fontSize(14.px)
                .fontWeight(FontWeight.Normal)
                .toAttrs()
        ) {
            Text(blog.desc)
        }
    }
}