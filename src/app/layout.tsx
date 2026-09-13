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

// Runs before first paint via a render-blocking inline script (next/script
// cannot do this — it always defers past hydration). Reads the visitor's
// saved choice and flips to Lamp Black before the browser paints anything,
// so there is no flash of Blue Ink for a returning dark-mode visitor.
//
// Deliberately does NOT check `prefers-color-scheme`: first visit is always
// Blue Ink regardless of the visitor's OS setting, and the site only goes
// dark once someone clicks the toggle in the blog header.
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
      <script
        id="theme-bootstrap"
        dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
      />
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
