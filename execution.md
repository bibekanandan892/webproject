# Execution plan — retheme bibekananda.in to the anthropic.com homepage system

**Status:** Phases 0–4 done and committed. Phases 1–2 need revised values. Phases 5+ not started.
**Repo:** `C:\Users\bibek\Claude project\bipper\webproject`
**Branch:** `retheme/blue-ink` (name is now stale; the theme is Ivory, not Blue Ink)
**Reference:** <https://www.anthropic.com/> — every value below was read off the live site, not guessed.

---

## 0. What changed since the last version of this plan

The target moved from a made-up "Blue Ink" palette to the **actual anthropic.com
homepage system**. Structural work already committed is unaffected; only colour,
type roles, and component styling change.

| Phase | Status | Effect of the new target |
|---|---|---|
| 0 · branch + baseline | done | — |
| 1 · tokens | **committed, must be revised** | Palette values all change. Architecture (`:root` light, `[data-theme="dark"]` dark) is correct and stays. |
| 2 · fonts | **committed, roles must be revised** | Archivo / Source Serif 4 / JetBrains Mono are still the right three faces. But **serif becomes the body default**, not sans. |
| 3 · delete variants | done, unaffected | — |
| 4 · static homepage | done, unaffected | — |
| 5 · de-robot components | not started | Rewritten below against the real system. |
| 6 · dark toggle | not started | Mechanism unchanged; palette values change. |
| 7 · Shiki dual theme | not started | Unchanged. |
| 8 · 121 cover SVGs | not started | Replacement hexes change. |
| 9 · docs | not started | Unchanged. |
| 10 · build + deploy | not started | Unchanged. |

New work the previous plan did not contain: the **three-tier button system**,
the **hero cover animation**, and the **tinted card system**.

---

## 1. The design system, as measured

### 1.1 Neutrals

| Token | Hex | Anthropic's name | Use |
|---|---|---|---|
| `--background` | `#FAF9F5` | ivory-light | page ground |
| `--surface` | `#F0EEE6` | ivory-medium | section bands, secondary ground |
| `--surface-hover` | `#E8E6DC` | ivory-dark | hover fill |
| `--card` | `#FFFFFF` | white | raised card |
| `--foreground` | `#141413` | slate-dark | all primary text |
| `--ink-soft` | `#3D3D3A` | slate-medium | button hover fill |
| `--muted-foreground` | `#5E5D59` | slate-light | secondary text, link hover |
| `--faint` | `#B0AEA5` | cloud-medium (agate) | meta, eyebrows |
| `--line-soft` | `#D1CFC5` | cloud-light | hairlines |
| `--border` | `rgba(20,20,19,0.10)` | slate-faded-10 | default border |
| `--border-hover` | `rgba(20,20,19,0.20)` | slate-faded-20 | hovered border |

The system is **almost entirely achromatic warm**. Colour appears only in card
tints and the accent.

### 1.2 Accent

| Token | Hex | Use |
|---|---|---|
| `--accent` | `#D97757` | clay — the Anthropic accent |
| `--accent-deep` | `#C6613F` | pressed / deeper clay |
| selection | `rgba(204,120,92,0.5)` | `::selection` background |

Note: on the homepage the accent is **not** used for buttons or links. Buttons
are ink. Links are ink, hovering to `#5E5D59`. The clay shows up in selection
and brand moments only. Keep that discipline.

### 1.3 Card tints

Soft pastels used as full card fills — this is the "colour theme" on the
Latest releases row:

`oat #E3DACC` · `cactus #BCD1CA` · `sky #6A9BCC` · `heather #CBCADB`
`fig #C46686` · `coral #EBCECE` · `manilla #EBDBBC` · `kraft #D4A27F` · `olive #788C5D`

Latest releases uses **oat `#E3DACC`** on all three cards.

### 1.4 Dark theme

Read from the footer's `.u-theme-dark` class — this is Anthropic's own dark
mapping, so use it rather than inventing one:

| Token | Dark value |
|---|---|
| `--background` | `#141413` |
| `--surface` / `--card` | `#3D3D3A` |
| `--foreground` | `#FAF9F5` |
| `--faint` | `#B0AEA5` (unchanged from light) |
| `--border` | `rgba(250,249,245,0.10)` |
| `--border-hover` | `rgba(250,249,245,0.20)` |
| button primary bg / text | `#FAF9F5` / `#141413` (inverted) |
| button primary hover bg | `#F0EEE6` |
| button secondary border + text | `#FAF9F5` |
| button secondary hover | bg `#FAF9F5`, text `#141413` |

Still **no `prefers-color-scheme` block** — first visit is always light.

### 1.5 Type

Anthropic Sans / Serif / Mono are proprietary. The three faces already
installed in Phase 2 are the substitutes — keep them, change their roles.

| Role | Face | Spec |
|---|---|---|
| **Body copy — the default** | Source Serif 4 | 20px / lh 1.4 / 400 |
| Paragraph sizes | Source Serif 4 | xs 16px · s 18px · m 20px |
| Page h1 | Archivo | 700, `clamp(2.5rem, 1.6rem + 4.2vw, 3.8rem)`, lh 1.10 |
| Section h2 | Archivo | 600, 24px, lh 1.3 |
| Card h3 | Archivo | 600, 24px |
| Big display card | Source Serif 4 | **500**, `clamp(2.5rem, 1.5rem + 4.6vw, 4.25rem)` |
| Meta labels (date, category) | JetBrains Mono | 400, 16px, **no uppercase, no letter-spacing** |
| Buttons | Archivo | 400, 16px |
| Nav links | Source Serif 4 | 400, 16px |
| Global tracking | — | `-0.005em` |

Two things to notice, because they are the opposite of what the site does now:

- **Body text is serif and large** — 20px, not 16px.
- **Button and nav text is weight 400**, not 600. Nothing shouts.

### 1.6 Buttons — three tiers

All three: radius **8px**, padding **8px 16px**, Archivo **16px / 400**,
height 36px, `transition: border-color .2s, color .2s, background-color .2s`.

| Tier | Default | Hover |
|---|---|---|
| **primary** | bg `#141413`, border `#141413`, text `#FAF9F5` | bg + border `#3D3D3A` |
| **secondary** | transparent, border `#141413`, text `#141413` | bg `#141413`, text `#FAF9F5` — **inverts** |
| **tertiary** | transparent, border `rgba(20,20,19,.1)`, text `#141413` | border `#141413` |

The nav "Try Claude" button is primary with radius `8px 0 0 8px` because it is
the left half of a split button with a dropdown chevron. **Do not copy the
split** — there is no dropdown to attach. Use a plain 8px-radius primary.

### 1.7 Cards

Radius **16px**, `overflow: hidden`, padding **2rem**, tinted fill, no shadow,
no border. Three equal columns on desktop.

### 1.8 The cover animation

The hero CTA card, as measured:

```css
.cover {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 24px;
  background: #141413;        /* fallback before the canvas fades in */
}
.cover-canvas {
  position: absolute; inset: 0; z-index: -1;
  width: 100%; height: 100%;
  display: block; pointer-events: none;
  opacity: 0;
  transition: opacity .6s cubic-bezier(.22,.61,.36,1);
}
.cover-canvas.is-on { opacity: 1; }
```

And the scroll entrance, which is the part worth stealing:

```css
@media (prefers-reduced-motion: no-preference) {
  [data-scroll="section"]:not(.is-copy-shown) [data-scroll="title"],
  [data-scroll="section"]:not(.is-copy-shown) [data-scroll="subtitle"],
  [data-scroll="section"]:not(.is-copy-shown) [data-scroll="button"] {
    opacity: 0;
  }
}
```

Copy is hidden until an IntersectionObserver adds `.is-copy-shown`, then title,
subtitle and button fade and rise in sequence. The hide rule sits **inside**
`prefers-reduced-motion: no-preference`, so reduced-motion visitors get the
text immediately and never see a blank card. Reproduce that gating exactly.

**What not to copy:** the real card layers a WebGL2 canvas under an MP4 that
fades out to reveal it. There is no video asset here and `three` was removed in
Phase 3. Use a **plain 2D canvas** drifting-particle field — roughly 60 lines,
no dependency — or, if that proves fussy, a CSS-only animated radial-gradient.
The fade-in, the 24px radius, the `overflow: hidden` and the scroll entrance
are what carry the effect; the specific visual underneath matters less.

---

## 2. Phases

### Phase 1-revised — Repaint the tokens

Edit `src/app/globals.css`. The structure committed in `0649a7a` is correct;
only values change.

1. `:root` — replace the Blue Ink values with §1.1, §1.2.
2. `[data-theme="dark"]` — replace with §1.4.
3. Add the card tints from §1.3 as `--tint-oat`, `--tint-cactus`, … and map
   them in `@theme inline` so `bg-tint-oat` works.
4. Add `--accent` / `--accent-deep`; map as `--color-accent-clay`.
5. `--radius`: `0.5rem` (8px), and add `--radius-card: 1rem`, `--radius-cover: 1.5rem`.
6. `::selection` → `rgba(204,120,92,0.5)`.
7. `.prose-post` → `font-size: 1.25rem; line-height: 1.4;`.
8. In `@theme inline`, **`--font-sans` must stay Archivo** but add a base rule
   so body copy defaults to serif:
   ```css
   @layer base {
     html { @apply font-serif; }        /* was font-sans */
     h1, h2, h3, h4 { font-family: var(--font-sans); }
   }
   ```
   This is the single highest-leverage change in the whole plan.

### Phase 2-revised — Font roles

`layout.tsx` needs no import changes; the three faces are already correct.
Only the base-layer rule above changes, so this folds into Phase 1-revised.
Verify `--font-archivo`, `--font-source-serif`, `--font-jetbrains-mono` still
resolve after the edit.

### Phase 5 — Components

Same de-robot rules as before (mono only for dates and code, sentence case, no
`::`/`$`/`00 /`/`01.`), now with concrete targets.

**New shared component — `src/components/ui/action-button.tsx`:**
implement the three tiers from §1.6 with `cva`, which is already a dependency.
Replace every ad-hoc bordered/filled link across the site with it.

| File | Change |
|---|---|
| `section-heading.tsx` | Drop the `:: 00 / label` eyebrow → Archivo 600 24px h2, no eyebrow at all, or a mono meta label if one carries information. Replace the gradient rule with a 1px `--border` hairline, or drop it. |
| `hero.tsx` | Eyebrow → `Software Engineer · Bengaluru` in mono 16px `--faint`. h1 Archivo 700 fluid. Lede **serif 20px/1.4**. Buttons → primary + secondary from §1.6. Remove the `blur-3xl` glow. **Keep the 5-click photo egg** — `usePhotoClickEgg()` and `src/lib/photo-egg.ts` stay; preserve the `onClick` and the `grayscale` → colour hover. |
| `nav.tsx` | Height 68px, transparent. `bn.` → "Bibekananda Nayak" Archivo 600. Drop `01.` numbering. Links **serif 16px/400**. Blog link → tertiary button. |
| `now.tsx` | **Contains hardcoded `#64FFDA` / `#7DD3FC` / `#A78BFA` in `STATUS_STYLE` inline styles** — a CSS-variable swap will not catch these. Replace with tints from §1.3 (e.g. cactus / sky / heather at low opacity with ink text). |
| `projects.tsx` | Cards → §1.7: 16px radius, 2rem padding, tinted fill, no border, no shadow. This is the "Latest releases" treatment. |
| `tech.tsx`, `experience.tsx`, `contact.tsx`, `footer.tsx` | Mono out except dates. `contact.tsx`: remove `.toLowerCase()` on social labels — the data already reads "GitHub"/"LinkedIn". |
| `looking-for.tsx` | 5 mono uses, the heaviest. **Note: this component is exported but never rendered anywhere** — dead code that predates this work. Either wire it into `page.tsx` or delete it; don't restyle it blind. |
| `blog/post-card.tsx` | Card → §1.7. Summary serif. |
| `blog/post-list.tsx` | Filter buttons → tertiary tier. `"all"` → `"All"`, `"clear filters"` → `"Clear filters"`. Search input serif. |
| `blog/post-thumbnail.tsx` | **Hardcoded `#64FFDA` / `#F5A524` in `CATEGORY_TINT`** — same class of bug as `now.tsx`. Retint: AI → `#BCD1CA` cactus, Android → `#E3DACC` oat. |
| `blog/post-meta-row.tsx` | Already correct — mono on dates is the intended usage. Bump to 16px, drop uppercase. |
| `blog/table-of-contents.tsx` | `on this page` → `On this page`, mono → Archivo. |

### Phase 5b — The cover animation

New component `src/components/cover.tsx` (`"use client"`), implementing §1.8:

- a `<canvas>` with a 2D drifting-particle field, `opacity: 0` → `.is-on`
  after first paint, `transition: opacity .6s cubic-bezier(.22,.61,.36,1)`
- an `IntersectionObserver` that adds `.is-copy-shown` to stage title,
  subtitle and button
- the hide rule gated inside `@media (prefers-reduced-motion: no-preference)`
- `cancelAnimationFrame` on unmount, and skip the RAF loop entirely when
  `matchMedia("(prefers-reduced-motion: reduce)").matches`

Use it for the hero. Do not add a second one; one animated moment per page.

### Phase 6 — Dark toggle

Unchanged from the committed plan. `src/components/theme-toggle.tsx`, client
island, `localStorage` key `theme`, icon renders only after mount, placed in
the blog header on `/blog` and `/blog/[slug]`, preference applies site-wide,
homepage has no button. The bootstrap script in `layout.tsx` is already live.

### Phase 7 — Shiki dual themes

`src/lib/blog/markdown.ts:16` — replace `theme: "github-dark-default"` with:

```ts
themes: { light: "github-light", dark: "github-dark-default" },
```

The matching CSS is **already committed** in `globals.css`:

```css
.prose-post pre code span { color: var(--shiki-light); }
[data-theme="dark"] .prose-post pre code span { color: var(--shiki-dark); }
```

### Phase 8 — The 121 cover SVGs

All 121 posts have covers hardcoding the old palette; they are `<img>`-loaded
isolated documents, so no CSS variable reaches them.

| Old | New |
|---|---|
| `#0F1626` ground | `#F0EEE6` ivory-medium |
| `#64FFDA` accent | `#141413` ink |
| `#8B98A9` muted | `#5E5D59` slate-light |

```bash
cd "C:/Users/bibek/Claude project/bipper/webproject"
sed -i 's/#0F1626/#F0EEE6/g; s/#64FFDA/#141413/g; s/#8B98A9/#5E5D59/g' public/blog/*.svg
grep -rl "64FFDA\|0F1626\|8B98A9" public/blog/*.svg | wc -l   # must print 0
```

Ink-on-ivory covers, matching the reference's restraint. Spot-check three or
four — some use those hexes at low opacity where the new value reads
differently.

### Phase 9 — Docs

1. `README.md` — variant table, voting flow, Supabase setup and thumbnail
   section all describe deleted code. Update the fonts line and the cover-SVG
   palette convention to Phase 8's values.
2. `C:\Users\bibek\.claude\skills\publish-blog\SKILL.md` — instructs future
   posts to draw covers in `#0F1626` / `#64FFDA` / `#8B98A9`. Update, or every
   new post reintroduces the old palette.

### Phase 10 — Build, verify, deploy

```bash
rm -rf .next && pnpm build
```

(`.next` must be cleared — stale route types for the deleted `/vote` and
`/preview` broke the build once already.)

- [ ] Homepage: ivory ground, serif body at 20px, no flash on load
- [ ] Buttons: all three tiers, secondary **inverts** on hover
- [ ] Cover: fades in, copy staged on scroll; with reduced-motion forced on,
      copy is visible immediately and nothing animates
- [ ] `/blog` toggle flips to dark; reload stays dark with no light flash
- [ ] Navigate to `/` while dark → dark, no button
- [ ] Code blocks readable in both themes
- [ ] Blog cards show ink-on-ivory covers, no mint
- [ ] Fresh profile + OS dark → still lands in light
- [ ] `grep -rn "64FFDA\|0A0F1C\|7DD3FC\|A78BFA\|F5A524\|data-variant" src/ public/` → nothing
- [ ] `grep -rn "font-mono" src/` → every survivor is a date or code

Then the existing deploy flow — **Render builds `deploy`, not `master`**:

```bash
git checkout master && git merge retheme/blue-ink && git push origin master
git checkout deploy
git merge master -m "merge: bring master's latest source (ivory retheme) into deploy"
pnpm build
git add -f out/
git commit -m "deploy: rebuild with ivory retheme"
git push origin deploy
```

Afterwards remove the three `NEXT_PUBLIC_SUPABASE_*` vars from Render.

---

## 3. Risks

| Risk | Mitigation |
|---|---|
| Reads as an Anthropic clone | See §4. Decision is the owner's. |
| Serif body at 20px feels huge | It is correct for the reference and is the main thing that stops it reading as a dev template. Judge it rendered, not in the abstract. |
| Cover animation over-engineered | 2D canvas only, no library, one instance per page. If it fights, fall back to the CSS gradient. |
| Reduced-motion visitors see a blank card | The hide rule **must** sit inside `prefers-reduced-motion: no-preference`. Verify with motion forced off. |
| Hardcoded hexes survive the retheme | `now.tsx` and `post-thumbnail.tsx` both carry old-palette literals in inline styles. Phase 10's grep covers all five. |
| 121 covers keep the old palette | Phase 8, with the `wc -l` gate that must print 0. |
| Deploying to `master` changes nothing | Render builds `deploy`. |

## 4. One thing to decide

`#D97757` clay, `#FAF9F5` ivory, and this exact button system are strongly
associated with Anthropic's brand. Copied wholesale onto a personal portfolio,
someone who knows the reference will recognise it.

The neutral foundation — ivory, ink, serif body, quiet weight-400 buttons — is
a general editorial idiom and carries none of that risk. The **accent** is what
identifies it.

Two options, and this plan assumes the first unless told otherwise:

1. **Take it as measured.** Clay accent included. What was asked for.
2. **Keep the neutrals, shift the accent.** Everything above stays; `#D97757`
   becomes a different hue at the same saturation and lightness — the system
   is unchanged and nothing else in the plan moves.

## 5. Out of scope

- Rewriting blog post prose
- Blog information architecture, search, category filtering
- New homepage sections
- The in-post diagram SVGs — they are inline and inherit theme tokens already;
  only the `<img>`-loaded covers in `public/blog/` need Phase 8
