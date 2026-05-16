import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { projects, type Project } from "@/data/projects";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "@/components/social-icons";

export function Projects() {
  const featured = projects.find((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <SectionHeading
        index={5}
        label="projects"
        title="Things I've built"
        subtitle="Hand-picked. More on GitHub."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {featured && (
          <ProjectCard
            project={featured}
            className="md:col-span-2 lg:col-span-2 lg:row-span-2"
            featured
          />
        )}
        {rest.map((p) => (
          <ProjectCard key={p.title} project={p} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({
  project,
  className = "",
  featured = false,
}: {
  project: Project;
  className?: string;
  featured?: boolean;
}) {
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 ${className}`}
    >
      <div
        className={`relative overflow-hidden bg-secondary ${
          featured ? "aspect-[16/10]" : "aspect-[16/9]"
        }`}
      >
        <Image
          src={project.cover}
          alt={`${project.title} cover`}
          fill
          sizes={
            featured
              ? "(min-width: 1024px) 66vw, 100vw"
              : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          }
          className="object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent opacity-90 transition-opacity group-hover:opacity-70" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <h3
            className={`font-semibold text-foreground transition-colors group-hover:text-primary ${
              featured ? "text-2xl" : "text-lg"
            }`}
          >
            {project.title}
          </h3>
          <div className="flex shrink-0 items-center gap-2">
            {project.links.github && (
              <Link
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} source`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <GithubIcon className="h-4 w-4" />
              </Link>
            )}
            {project.links.demo && (
              <Link
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} live demo`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-border bg-secondary/40 px-2 py-1 font-mono text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
