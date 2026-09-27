// Server component: filters ZEN_SHOTS down to files that actually exist under
// public/ at build time, so the gallery never 404s and the build never
// breaks while screenshots are added incrementally. Renders nothing (not
// even the section) once every entry is filtered out.
import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { ZEN_SHOTS, type ZenShot } from "./zen-shots";

function shotExists(shot: ZenShot): boolean {
  return fs.existsSync(path.join(process.cwd(), "public", shot.src));
}

export function ZenShotsGallery() {
  const available = ZEN_SHOTS.filter(shotExists);
  if (available.length === 0) return null;

  const android = available.filter((s) => s.platform === "android");
  const windows = available.filter((s) => s.platform === "windows");

  return (
    <div className="mt-14 flex flex-col gap-10">
      {windows.length > 0 && (
        <ShotRow label="Zen for Windows" shots={windows} />
      )}
      {android.length > 0 && (
        <ShotRow label="Zen for Android" shots={android} />
      )}
    </div>
  );
}

function ShotRow({ label, shots }: { label: string; shots: ZenShot[] }) {
  // Phone shots are tall; fitting them into 16:9 tiles cropped away most of the screen.
  const isPhone = shots[0]?.platform === "android";
  return (
    <div>
      <p className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <div
        className={
          isPhone
            ? "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            : "mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {shots.map((shot) => (
          <figure
            key={shot.src}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <div
              className={`relative w-full bg-neutral-950 ${isPhone ? "aspect-[9/20]" : "aspect-video"}`}
            >
              <Image
                src={shot.src}
                alt={shot.alt}
                fill
                sizes={isPhone ? "(min-width: 1024px) 180px, (min-width: 640px) 30vw, 45vw" : "(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"}
                className="object-contain"
              />
            </div>
            <figcaption className="px-4 py-3 text-xs text-muted-foreground">
              {shot.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
