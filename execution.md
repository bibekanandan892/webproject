# Execution plan — retheme bibekananda.in to "Blue Ink" + Lamp Black dark mode

**Status:** approved, not started
**Repo:** `C:\Users\bibek\Claude project\bipper\webproject`
**Target model for execution:** Sonnet

---

## 1. What we are building

Replace the current `terminal-dark` look (navy `#0A0F1C` + mint `#64FFDA` + mono
everywhere) with a two-theme system:

| Theme | Name | Role |
|---|---|---|
| **D** | Blue Ink | Light. The default, everywhere, always. |
| **B** | Lamp Black | Dark. Opt-in only, via a button on the blog. |

Three decisions were made up front and are **not** open for re-litigation
during execution:

1. **The six-variant system is retired.** Delete it, along with `/vote`,
   `/preview`, and Supabase. The homepage renders one theme as static HTML.
2. **The dark-mode button lives in the blog header, but the preference is
   site-wide.** Saved to `localStorage`, honoured on the homepage too (which
   has no button of its own).
3. **First visit is always Blue Ink.** Do **not** add a
   `@media (prefers-color-scheme: dark)` block. A visitor on a dark-mode laptop
   still gets Blue Ink until they click the button. This is deliberate.

### Reference

Approved mockups: <https://claude.ai/code/artifact/8bb96fa4-f3c9-43be-91c3-2966513698b4>
Artboard **D** is the light target. Artboard **B** is the dark target.

---

## 2. Design tokens

These are the source of truth. Every colour below comes from the approved
mockups — do not improvise new values.

### D · Blue Ink (light, default)

| Token | Value | Use |
|---|---|---|
| `--background` | `#FCFBF8` | page ground, cool paper |
| `--surface` | `#F2F1EC` | cards, code block ground |
| `--foreground` | `#16181D` | headings, primary text |
| `--body-ink` | `#33373F` | long-form body copy |
| `--muted-foreground` | `#5C626D` | secondary text |
| `--faint` | `#9CA2AD` | dates, eyebrows, hairline labels |
| `--border` | `#E0E1DD` | rules and hairlines |
| `--primary` | `#23406B` | **the only saturated colour** |
| `--primary-foreground` | `#FCFBF8` | text on primary |
| `--radius` | `0.3125rem` | 5px |

### B · Lamp Black (dark, opt-in)

| Token | Value | Use |
|---|---|---|
| `--background` | `#1A1714` | warm brown-black, **not** blue-black |
| `--surface` | `#252019` | cards, code block ground |
| `--foreground` | `#F0EBE1` | headings, primary text |
| `--body-ink` | `#CFC8BB` | long-form body copy |
| `--muted-foreground` | `#9C948A` | secondary text |
| `--faint` | `#6F6961` | dates, eyebrows |
| `--border` | `#322D28` | rules and hairlines |
| `--primary` | `#C8A45C` | sand accent |
| `--primary-foreground` | `#1A1714` | text on primary |

### Type

| Role | Face | Notes |
|---|---|---|
| Display / UI / nav / buttons | **Archivo** | 500–700 |
| Body copy and prose | **Source Serif 4** | 17px, line-height 1.58 |
| Dates, code | **JetBrains Mono** | only where it encodes something |

**The accent appears in exactly two places on any screen: the primary button
and links.** Eyebrow labels use `--faint`, not `--primary`. If a third use of
`--primary` appears, that is a bug.

---

## 3. Phases

Work in order. Each phase ends green (`pnpm build` passes) before the next
begins. Commit per phase.

### Phase 0 — Branch

```bash
cd "C:/Users/bibek/Claude project/bipper/webproject"
git checkout master && git pull
git checkout -b retheme/blue-ink
pnpm build   # confirm a clean baseline BEFORE changing anything
```

If the baseline build fails, stop and report — do not start editing on top of a
broken build.

---

### Phase 1 — Tokens in `src/app/globals.css`

This is the largest single edit. The file is currently ~600 lines, most of it
per-variant palettes that are about to become dead.

1. **Delete** every `[data-variant="..."]` block: `terminal-dark`,
   `kobweb-classic`, `bento-ios`, `editorial-serif`, `liquid-glass`,
   `spatial-3d`, plus their scoped keyframes and utilities (`.glass-*`,
   `.drift-*`, `.r3f-*`, `.float-y`, `.text-shimmer`, `.fade-up`).
2. **Replace** the `:root` block with the D palette from §2.
3. **Add** a `[data-theme="dark"]` block with the B palette. No media query.
4. In `@theme inline`, add mappings for the new tokens:
   ```css
   --color-surface: var(--surface);
   --color-faint: var(--faint);
   --color-body-ink: var(--body-ink);
   --font-serif: var(--font-source-serif), Georgia, serif;
   ```
5. Set `color-scheme` per theme so native scrollbars and form controls follow:
   ```css
   :root { color-scheme: light; }
   [data-theme="dark"] { color-scheme: dark; }
   ```
6. Update `::selection` — it currently hardcodes `rgba(100, 255, 218, 0.25)`
   (mint). Use `color-mix(in srgb, var(--primary) 22%, transparent)`.
7. In `.prose-post`, set the body face to serif:
   ```css
   .prose-post { font-family: var(--font-serif); font-size: 1.0625rem; line-height: 1.58; }
   ```
   Leave the rest of `.prose-post` alone — it already reads from tokens, so it
   follows both themes for free. Change `--font-geist-mono` references to
   `--font-jetbrains-mono`.

**Keep:** the `@theme inline` block structure, the `prefers-reduced-motion`
block, and all of `.prose-post`'s structural rules.

---

### Phase 2 — Fonts and the no-flash script (`src/app/layout.tsx`)

1. Replace the five font imports with three:
   ```ts
   import { Archivo, Source_Serif_4, JetBrains_Mono } from "next/font/google";

   const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
   const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"] });
   const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"] });
   ```
   Geist, Geist_Mono, Inter, Roboto and Fraunces all go. Update the `className`
   on `<html>` accordingly, and update `--font-sans` / `--font-mono` in
   `globals.css` to point at the new variables.

2. Add the theme bootstrap as the **first child of `<html>`**, before `<body>`.
   It must be a plain inline `<script>` so it runs render-blocking, before
   first paint — `next/script` will not work here.

   ```tsx
   <html lang="en" suppressHydrationWarning className={...}>
     <script
       dangerouslySetInnerHTML={{
         __html: `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}`,
       }}
     />
     <body className="min-h-full">{children}</body>
   </html>
   ```

   Note there is no `prefers-color-scheme` check — that is the "always start in
   D" decision, not an oversight.

3. `suppressHydrationWarning` on `<html>` is required, because the script
   mutates the element before React hydrates.

---

### Phase 3 — Delete the variant system

```
src/variants/                 entire directory
src/app/vote/
src/app/preview/
src/components/vote/
src/components/spotlight.tsx  cursor-glow, not in the new design
src/lib/main-variant.ts
src/lib/votes.ts
src/lib/supabase.ts
supabase/                     SQL for the votes table
scripts/snap-thumbnails.ts    only shot variant thumbnails
public/thumbs/                variant thumbnails
```

Then:

- `grep -rn "/vote\|/preview\|VariantHost\|registry\|supabase" src/` and remove
  every remaining reference, including any nav link to `/vote`.
- Remove from `package.json`: `@supabase/supabase-js`, `three`,
  `@react-three/fiber`, `@react-three/drei`, `@types/three`. These were verified
  to be used **only** by the deleted variants.
- `motion` appears unused once `spotlight.tsx` goes — confirm with
  `grep -rn "from \"motion\"" src/` before removing it.
- `pnpm install` to prune the lockfile.

**Keep** `src/components/ui/*` (badge, button, card, separator) — they use
`@base-ui` and `class-variance-authority` and are still referenced by the blog.

---

### Phase 4 — Homepage becomes static

`src/app/page.tsx` currently mounts `VariantHost`, then fetches the live variant
from Supabase in a `useEffect`. That is what causes the flash of the wrong theme
on load. Replace the whole file with a server component holding what
`terminal-dark/Variant.tsx` used to render:

```tsx
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
```

No `"use client"`, no `useEffect`, no `data-variant` wrapper.

---

### Phase 5 — De-robot the shared components

**This phase is the actual redesign.** Swapping hex values alone will not fix
the "AI-generated" read — the mono flourishes and lowercase labels are half the
problem. Work against artboard D in the mockup.

Rules that apply to every component:

- **Mono only where it encodes something.** Dates and code keep JetBrains Mono.
  Everything else moves to Archivo. `grep -rn "font-mono" src/` — there are
  ~30 uses across 17 files, and most should go.
- **Sentence case with real punctuation.** "Get in touch", not
  `get in touch →`. "View my work", not `view my work`.
- **No `::`, no `$`, no `00 /`, no `01.` numbering** unless the sequence is
  real information.
- Body copy gets `font-serif` and a measure capped near 58–65 characters.

Per file:

| File | Change |
|---|---|
| `section-heading.tsx` | Drop the `:: 00 / label` mono eyebrow → uppercase Archivo label in `--faint`, letter-spacing `.13em`. Replace the gradient rule with a plain 1px `--border` hairline. Consider dropping the `index` prop entirely. |
| `hero.tsx` | Drop the `:: 00 / hi, my name is` eyebrow → `Software Engineer · Bengaluru`. Promote "I build for phones, agents, and the web." to the `h1` (as in the mockup) with the name as a smaller line or in the nav. Buttons become solid `--primary` + bordered ghost, Archivo, sentence case. Remove `<Spotlight />` and the `blur-3xl` glow behind the portrait. Lede gets `font-serif`, 17px. **Keep the 5-click photo easter egg exactly as it is** — `usePhotoClickEgg()` and `src/lib/photo-egg.ts` both stay. Preserve the `onClick` and the `grayscale` → colour hover on the portrait when restyling. |
| `nav.tsx` | `bn.` mono wordmark → "Bibekananda Nayak" in Archivo 600. Drop the `01.` `02.` link numbering. Sentence-case the links (Now, Experience, Projects, Contact). Blog button loses its mono. |
| `now.tsx`, `tech.tsx`, `projects.tsx`, `experience.tsx`, `contact.tsx`, `looking-for.tsx`, `footer.tsx` | Same treatment: mono out, sentence case, serif for descriptive paragraphs. `looking-for.tsx` has 5 mono uses — the heaviest. |
| `blog/post-card.tsx`, `post-list.tsx`, `post-meta-row.tsx`, `table-of-contents.tsx` | Mono survives on dates only. Summaries get serif. |

---

### Phase 6 — The dark-mode toggle

**New file — `src/components/theme-toggle.tsx`:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) root.setAttribute("data-theme", "dark");
    else root.removeAttribute("data-theme");
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
    >
      {/* Fixed 16px box either way, so nothing shifts before mount. */}
      {mounted ? (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <span className="h-4 w-4" />}
    </button>
  );
}
```

Notes that matter:

- The icon renders only after mount. The server-rendered HTML cannot know the
  visitor's saved theme, so rendering an icon immediately would be a hydration
  mismatch. The empty `h-4 w-4` span holds the box so there is no layout shift.
- Writing `"light"` explicitly (rather than clearing the key) means a visitor
  who deliberately chooses light keeps it. Reading is still
  `=== "dark"`, so any other value falls back to D.

**Placement:** the header row on `src/app/blog/page.tsx` and
`src/app/blog/[slug]/page.tsx`. Both are server components, which is fine — the
toggle is a client island. Do **not** add it to `nav.tsx`; the homepage has no
button by design, it just obeys the saved choice.

---

### Phase 7 — Code blocks need both themes

`src/lib/blog/markdown.ts:16` hardcodes `SHIKI_THEME = "github-dark-default"`.
Highlighting happens at build time and is baked into static HTML, so a single
theme cannot follow a runtime toggle. Switch to dual themes:

```ts
.use(rehypePrettyCode, {
  themes: { light: "github-light", dark: "github-dark-default" },
  keepBackground: false,
})
```

This emits `--shiki-light` / `--shiki-dark` CSS variables on each span instead
of fixed colours. Then in `globals.css`:

```css
.prose-post pre code span { color: var(--shiki-light); }
[data-theme="dark"] .prose-post pre code span { color: var(--shiki-dark); }
```

Keep `keepBackground: false` — the block's ground stays `--surface`, so it
follows the theme already.

All 121 posts re-render on the next `pnpm build`; no content edits needed.

---

### Phase 8 — The 121 cover SVGs

**Do not skip this.** Every post has a cover SVG in `public/blog/<slug>.svg`,
and all 121 hardcode the old palette. They are loaded through `<img>`, so they
are isolated documents that site CSS variables cannot reach. Left alone, every
blog card will show a mint-on-navy thumbnail against cool paper.

Bulk replace across `public/blog/*.svg`:

| Old | New | Was |
|---|---|---|
| `#0F1626` | `#F2F1EC` | ground |
| `#64FFDA` | `#23406B` | accent |
| `#8B98A9` | `#5C626D` | muted |

```bash
cd "C:/Users/bibek/Claude project/bipper/webproject"
sed -i 's/#0F1626/#F2F1EC/g; s/#64FFDA/#23406B/g; s/#8B98A9/#5C626D/g' public/blog/*.svg
grep -rl "64FFDA\|0F1626\|8B98A9" public/blog/*.svg | wc -l   # must print 0
```

Check three or four rendered covers by eye afterwards — a few may use those hexes
at low opacity where the new value reads differently.

These become light cards on both themes, which is correct: a cover image sitting
light against a dark page is normal and does not need to invert.

---

### Phase 9 — Documentation

Both of these describe the world we are deleting and will actively mislead the
next session if left stale.

1. **`README.md`** — rewrite the Overview, Routes, Project layout and Deploy
   sections. Remove the variant table, the voting flow, the Supabase setup, and
   the thumbnail-regeneration section. Update the fonts line (currently says
   "loads all 5 fonts"). Update the cover-SVG palette convention in the blog
   section to the Phase 8 values.
2. **`C:\Users\bibek\.claude\skills\publish-blog\SKILL.md`** — it instructs
   future posts to draw covers with `#0F1626` / `#64FFDA` / `#8B98A9`. Update to
   the new palette or every new post reintroduces the old one.

---

### Phase 10 — Build, verify, deploy

```bash
pnpm build
```

Verify before deploying:

- [ ] Homepage renders Blue Ink with **no flash** of another theme on load
- [ ] `/blog` shows the toggle; clicking it flips to Lamp Black
- [ ] Reload while dark → still dark, **no white flash** before paint
- [ ] Navigate to `/` while dark → homepage is dark too, with no button
- [ ] Open a post → code blocks readable in **both** themes
- [ ] Blog cards show recoloured covers, no mint
- [ ] A fresh browser profile with OS set to dark → lands in **Blue Ink**
- [ ] `grep -rn "64FFDA\|0A0F1C\|data-variant" src/ public/` returns nothing
- [ ] `grep -rn "font-mono" src/` — every survivor is a date or code

Then follow the existing deploy flow from `README.md` — **Render builds the
`deploy` branch, not `master`**, and serves a committed `out/`:

```bash
git checkout master
git merge retheme/blue-ink
git push origin master

git checkout deploy
git merge master -m "merge: bring master's latest source (blue-ink retheme) into deploy"
pnpm build
git add -f out/
git commit -m "deploy: rebuild with blue-ink retheme"
git push origin deploy
```

Afterwards, the three `NEXT_PUBLIC_SUPABASE_*` env vars can be removed from the
Render dashboard — nothing reads them any more.

---

## 4. Risks

| Risk | Mitigation |
|---|---|
| Flash of light theme for a returning dark-mode visitor | The Phase 2 script is render-blocking and runs before paint. Verify on a hard reload, not just a soft one. |
| Hydration mismatch on the toggle | Icon renders only after mount; `suppressHydrationWarning` on `<html>`. |
| The retheme reads "AI-generated" anyway | Phase 5 is the fix, not Phase 1. Palette alone will not do it — the mono flourishes and lowercase labels have to go. |
| 121 covers silently keep the old palette | Phase 8, with the `grep … | wc -l` check that must print 0. |
| Phase 3 deletes something the blog still uses | Run `pnpm build` immediately after Phase 3, before touching anything else. |
| Deploying to `master` and seeing no change | Render builds `deploy`. Follow Phase 10 exactly. |

## 5. Out of scope

- Rewriting blog post prose
- Changing blog information architecture, search, or category filtering
- New sections or content on the homepage
- Redrawing the in-post diagram SVGs (they are inline, so they inherit theme
  tokens already — only the `<img>`-loaded covers in `public/blog/` need Phase 8)
