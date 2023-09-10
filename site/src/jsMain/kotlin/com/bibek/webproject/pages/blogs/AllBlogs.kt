package com.bibek.webproject.pages.blogs

import androidx.compose.runtime.Composable
import com.bibek.webproject.components.ServiceCard
import com.bibek.webproject.models.Blogs
import com.bibek.webproject.models.Section
import com.bibek.webproject.models.Technologys
import com.bibek.webproject.sections.BlogHeader
import com.bibek.webproject.sections.BlogItem
import com.bibek.webproject.sections.MainBackground
import com.bibek.webproject.sections.MainContent
import com.bibek.webproject.utils.Constants

import com.bibek.webproject.utils.Res
import com.varabyte.kobweb.compose.css.ObjectFit
import com.varabyte.kobweb.compose.foundation.layout.Arrangement
import com.varabyte.kobweb.compose.foundation.layout.Box
import com.varabyte.kobweb.compose.foundation.layout.Column
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.core.Page
import com.varabyte.kobweb.silk.components.graphics.Image
import com.varabyte.kobweb.silk.components.layout.SimpleGrid
import com.varabyte.kobweb.silk.components.layout.numColumns
import org.jetbrains.compose.web.css.percent
import org.jetbrains.compose.web.css.px

@Page
@Composable
fun AllBlogsPage() {
    Box(modifier = Modifier.fillMaxSize()) {

        Column(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.Top,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            BlogBanner()
            SimpleGrid(numColumns = numColumns(base = 1, sm = 2, md = 3, lg = 3, xl = 3)) {
                Blogs.forEach { blog ->
                    BlogItem(blog = blog)
                }
            }
        }

    }
}

@Composable
fun BlogBanner() {
    Box(
        modifier = Modifier
            .id(Section.Home.id)
            .maxWidth(Constants.SECTION_WIDTH.px)
            .maxHeight(500.px),
        contentAlignment = Alignment.TopCenter
    ) {
        MainBackground()
        BlogHeader()
    }
}