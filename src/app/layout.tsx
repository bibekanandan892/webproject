import type { Metadata } from "next";
import { Poppins, Lora } from "next/font/google";
import "./globals.css";

// Two faces, and only two. Poppins carries every piece of interface text —
// headings, nav, buttons, labels, the small stamped pills that used to be set
// in a mono — and Lora carries running prose. There is deliberately no third
// webfont: `--font-mono` in globals.css now points at the OS monospace stack,
// which serves `<code>` inside blog posts without adding a brand face.
//
// Poppins is not a variable font on Google Fonts, so the weights actually used
// across the site have to be listed explicitly — 400/500/600/700 covers
// font-normal, font-medium, font-semibold and font-bold, which is all of them.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Lora IS variable (400–700), so no weight list — which matters because the
// prose `strong` rule asks for 650, a weight a static face could only
// synthesise.
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
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
// lands on the paper-white theme regardless of the visitor's OS setting, and
// the site only goes dark once someone clicks the toggle in the blog header.
// The read is a plain `=== "dark"`, so any other stored value — "light",
// garbage, or nothing — falls through to the light default.
const THEME_BOOTSTRAP_SCRIPT = `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${lora.variable} h-full`}
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
