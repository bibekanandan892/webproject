// Server-only helper: reads the latest Zen release from the public
// `zen-releases` GitHub repo at build time.
//
// The site builds with `output: "export"` (next.config.ts), so there is no
// Next.js server at runtime — every `fetch` here runs once during `next
// build` and its result is baked into the static HTML. The `revalidate`
// option below is what a normal (server-hosted) Next.js deployment would use
// to refresh this data on a schedule; it is inert under a static export
// (there is nothing to revalidate after the files are on disk), but it costs
// nothing to leave in place and it documents the intended cache lifetime if
// this site ever moves off static export.
//
// Every fetch is wrapped so a GitHub API failure (rate limit, no network
// during an offline/CI build, GitHub outage) can never fail `next build`. On
// any failure this degrades to `null` fields, and the calling components hide
// the version/size/checksum text rather than throwing — the download buttons
// themselves are static links and always render.

const OWNER = "bibekanandan892";
const REPO = "zen-releases";
const RELEASES_API = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;
const LATEST_DOWNLOAD_BASE = `https://github.com/${OWNER}/${REPO}/releases/latest/download`;

export const ZEN_ANDROID_APK_URL = `${LATEST_DOWNLOAD_BASE}/Zen.apk`;
export const ZEN_WINDOWS_INSTALLER_URL = `${LATEST_DOWNLOAD_BASE}/ZenDesktopSetup.exe`;
export const ZEN_SHA256SUMS_URL = `${LATEST_DOWNLOAD_BASE}/SHA256SUMS.txt`;
export const ZEN_RELEASES_REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const ZEN_ALL_RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases`;

const REVALIDATE_SECONDS = 60 * 60; // 1 hour — see note above.
const FETCH_TIMEOUT_MS = 8000;

interface GithubReleaseAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface GithubReleaseResponse {
  tag_name: string;
  name: string | null;
  published_at: string;
  assets: GithubReleaseAsset[];
}

export interface ZenReleaseAsset {
  /** Bytes, or null if the asset wasn't found in the latest release. */
  sizeBytes: number | null;
  /** SHA-256 hex digest from SHA256SUMS.txt, or null if unavailable. */
  sha256: string | null;
}

export interface ZenRelease {
  /** e.g. "v1.0.9", or null if the release info couldn't be fetched. */
  version: string | null;
  /** ISO date string, or null. */
  publishedAt: string | null;
  android: ZenReleaseAsset;
  windows: ZenReleaseAsset;
}

const EMPTY_ASSET: ZenReleaseAsset = { sizeBytes: null, sha256: null };
const EMPTY_RELEASE: ZenRelease = {
  version: null,
  publishedAt: null,
  android: EMPTY_ASSET,
  windows: EMPTY_ASSET,
};

async function fetchWithTimeout(url: string, revalidate: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate },
      headers: { Accept: "application/vnd.github+json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/** Parses `SHA256SUMS.txt` (`<hex digest>  <filename>` per line, sha256sum format). */
function parseShaSums(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(/^([0-9a-fA-F]{64})\s+\*?(.+)$/);
    if (!match) continue;
    const [, hash, name] = match;
    map.set(name.trim(), hash.toLowerCase());
  }
  return map;
}

async function fetchShaSums(): Promise<Map<string, string>> {
  try {
    const res = await fetchWithTimeout(ZEN_SHA256SUMS_URL, REVALIDATE_SECONDS);
    if (!res.ok) return new Map();
    return parseShaSums(await res.text());
  } catch {
    // Offline build, rate limit, or the asset is missing from this release.
    // The page just hides the checksum for the affected asset.
    return new Map();
  }
}

/**
 * Fetches the latest Zen release's version, per-asset size, and SHA-256
 * checksums. Never throws — any failure degrades to null fields.
 */
async function fetchReleaseJson(): Promise<GithubReleaseResponse | null> {
  try {
    const res = await fetchWithTimeout(RELEASES_API, REVALIDATE_SECONDS);
    return res.ok ? ((await res.json()) as GithubReleaseResponse) : null;
  } catch {
    // No network at build time, GitHub API rate limit, or the repo/release
    // doesn't exist yet. Fall through to the empty release.
    return null;
  }
}

export async function getZenRelease(): Promise<ZenRelease> {
  // Independent requests: run together so a slow API doesn't double the build-time wait.
  const [releaseJson, shaSums] = await Promise.all([fetchReleaseJson(), fetchShaSums()]);

  if (!releaseJson) {
    // Still surface any checksums we managed to fetch even if the release
    // metadata call failed.
    return {
      ...EMPTY_RELEASE,
      android: { sizeBytes: null, sha256: shaSums.get("Zen.apk") ?? null },
      windows: { sizeBytes: null, sha256: shaSums.get("ZenDesktopSetup.exe") ?? null },
    };
  }

  const findAsset = (name: string) => releaseJson!.assets.find((a) => a.name === name);
  const apk = findAsset("Zen.apk");
  const exe = findAsset("ZenDesktopSetup.exe");

  return {
    version: releaseJson.tag_name || releaseJson.name || null,
    publishedAt: releaseJson.published_at ?? null,
    android: {
      sizeBytes: apk?.size ?? null,
      sha256: shaSums.get("Zen.apk") ?? null,
    },
    windows: {
      sizeBytes: exe?.size ?? null,
      sha256: shaSums.get("ZenDesktopSetup.exe") ?? null,
    },
  };
}

/** Formats bytes as a human-readable MB string, e.g. "28 MB". Returns null if unavailable. */
export function formatAssetSize(bytes: number | null): string | null {
  if (bytes === null || Number.isNaN(bytes) || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  return `${mb >= 100 ? Math.round(mb) : Math.round(mb * 10) / 10} MB`;
}

/** Formats an ISO date as e.g. "21 Sep 2026". Returns null if unavailable. */
export function formatReleaseDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
