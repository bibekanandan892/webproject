import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/social-icons";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">/</span> designed &amp; built in Next.js{" "}
          <span className="text-primary">·</span> static-exported{" "}
          <span className="text-primary">·</span> {year}
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/bibekanandan892"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <GithubIcon className="h-4 w-4" />
          </a>
          <a
            href="https://www.linkedin.com/in/bibekanandan892/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <LinkedinIcon className="h-4 w-4" />
          </a>
          <a
            href="mailto:bibekanandan892@gmail.com"
            aria-label="Email"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            <Mail className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
