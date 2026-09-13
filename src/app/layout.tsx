import type { Metadata } from "next";
import { Archivo, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://bibekananda.in"),
  title: {
    default: "Bibekananda Nayak — Software Engineer",
    template: "%s · Bibekananda Nayak",
  },
  description:
    "Android, Kotlin Multiplatform, and applied AI engineer. Currently building consumer apps at scale and shipping autonomous agents on the side.",
  authors: [{ name: "Bibekananda Nayak" }],
  creator: "Bibekananda Nayak",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://bibekananda.in",
    title: "Bibekananda Nayak — Software Engineer",
    description:
      "Android, Kotlin Multiplatform, and applied AI engineer. Building at scale.",
    siteName: "Bibekananda Nayak",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bibekananda Nayak — Software Engineer",
    description: "Android, Kotlin Multiplatform, and applied AI engineer.",
  },
  icons: { icon: "/favicon.ico" },
};

// Reads the visitor's saved choice and flips to the dark theme before the
// browser paints anything, so there is no flash of the light theme for a
// returning dark-mode visitor. Placed inside an explicit <head> — a literal
// synchronous <script> there runs while the browser is still parsing <head>,
// before any <body> content is parsed or painted, which is what actually
// beats first paint; layout.md's "don't manually add <head>" warning is
// specifically about <title>/<meta> fighting the Metadata API, not about
// this. Two placements were tried and rejected first: a <script> as a direct
// child of <html> (a sibling of <body>) throws a hydration error on this
// Next.js version — React 19's script hoisting won't accept a <script>
// positioned between <html> and <body>; and next/script's
// strategy="beforeInteractive" avoids that error but, in this static export,
// serializes to a `__next_s` push near the end of <body> rather than a
// literal <head> script, which runs too late to prevent the flash it exists
// to prevent.
//
// Deliberately does NOT check `prefers-color-scheme`: first visit always
// lands in the light theme regardless of the visitor's OS setting, and the
// site only goes dark once someone clicks the toggle in the blog header.
const THEME_BOOTSTRAP_SCRIPT = `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          id="theme-bootstrap"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
      </head>
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
