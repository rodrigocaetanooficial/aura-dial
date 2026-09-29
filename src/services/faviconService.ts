import { imageFileToDataUrl } from '../utils/imageFile';

export interface FaviconResult {
  url: string;
  dataUrl?: string;
  /** The lookup concluded the site has no icon (blocked or none declared):
   *  the card shows the site's initial instead. */
  noIcon?: boolean;
}

/**
 * The value worth storing on a site. Extension-internal icons (the _favicon API)
 * are deliberately dropped: they embed the extension id, so they are re-resolved
 * at render time instead of being frozen into stored data.
 */
export function persistableFavicon(result: FaviconResult): string | undefined {
  if (result.dataUrl) return result.dataUrl;
  // '' = "resolved: no icon" — keeps the card off the browser's stock
  // placeholder (and therefore on the site initial instead).
  if (result.noIcon) return '';
  return /^(https?|data):/i.test(result.url) ? result.url : undefined;
}

export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Browser-provided favicon (manifest "favicon" permission). Always local, never
 * blocked by the site, and falls back to a generic globe icon. Returns null
 * outside the extension (dev preview) so callers can use the fetch pipeline.
 */
export function faviconApiUrl(url: string, size = 128): string | null {
  const runtime = typeof chrome !== 'undefined' ? chrome.runtime : undefined;
  if (!runtime?.getURL) return null;
  try {
    return runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(url)}&size=${size}`);
  } catch {
    return null;
  }
}

function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.href;
  } catch {
    return null;
  }
}

export async function fetchPageHtml(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal,
      headers: { 'Accept': 'text/html,application/xhtml+xml' },
      credentials: 'omit',
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return null;
    return await res.text();
  } catch {
    return null;
  }
}

interface CandidateLink {
  rel: string;
  href: string;
  sizes?: string;
}

function parseLinkTags(html: string): CandidateLink[] {
  const candidates: CandidateLink[] = [];
  const linkRegex = /<link\b([^>]*?)>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1];
    const relMatch = attrs.match(/\brel\s*=\s*["']([^"']*)["']/i);
    if (!relMatch) continue;
    const rel = relMatch[1].toLowerCase();
    if (!rel.includes('icon') && !rel.includes('shortcut') && !rel.includes('apple-touch')) continue;
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    if (!hrefMatch) continue;
    const sizesMatch = attrs.match(/\bsizes\s*=\s*["']([^"']*)["']/i);
    candidates.push({
      rel,
      href: hrefMatch[1],
      sizes: sizesMatch?.[1],
    });
  }
  return candidates;
}

function parseSize(sizes?: string): number {
  if (!sizes) return 0;
  const parts = sizes.toLowerCase().split('x');
  if (parts.length !== 2) return 0;
  const w = parseInt(parts[0].trim(), 10);
  return Number.isFinite(w) ? w : 0;
}

function rankCandidate(c: CandidateLink): number {
  const rel = c.rel.toLowerCase();
  if (rel.includes('apple-touch-icon')) return 3;
  if (rel.includes('shortcut')) return 2;
  if (rel.includes('icon')) return 1;
  return 0;
}

function resolveHref(base: string, href: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

export function bestFaviconUrl(html: string, pageUrl: string): string | null {
  const candidates = parseLinkTags(html)
    .map(c => ({ ...c, resolved: resolveHref(pageUrl, c.href), size: parseSize(c.sizes) }))
    // `<link rel="icon" href="data:,">` is an in-the-wild pattern (example.com):
    // only http(s) icons can actually be fetched and rendered.
    .filter(c => /^https?:/i.test(c.resolved))
    .sort((a, b) => rankCandidate(b) - rankCandidate(a) || b.size - a.size);
  return candidates[0]?.resolved ?? null;
}

/** Icons never render past ~52px; a 128px copy keeps chrome.storage.local light
 *  (a 512px favicon as base64 is tens of KB per site, the store holds 10MB). */
const ICON_MAX_EDGE = 128;

async function fetchImageAsDataUrl(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const res = await fetch(url, { signal, credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return await imageFileToDataUrl(
      new File([blob], 'icon', { type: blob.type }),
      { maxEdge: ICON_MAX_EDGE, maxBytes: 0 },
    );
  } catch {
    return null;
  }
}

/** Chromium serves a stock placeholder icon for every page it has no icon
 *  cached for — identical bytes each time, so its length identifies it. Landing
 *  on the card, it looks exactly like a favicon that failed to load. */
let stockIconLength = 0;

async function isStockIcon(dataUrl: string, signal?: AbortSignal): Promise<boolean> {
  if (!stockIconLength) {
    const probe = faviconApiUrl('https://stock-icon-probe.invalid/');
    stockIconLength = (probe && (await fetchImageAsDataUrl(probe, signal))?.length) || -1;
  }
  return stockIconLength > 0 && dataUrl.length === stockIconLength;
}

export async function discoverFavicon(inputUrl: string, signal?: AbortSignal): Promise<FaviconResult> {
  const normalized = normalizeUrl(inputUrl);
  if (!normalized) return { url: inputUrl };
  const domain = extractDomain(normalized);

  // The site's own icon first. The browser's cache answers instantly but hands
  // back the stock placeholder for a page it never loaded — which is how a
  // freshly added site ended up with a generic icon instead of its own.
  const html = await fetchPageHtml(normalized, signal);
  for (const target of [html ? bestFaviconUrl(html, normalized) : null, `https://${domain}/favicon.ico`]) {
    if (!target) continue;
    const dataUrl = await fetchImageAsDataUrl(target, signal);
    if (dataUrl) return { url: dataUrl, dataUrl };
  }

  // Blocked or iconless: accept the browser's icon only when it is a real one,
  // otherwise say so and let the card fall back to the initial.
  const apiUrl = faviconApiUrl(normalized);
  const cached = apiUrl ? await fetchImageAsDataUrl(apiUrl, signal) : null;
  if (cached && !(await isStockIcon(cached, signal))) return { url: cached, dataUrl: cached };

  return { url: apiUrl ?? `https://${domain}/favicon.ico`, noIcon: true };
}

export interface SitePreview {
  title?: string;
  images: string[];
}

/** Images declared in the page markup, biggest first. Most sites never set an
 *  og:image, so the picker would otherwise come up empty. */
function pageImageCandidates(doc: Document, base: string): { big: string[]; rest: string[] } {
  const big: string[] = [];
  const rest: string[] = [];
  for (const img of Array.from(doc.querySelectorAll('img'))) {
    // srcset's last entry is normally the largest rendition.
    const fromSrcset = img.getAttribute('srcset')?.split(',').pop()?.trim().split(/\s+/)[0];
    const raw = fromSrcset
      ?? img.getAttribute('src')
      ?? img.getAttribute('data-src')
      ?? img.getAttribute('data-original');
    if (!raw || raw.startsWith('data:')) continue;
    const url = resolveHref(base, raw);
    if (!/^https?:\/\//i.test(url)) continue;
    const declared = parseInt(img.getAttribute('width') || '0', 10) || 0;
    if (declared && declared < 200) continue; // icons, spacers, tracking pixels
    (declared >= 400 ? big : rest).push(url);
  }
  return { big, rest };
}

/**
 * Reads the page itself for what the icon API cannot give: the real page title
 * and the image candidates the user can pick as a thumbnail.
 */
export async function fetchSitePreview(inputUrl: string, signal?: AbortSignal): Promise<SitePreview> {
  const normalized = normalizeUrl(inputUrl);
  const html = normalized ? await fetchPageHtml(normalized, signal) : null;
  if (!normalized || !html) return { images: [] };

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const meta = (selector: string) => doc.querySelector(selector)?.getAttribute('content')?.trim() || undefined;
  const pageTitle = doc.querySelector('title')?.textContent?.trim();
  const title = meta('meta[property="og:title"]')
    ?? meta('meta[name="twitter:title"]')
    ?? (pageTitle || undefined);

  const declared = [
    meta('meta[property="og:image:secure_url"]'),
    meta('meta[property="og:image"]'),
    meta('meta[property="og:image:url"]'),
    meta('meta[name="twitter:image"]'),
    meta('meta[name="twitter:image:src"]'),
  ].filter((u): u is string => !!u);

  const page = pageImageCandidates(doc, normalized);
  const images = [...new Set([...declared, ...page.big, ...page.rest].map(u => resolveHref(normalized, u)))]
    .filter(u => /^https?:\/\//i.test(u))
    .slice(0, 6);

  return { title, images };
}

/**
 * Network lookup of the site's own icon, bypassing the browser's icon cache —
 * which is exactly what "Refresh favicon" needs, since the cached API icon is
 * the one already showing on the card.
 */
export async function fetchFaviconFromSite(inputUrl: string, signal?: AbortSignal): Promise<string | undefined> {
  const normalized = normalizeUrl(inputUrl);
  if (!normalized) return undefined;
  const html = await fetchPageHtml(normalized, signal);
  const domain = extractDomain(normalized);

  // Declared icon first, then the conventional path: a dead <link> must not
  // abort the lookup.
  for (const target of [html ? bestFaviconUrl(html, normalized) : null, `https://${domain}/favicon.ico`]) {
    if (!target) continue;
    const dataUrl = await fetchImageAsDataUrl(target, signal);
    if (dataUrl) return dataUrl;
  }

  // Site unreachable (bot walls) — the browser's icon, but only when it is a
  // real one: the stock placeholder must never reach the card.
  const cached = faviconApiUrl(normalized);
  const dataUrl = cached ? await fetchImageAsDataUrl(cached, signal) : null;
  return dataUrl && !(await isStockIcon(dataUrl, signal)) ? dataUrl : undefined;
}

export function letterForDomain(url: string): string {
  const domain = extractDomain(url);
  const cleaned = domain.replace(/[^a-zA-Z]/g, '');
  return (cleaned[0] ?? '?').toUpperCase();
}

export function isValidUrl(input: string): boolean {
  return normalizeUrl(input) !== null;
}

export function normalizeUserUrl(input: string): string | null {
  return normalizeUrl(input);
}
