import type { PostCategory, PostMeta } from "@/lib/blog/types";

/**
 * Tint is keyed to the category, not the slug, so the grid is scannable at a
 * glance — every AI post reads cactus, every Android post oat. Values are the
 * measured card tints from execution.md §1.3, not arbitrary hex.
 */
const CATEGORY_TINT: Record<PostCategory, string> = {
  AI: "#BCD1CA",
  Android: "#E3DACC",
};

const COLS = 13;
const ROWS = 7;
const CELL = 16;

/** Stable 32-bit hash so a post's texture never changes between builds. */
function hashOf(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * A lower-triangular field — the attention-mask motif — thinned out by a
 * per-slug bit pattern so no two posts carry the same texture.
 */
function litCells(seed: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const belowDiagonal = x <= y + 4;
      const keep = ((seed >>> ((y * 5 + x) % 29)) & 3) !== 0;
      if (belowDiagonal && keep) out.push({ x, y });
    }
  }
  return out;
}

/**
 * Card image for a post: the authored `cover` when there is one, otherwise a
 * generated panel. Decorative either way — the card's title is the real label,
 * so it is hidden from assistive tech.
 */
export function PostThumbnail({ post }: { post: PostMeta }) {
  if (post.cover) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export, images unoptimized
      <img
        src={post.cover}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
    );
  }

  const seed = hashOf(post.slug);
  const tint = CATEGORY_TINT[post.category];

  return (
    <div
      aria-hidden="true"
      className="relative h-full w-full overflow-hidden bg-[var(--surface,var(--card))]"
      style={{
        backgroundImage: `radial-gradient(100% 140% at 0% 0%, ${tint}14 0%, transparent 60%)`,
      }}
    >
      <svg
        viewBox={`0 0 ${COLS * CELL} ${ROWS * CELL}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-[1.06]"
      >
        {litCells(seed).map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x * CELL + 4}
            y={y * CELL + 4}
            width={CELL - 8}
            height={CELL - 8}
            rx={2}
            fill={tint}
            fillOpacity={0.13}
          />
        ))}
      </svg>

      <span
        className="absolute bottom-3 right-4 font-mono text-xs"
        style={{ color: "var(--foreground)", opacity: 0.5 }}
      >
        {post.category}
      </span>
    </div>
  );
}
