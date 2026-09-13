import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Now } from "@/components/now";
import { Experience } from "@/components/experience";
import { Tech } from "@/components/tech";
import { Projects } from "@/components/projects";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Now />
        <Experience />
        <Tech />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
