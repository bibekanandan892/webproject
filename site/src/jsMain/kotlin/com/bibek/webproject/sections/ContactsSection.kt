package com.bibek.webproject.sections
import androidx.compose.runtime.*
import com.bibek.webproject.components.ContactsCard
import com.bibek.webproject.models.Contacts
import com.bibek.webproject.models.Section
import com.bibek.webproject.models.Theme
import com.bibek.webproject.utils.Constants.SECTION_WIDTH
import com.varabyte.kobweb.compose.foundation.layout.Box
import com.varabyte.kobweb.compose.ui.Alignment
import com.varabyte.kobweb.compose.ui.Modifier
import com.varabyte.kobweb.compose.ui.modifiers.*
import com.varabyte.kobweb.silk.components.layout.SimpleGrid
import com.varabyte.kobweb.silk.components.layout.numColumns
import com.varabyte.kobweb.silk.components.style.breakpoint.Breakpoint
import com.varabyte.kobweb.silk.theme.breakpoint.rememberBreakpoint
import org.jetbrains.compose.web.css.px

@Composable
fun ContactsSection() {
    val breakpoint by rememberBreakpoint()
    Box(
        modifier = Modifier
            .id(Section.Contact.id)
            .fillMaxWidth()
            .maxWidth(SECTION_WIDTH.px)
            .padding(topBottom = 100.px)
            .backgroundColor(Theme.LighterGray.rgb),
        contentAlignment = Alignment.Center
    ) {
        ContactsContent(breakpoint = breakpoint)
    }
}

@Composable
fun ContactsContent(breakpoint: Breakpoint) {


    SimpleGrid(numColumns = numColumns(base = 1, md = 2, lg = 3)) {
        Contacts.values().forEach { achievement ->
            ContactsCard(
                modifier = Modifier.margin(
                    right = if (achievement == Contacts.Phone) 0.px
                    else {
                        if (breakpoint > Breakpoint.SM) 40.px else 0.px
                    },
                    bottom = if (breakpoint > Breakpoint.MD) 0.px else 40.px
                ),
                title =  achievement.title,
                contacts = achievement
            )
        }
    }
}