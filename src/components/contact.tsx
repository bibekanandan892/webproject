import { SectionHeading } from "@/components/section-heading";
import { lookingFor } from "@/data/looking-for";
import { Mail } from "lucide-react";
import { actionButtonVariants } from "@/components/ui/action-button";
import { cn } from "@/lib/utils";

export function Contact() {
  const email = lookingFor.contacts.find((c) => c.label === "Email");
  const socials = lookingFor.contacts.filter((c) => c.label !== "Email");

  return (
    <section
      id="contact"
      className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32"
    >
      <SectionHeading title="Let's talk" />

      <p className="mx-auto max-w-xl text-muted-foreground">
        I&apos;m always up for a conversation about Android, applied AI, or a
        product worth building. The fastest way to reach me is email — I read
        everything and reply to anything that isn&apos;t spam.
      </p>

      {email && (
        <a
          href={email.href}
          className={cn(
            actionButtonVariants({ tier: "primary" }),
            "mx-auto mt-10 max-w-full sm:px-8 sm:py-4",
          )}
        >
          <Mail className="h-4 w-4 shrink-0" />
          <span className="truncate font-mono">
            {email.href.replace("mailto:", "")}
          </span>
        </a>
      )}

      <div className="mt-8 flex justify-center gap-6">
        {socials.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {c.label}
          </a>
        ))}
      </div>
    </section>
  );
}
