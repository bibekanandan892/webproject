import { Hero } from "@/components/hero";
import { Now } from "@/components/now";
import { Experience } from "@/components/experience";
import { Tech } from "@/components/tech";
import { Projects } from "@/components/projects";
import { Contact } from "@/components/contact";

export default function Home() {
  return (
    <>
      <Hero />
      <Now />
      <Experience />
      <Tech />
      <Projects />
      <Contact />
    </>
  );
}
