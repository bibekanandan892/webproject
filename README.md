# bibekananda.in — portfolio (consolidated)

Multi-variant Next.js 16 portfolio with a built-in voting dashboard. All 6
design variants live in one repo; one is picked as the live "home" via a
Supabase-backed admin toggle.

## Quick start

```bash
pnpm install
cp .env.example .env.local       # then fill in your Supabase URL + anon key + admin password
pnpm dev                          # http://localhost:3000
```

## Routes

| Route                          | Purpose                                                  |
| ------------------------------ | -------------------------------------------------------- |
| `/`                            | Renders whichever variant is currently the "main" site   |
| `/vote`                        | Shareable voting dashboard (thumbnails + thumbs-up)      |
| `/preview/<variant>/`          | Full-screen preview of any single variant                |
| `/blog`                        | Blog index — markdown posts, filterable by category      |
| `/blog/<slug>`                 | A post, statically generated from `content/blog/<slug>.md` |

Variants: `terminal-dark`, `kobweb-classic`, `bento-ios`, `editorial-serif`,
`liquid-glass`, `spatial-3d`.

## Supabase setup (one-time, ~10 min, free tier)

1. Create a free project at https://supabase.com
2. Open the SQL editor and paste `supabase/schema.sql`, run it
3. Project Settings → API: copy the URL + `anon` key into `.env.local`
4. Pick an admin password and set `NEXT_PUBLIC_ADMIN_PASSWORD`

Without Supabase, votes don't persist and `/` always renders the default
(`terminal-dark`). Everything else still works locally.

## The voting flow

- Anyone can click any card on `/vote` to open the full variant in a new tab
- Thumbs-up: one toggleable vote per browser per variant (tracked in localStorage)
- Counts live-update in Supabase via the `bump_vote` RPC (RLS-locked)
- "Email my picks" generates a mailto link encoding the user's choices
- **5-click easter egg**: 5 rapid clicks (within 3s) on the profile photo of
  any variant's hero navigates to `/vote`

## Admin: switching the live site

1. Visit `/vote`
2. Click the gear icon (top right)
3. Enter `NEXT_PUBLIC_ADMIN_PASSWORD`
4. "Make main" buttons appear on each card
5. Click one → updates Supabase `site_config.main_variant_id` → `/` now renders
   that variant for everyone (no redeploy needed)

The admin password is hardcoded into the bundled JS — security through
obscurity only. Fine for a portfolio voting toy; do not reuse this pattern for
real auth.

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

`/blog` renders a card grid — one column on mobile, two at `sm`, three at `lg`
— with a search box above it. Search matches title, summary, category and tags,
is case-insensitive, and ANDs multiple words. It runs client-side over the posts
already embedded in the page, so there is no index to build or keep in sync.

Cards show a thumbnail. Set `cover` to an image under `public/` to use a real
one; otherwise the card generates a panel tinted by category (AI teal, Android
amber) and textured from a hash of the slug, so no post needs an image asset.

The category filter appears once two or more categories have published posts.
To add a category, edit `POST_CATEGORIES` in `src/lib/blog/types.ts` and give it
a tint in `src/components/blog/post-thumbnail.tsx`.

### Internal links need a trailing slash

`next.config.ts` sets `trailingSlash: true`. Link to `/blog/<slug>/`, not
`/blog/<slug>`. Without the slash, client-side navigation into a dynamic route
dies with `Connection closed.` and the visitor gets Next's "This page couldn't
load" screen until they reload — direct URL loads still work, so it only shows
up when following a link from inside the site.

## Regenerating thumbnails

If you change a variant's look, refresh its thumbnail:

```bash
pnpm dev -p 3000                       # in one terminal
pnpm tsx scripts/snap-thumbnails.ts    # in another
```

Output: `public/thumbs/<variant>.png` (1280×800).

## Project layout

```
content/
└── blog/<slug>.md           # the posts — git is the CMS

src/
├── app/
│   ├── layout.tsx           # loads all 5 fonts (Geist, Geist_Mono, Inter, Roboto, Fraunces)
│   ├── page.tsx             # home — reads main variant from Supabase
│   ├── globals.css          # shared base + per-variant scoped palettes/utilities
│   ├── vote/page.tsx        # voting dashboard
│   ├── preview/[variant]/   # full-screen variant previews
│   ├── blog/page.tsx        # post index
│   └── blog/[slug]/page.tsx # article page (generateStaticParams)
├── variants/
│   ├── registry.ts          # VARIANTS metadata + lookup
│   ├── VariantHost.tsx      # wraps a variant with [data-variant="X"]
│   └── <id>/Variant.tsx     # one folder per variant
├── components/
│   ├── blog/                # PostCard, PostList (filter), TableOfContents
│   ├── vote/                # VariantCard, AdminGate
│   └── *.tsx                # shared hero/now/experience/... (used by some variants)
├── lib/
│   ├── blog/                # posts.ts (fs + frontmatter), markdown.ts (remark/rehype)
│   ├── supabase.ts          # browser client singleton
│   ├── votes.ts             # toggleVote / fetchCounts / getMyVotes
│   ├── main-variant.ts      # fetchMainVariant / setMainVariant
│   └── photo-egg.ts         # usePhotoClickEgg() — the 5-click hook
└── data/                    # static content shared across all variants
```

## Deploy

Static export, served by Render as a free Static Site. Supabase is called from
the browser; no Render compute needed.

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

Set the three `NEXT_PUBLIC_*` env vars in the Render dashboard
(Environment → Add Environment Variable) so they're baked into the build.
