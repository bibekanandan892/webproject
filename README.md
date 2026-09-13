# bibekananda.in — portfolio

Static Next.js 16 portfolio. One theme, two modes: a light default and an
opt-in dark mode toggled from the blog.

## Quick start

```bash
pnpm install
pnpm dev                          # http://localhost:3000
```

No environment variables and no external services are needed — everything
renders from files in this repo.

## Routes

| Route                          | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `/`                            | Homepage — static, server-rendered, no client fetch      |
| `/blog`                        | Blog index — markdown posts, filterable by category      |
| `/blog/<slug>`                 | A post, statically generated from `content/blog/<slug>.md` |

## Theme

The design system is measured off anthropic.com's own homepage: an ivory
ground, a slate ink ramp, and a clay accent reserved for `::selection` and
brand moments — buttons and links stay ink, not clay. Type is Archivo for
headings/UI, Source Serif 4 for body copy (20px/1.4, the site's default —
`html` is `font-serif`, headings are pinned back to `font-sans`), and
JetBrains Mono for dates and code only.

Tokens live in `src/app/globals.css`: the light palette on `:root`, the dark
palette on `[data-theme="dark"]`. There is deliberately **no**
`@media (prefers-color-scheme)` block — a first-time visitor always lands in
the light theme regardless of their OS setting. The only way to see dark is
the toggle button in the blog header (`src/components/theme-toggle.tsx`),
which writes a `theme` key to `localStorage`. A render-blocking inline
script in the `<head>` of `src/app/layout.tsx` reads that key before first
paint, so a returning dark-mode visitor never sees a flash of the light
theme — see the comment on `THEME_BOOTSTRAP_SCRIPT` in that file for why it
has to be a literal `<script>` inside a manual `<head>` rather than
`next/script`, which doesn't run early enough in a static export.

The homepage has no toggle of its own; it just reads the same stored
preference, so the choice applies site-wide even though the control lives
only in the blog.

The hero's cover animation (`src/components/cover.tsx`) is a plain 2D canvas
drawing a drifting-particle field — not the WebGL2 scene the reference site
uses, which this project has no equivalent asset for. It fades in on mount
and stages the hero's copy in via `IntersectionObserver`, gated behind
`prefers-reduced-motion` so a reduced-motion visitor's first paint already
shows the copy.

## The blog

Posts are markdown files in `content/blog/`. There is no CMS and no database —
git is the store. Add a file, commit it to `master`, then run the deploy flow
below to publish it.

The filename is the URL slug. Frontmatter:

```yaml
---
title: "Causal masking: how a transformer is stopped from reading ahead"
date: "2026-09-05"        # YYYY-MM-DD
category: "AI"            # AI | Android — see POST_CATEGORIES
tags: ["llm", "attention"]
summary: "Shown on the card and used as the meta description."
draft: false              # true = visible in `pnpm dev`, excluded from the build
cover: "/blog/thing.png"  # optional; omit for a generated thumbnail
---
```

Frontmatter is validated at build time; a bad field fails `pnpm build` with the
offending filename in the error.

Bodies are rendered at build time (zero client JS) with GFM, KaTeX math
(`$…$` / `$$…$$`), Shiki syntax highlighting, heading anchors, and **raw HTML**
— inline `<svg>` is how diagrams get into a post. Reading time is computed;
don't author it.

Shiki highlights each code block against **two** themes at once
(`github-light` / `github-dark-default`, see `src/lib/blog/markdown.ts`), so
syntax colouring follows the dark-mode toggle even though highlighting only
ever runs once, at build time — the CSS picks between the two sets of
`--shiki-*` custom properties Shiki emits per token based on `[data-theme]`.

`/blog` renders a card grid — one column on mobile, two at `sm`, three at `lg`
— with a search box above it. Search matches title, summary, category and tags,
is case-insensitive, and ANDs multiple words. It runs client-side over the posts
already embedded in the page, so there is no index to build or keep in sync.

Cards show a thumbnail. Each post has a hand-drawn SVG cover at
`public/blog/<slug>.svg`, pointed at by `cover` in the frontmatter. Covers load
through `<img>`, so they are isolated documents — the site's CSS variables do
**not** reach them and the palette must be hardcoded: `#F0EEE6` ground,
`#141413` ink (accent/lines/text), `#5E5D59` muted, `#FFFFFF` for any raised
panel inside the diagram. Draw them 800×450 to match the card.

Omit `cover` and the card generates a panel instead, tinted by category
(AI cactus `#BCD1CA`, Android oat `#E3DACC`) and textured from a hash of the
slug — so a post never needs an image asset.

The category filter appears once two or more categories have published posts.
To add a category, edit `POST_CATEGORIES` in `src/lib/blog/types.ts` and give it
a tint in `src/components/blog/post-thumbnail.tsx`.

### Internal links need a trailing slash

`next.config.ts` sets `trailingSlash: true`. Link to `/blog/<slug>/`, not
`/blog/<slug>`. Without the slash, client-side navigation into a dynamic route
dies with `Connection closed.` and the visitor gets Next's "This page couldn't
load" screen until they reload — direct URL loads still work, so it only shows
up when following a link from inside the site.

## Project layout

```
content/
└── blog/<slug>.md           # the posts — git is the CMS

src/
├── app/
│   ├── layout.tsx           # loads Archivo, Source Serif 4, JetBrains Mono;
│   │                        # the theme-bootstrap <script> lives here
│   ├── page.tsx             # homepage — static server component, no client fetch
│   ├── globals.css          # tokens (:root light, [data-theme="dark"] dark),
│   │                        # base layer, the cover-animation and reveal CSS,
│   │                        # and .prose-post for rendered post bodies
│   ├── blog/page.tsx        # post index
│   └── blog/[slug]/page.tsx # article page (generateStaticParams)
├── components/
│   ├── blog/                # PostCard, PostList (filter), TableOfContents
│   ├── ui/
│   │   └── action-button.tsx  # the three-tier button system (primary/
│   │                          # secondary/tertiary), a bare cva — see the
│   │                          # file for why it isn't a wrapped component
│   ├── cover.tsx             # hero canvas animation + scroll-reveal hook
│   ├── theme-toggle.tsx      # the dark-mode button, lives in the blog header
│   └── *.tsx                 # hero/now/experience/tech/projects/contact/...
├── lib/
│   ├── blog/                 # posts.ts (fs + frontmatter), markdown.ts (remark/rehype)
│   └── photo-egg.ts          # usePhotoClickEgg() — the 5-click hero easter egg
└── data/                     # static content (experience, projects, tech, ...)
```

Two things predate this layout and are known, deliberately unaddressed:
`src/components/looking-for.tsx` is fully built but never rendered anywhere,
and `src/components/ui/{badge,button,card,separator}.tsx` are unused shadcn
scaffolding. Neither is wired into any page.

## Deploy

Static export, served by Render as a free Static Site.

**Render builds the `deploy` branch, not `master`**, and it serves the
pre-built `out/` directory that is committed there. Pushing to `master` alone
changes nothing on the live site.

Source lands on `master`; `deploy` carries that source plus a committed `out/`.
To publish:

```bash
git checkout master && git push origin master     # source first

git checkout deploy
git merge master -m "merge: bring master's latest source (<what>) into deploy"
pnpm build                                        # regenerates out/
git add -f out/                                   # out/ is gitignored, force it
git commit -m "deploy: rebuild with <what>"
git push origin deploy                            # this is what goes live
```

Render picks it up on commit and the site updates in about a minute.
