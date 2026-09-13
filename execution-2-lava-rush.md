# Execution plan — Lava Rush retheme

Second retheme. Replaces the measured anthropic.com ivory/clay system
(`execution.md`, phases 0–10, shipped) with the supplied four-colour Lava Rush
palette and a two-face Poppins/Lora type pairing.

Branch: `retheme/lava-rush`, off `master` at `87109f9`.

---

## 1. The brief

**Palette** (supplied, exact — no substitutions):

| Name         | Hex       | Role                                      |
|--------------|-----------|-------------------------------------------|
| Lava Rush    | `#FF4E1B` | Accent — buttons, links, markers, rules   |
| Black Core   | `#020305` | Default ground; button label on orange    |
| Cloud Ash    | `#EDF0F5` | Body text on dark; ground in light theme  |
| Gunmetal Gray| `#2E2F31` | Chips, code fields, hairlines, table heads|

**Type** (supplied, exact): **Poppins** + **Lora**. Hard cap of two faces.

**Confirmed decisions**

- ~~**Dark is the default.**~~ **Reversed after seeing it built.** Dark shipped
  as the default in Phase 1, then two rounds of review moved it back: first the
  light theme was rebuilt on warm paper white (#FAF9F5) instead of Cloud Ash,
  because Cloud Ash glares under a long article and this site is mostly a blog;
  then light was made the default outright. `:root` carries the paper palette
  and `[data-theme="dark"]` is the opt-in override, as it was before this
  retheme. Cloud Ash keeps its real job as ink on the dark theme.
- **Orange pushes to links, markers and rules** in both themes, and to buttons
  in the dark theme only. On paper white the primary is ink: a Lava Rush button
  there is an interruption every time the eye passes it, and the deepened
  #C23A0C carries the brand in body text instead.

## 2. Constraints discovered before writing this

- `dark:` Tailwind utilities appear only in `ui/badge.tsx` and `ui/button.tsx`,
  both dead code. Inverting the theme default is therefore safe, but
  `@custom-variant dark` still has to be re-pointed so it does not silently
  become a no-op.
- All 121 blog cover SVGs use exactly four hex values —
  `#141413` (1676), `#5E5D59` (570), `#FFFFFF` (181), `#F0EEE6` (124) — which
  maps 1:1 onto the new palette with no collision-sequencing needed this time.
  (Contrast with the previous retheme, where a naive parallel `sed` produced
  white-on-white.)
- `--font-mono` is consumed by two different things: UI texture (eyebrows,
  chips, tag pills, meta rows — 14 call sites) and actual code (`.prose-post
  pre code`, inline `<code>`). The two-face cap applies to the brand faces;
  see §3.2 for how code is handled.

## 3. Contrast arithmetic (done up front, drives the token values)

Lava Rush is a mid-luminance orange (relative luminance ≈ 0.267). That single
number decides most of the palette:

| Pair                        | Ratio  | Verdict                   |
|-----------------------------|--------|---------------------------|
| `#EDF0F5` on `#FF4E1B`      | 2.89:1 | **Fails** — not used      |
| `#020305` on `#FF4E1B`      | 6.20:1 | Passes AA — button label  |
| `#FF4E1B` on `#020305`      | 6.20:1 | Passes AA — link on dark  |
| `#FF4E1B` on `#EDF0F5`      | 2.89:1 | **Fails** — link on light |
| `#C23A0C` on `#EDF0F5`      | 4.66:1 | Passes AA — deepened link |

Consequences:

1. Orange buttons take a **Black Core** label, not white — the palette image
   shows white on orange, but that is a display swatch at 40px, and even large
   text wants 3:1.
2. Orange as *text* only works on the dark ground. The light theme needs a
   deepened `#C23A0C` for link/marker text while keeping `#FF4E1B` as the
   button *fill* (which is fine, because the fill carries a black label).
   Hence a separate `--accent-strong` token that differs per theme, rather
   than reusing `--primary` for both jobs.

## 4. Phases

Each phase ends with a local build/preview screenshot before the next starts.

### Phase 1 — Colour system
- Rewrite `:root` as the dark Black Core palette; add `[data-theme="light"]`
  for Cloud Ash. Build a 4-step dark ramp (`#020305` ground → `#0B0D0F` band →
  `#1A1C1E` card → `#2E2F31` Gunmetal chip) so cards and chips separate.
- Add `--accent-strong` (per §3.2) and re-point `--primary` / `--primary-hover`
  / `--primary-foreground` / `--ring` to the orange.
- Invert `@custom-variant dark`, the `layout.tsx` bootstrap script, the
  `theme-toggle.tsx` read/write, and the Shiki `--shiki-light`/`--shiki-dark`
  selector so all four agree that dark is now the base.
- Remap the nine Anthropic card tints onto the new system.
- **Preview.**

### Phase 2 — Typography
- Swap `Archivo` → `Poppins` (`--font-sans`) and `Source_Serif_4` → `Lora`
  (`--font-serif`) in `layout.tsx`. Drop the `JetBrains_Mono` import.
- Point `--font-mono` at the OS monospace stack. It stays in the token list for
  code only; it is not a loaded brand face, so the two-face cap holds.
- Convert the 14 UI-texture `font-mono` call sites to `font-sans` with
  letter-spacing — they were mono for texture, and Poppins carries that role.
- Retune the vertical rhythm for Lora (larger x-height than Source Serif —
  body line-height 1.4 → 1.6).
- **Preview.**

### Phase 3 — Hardcoded component colours
- `now.tsx` — three status badges currently keyed to cactus/sky/heather.
- `blog/post-thumbnail.tsx` — `CATEGORY_TINT` hardcodes `#BCD1CA` / `#E3DACC`.
- `cover.tsx` — particle fallback `#D1CFC5`.
- **Preview.**

### Phase 4 — Blog cover SVGs
- Recolour all 121 files: `#141413`→`#EDF0F5`, `#FFFFFF`→`#020305`,
  `#F0EEE6`→`#2E2F31`, `#5E5D59`→`#A3AAB2`. Reconcile counts afterwards.
- **Preview.**

### Phase 5 — Verify
- `rm -rf .next` (standing habit from the last retheme's stale-route failure),
  `pnpm build`, `pnpm lint`, serve `out/`, check home + blog + a post in both
  themes.
- **Preview.**

### Phase 6 — Ship
- Commit, merge to `master`. Deploy only on explicit go-ahead.

## 5. Status

- [x] Phase 1 — colour system (tint remap folded in from Phase 3; now.tsx done here)
- [x] Phase 2 — typography
- [ ] Phase 3 — component colours
- [ ] Phase 4 — blog SVGs
- [x] Phase 5 — verify (build + live CSS audit; lint error is pre-existing on master)
- [x] Phase 6 — ship — merged to master and deployed via the deploy branch;
      live on https://bibekananda.in and verified serving the new palette,
      Poppins/Lora, and no surviving mint/navy/clay values.

Still open, deliberately not done before the deploy so nothing shipped
unreviewed:
- [ ] Phase 3 — `blog/post-thumbnail.tsx` still hardcodes the retired Anthropic
      category tints (`#BCD1CA` sage, `#E3DACC` oat) for generated post covers.
- [ ] Phase 4 — the 121 blog cover SVGs are still on the previous ivory
      palette. Largely benign now that the default ground is paper white
      (`#F0EEE6` vs the new `#F2F0E9` is imperceptible), but they read as light
      panels under the dark theme.
- [ ] Pre-existing: `theme-toggle.tsx` trips `react-hooks/set-state-in-effect`.
      Present on master before this retheme and on the previously-live build;
      left alone rather than silently changed during a deploy.
