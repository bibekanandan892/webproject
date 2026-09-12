import { SectionHeading } from "@/components/section-heading";
import { lookingFor } from "@/data/looking-for";
import { Mail, ArrowUpRight } from "lucide-react";

export function Contact() {
  const email = lookingFor.contacts.find((c) => c.label === "Email");
  const socials = lookingFor.contacts.filter((c) => c.label !== "Email");

  return (
    <section
      id="contact"
      className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32"
    >
      <SectionHeading
        index={6}
        label="contact"
        title="Let's talk"
      />

      <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">
        I&apos;m always up for a conversation about Android, applied AI, or a
        product worth building. The fastest way to reach me is email — I read
        everything and reply to anything that isn&apos;t spam.
      </p>

      {email && (
        <a
          href={email.href}
          className="group mx-auto mt-10 inline-flex max-w-full items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-5 py-3.5 font-mono text-sm text-primary transition-all hover:border-primary hover:bg-primary/20 sm:gap-3 sm:px-8 sm:py-4 sm:text-base"
        >
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate">{email.href.replace("mailto:", "")}</span>
          <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      )}

      <div className="mt-8 flex justify-center gap-6">
        {socials.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {c.label.toLowerCase()}
          </a>
        ))}
      </div>
    </section>
  );
}
