import com.varabyte.kobweb.gradle.application.util.configAsKobwebApplication

plugins {
    alias(libs.plugins.kotlin.multiplatform)
    alias(libs.plugins.jetbrains.compose)
    alias(libs.plugins.kobweb.application)
//    alias(libs.plugins.kobwebx.markdown)
}

group = "com.bibek.webproject"
version = "1.0-SNAPSHOT"

kobweb {
    app {
        index {
            description.set("Powered by Bibek")
        }
    }
}

kotlin {
    configAsKobwebApplication("webproject",
//        includeServer = true
    )
//    jvmToolchain(11) // Kobweb server should use at least Java 11

    @Suppress("UNUSED_VARIABLE") // Suppress spurious warnings about sourceset variables not being used
    sourceSets {
        val commonMain by getting {
            dependencies {
                implementation(compose.runtime)
            }
        }
        val jsMain by getting {
            dependencies {
                implementation(compose.html.core)
                implementation(libs.kobweb.core)
                implementation(libs.kobweb.silk.core)
                implementation(libs.kobweb.silk.icons.fa)
//                implementation(libs.kobwebx.markdown)
             }
        }
//        val jvmMain by getting {
//            dependencies {
//                implementation(libs.kobweb.api)
//             }
//        }
    }
}