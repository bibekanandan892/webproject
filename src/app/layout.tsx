import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
