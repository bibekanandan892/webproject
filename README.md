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
| `/blog`                        | Blog landing (placeholder)                               |

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

## Regenerating thumbnails

If you change a variant's look, refresh its thumbnail:

```bash
pnpm dev -p 3000                       # in one terminal
pnpm tsx scripts/snap-thumbnails.ts    # in another
```

Output: `public/thumbs/<variant>.png` (1280×800).

## Project layout

```
src/
├── app/
│   ├── layout.tsx           # loads all 5 fonts (Geist, Geist_Mono, Inter, Roboto, Fraunces)
│   ├── page.tsx             # home — reads main variant from Supabase
│   ├── globals.css          # shared base + per-variant scoped palettes/utilities
│   ├── vote/page.tsx        # voting dashboard
│   ├── preview/[variant]/   # full-screen variant previews
│   └── blog/page.tsx
├── variants/
│   ├── registry.ts          # VARIANTS metadata + lookup
│   ├── VariantHost.tsx      # wraps a variant with [data-variant="X"]
│   └── <id>/Variant.tsx     # one folder per variant
├── components/
│   ├── vote/                # VariantCard, AdminGate
│   └── *.tsx                # shared hero/now/experience/... (used by some variants)
├── lib/
│   ├── supabase.ts          # browser client singleton
│   ├── votes.ts             # toggleVote / fetchCounts / getMyVotes
│   ├── main-variant.ts      # fetchMainVariant / setMainVariant
│   └── photo-egg.ts         # usePhotoClickEgg() — the 5-click hook
└── data/                    # static content shared across all variants
```

## Deploy

Static export, deploys to Render as a free Static Site. `pnpm build` writes
`out/`. Render auto-deploys on push to `master`. Supabase is called from the
browser; no Render compute needed.

Set the three `NEXT_PUBLIC_*` env vars in the Render dashboard
(Environment → Add Environment Variable) so they're baked into the build.
