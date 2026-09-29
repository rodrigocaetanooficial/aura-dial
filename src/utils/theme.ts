import type { SpeedDialSettings, BackgroundSettings } from '../types';

export function isLightTheme(settings: SpeedDialSettings): boolean {
  if (settings.theme === 'light') return true;
  if (settings.theme === 'dark') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  }
  return true;
}

function shadowValue(kind: SpeedDialSettings['cardShadow'], light: boolean): string {
  const a = light ? 0.07 : 0.45;
  const a2 = light ? 0.04 : 0.3;
  switch (kind) {
    case 'none': return 'none';
    case 'subtle': return `0 1px 2px rgba(2,6,23,${a}), 0 1px 1px rgba(2,6,23,${a2})`;
    case 'medium': return `0 6px 18px -6px rgba(2,6,23,${a + 0.05}), 0 2px 6px rgba(2,6,23,${a2})`;
    case 'large': return `0 18px 44px -12px rgba(2,6,23,${a + 0.1}), 0 6px 14px rgba(2,6,23,${a2 + 0.05})`;
  }
}

/** Absolute URL for a bundled asset path — a bare relative path in a custom
 *  property resolves against the stylesheet (assets/), not the page. */
function assetUrl(path: string): string {
  if (/^(data:|blob:|https?:|chrome-extension:)/i.test(path)) return path;
  try {
    return new URL(path, document.baseURI).href;
  } catch {
    return path;
  }
}

export function backgroundCSS(bg: BackgroundSettings): string {
  if (bg.type === 'solid') {
    return bg.color ?? '#101322';
  }
  if (bg.type === 'gradient') {
    const from = bg.gradientFrom ?? '#101322';
    const to = bg.gradientTo ?? '#232a45';
    const dir = bg.gradientDirection ?? 160;
    return `linear-gradient(${dir}deg, ${from}, ${to})`;
  }
  if (bg.type === 'image' && bg.imageData) {
    const size = bg.imageSize === 'stretch' ? '100% 100%' : bg.imageSize ?? 'cover';
    const pos = bg.imagePosition ?? 'center';
    const repeat = bg.imageRepeat ?? 'no-repeat';
    return `url("${assetUrl(bg.imageData)}") ${pos} / ${size} ${repeat}`;
  }
  return 'linear-gradient(160deg, #101322, #232a45)';
}

export const PAGE_GUTTER = 28;

export const CARD_WIDTH_PX: Record<'small' | 'medium' | 'large', number> = {
  small: 150,
  medium: 216,
  large: 280,
};

/** Column cap for the current settings — cards never grow past this. */
export function cardWidth(settings: SpeedDialSettings): number {
  return settings.cardSize === 'custom'
    ? settings.customCardWidth ?? 160
    : CARD_WIDTH_PX[settings.cardSize];
}

/** Whether the page sits over a user image (wallpaper) — drives glass surfaces. */
export function hasWallpaper(settings: SpeedDialSettings): boolean {
  return settings.background.type === 'image' && !!settings.background.imageData;
}

/** Relative luminance (0=black, 1=white) of a #hex or rgb()/rgba() color. */
function colorLuminance(color: string): number | null {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  let r: number, g: number, b: number;
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    r = parseInt(h.slice(0, 2), 16) / 255;
    g = parseInt(h.slice(2, 4), 16) / 255;
    b = parseInt(h.slice(4, 6), 16) / 255;
  } else {
    const m = color.trim().match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (!m) return null;
    r = Number(m[1]) / 255;
    g = Number(m[2]) / 255;
    b = Number(m[3]) / 255;
  }
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Is the page background light? Drives text placed DIRECTLY over the background
 * (clock, empty state, add-tile) — independent of the UI theme, because a light
 * theme can sit over a dark gradient and vice-versa.
 */
export function backgroundIsLight(settings: SpeedDialSettings): boolean {
  const bg = settings.background;
  if (bg.type === 'solid') {
    return (colorLuminance(bg.color ?? '#101322') ?? 0) > 0.35;
  }
  if (bg.type === 'gradient') {
    const a = colorLuminance(bg.gradientFrom ?? '#101322') ?? 0;
    const b = colorLuminance(bg.gradientTo ?? '#232a45') ?? 0;
    return (a + b) / 2 > 0.35;
  }
  // image: overlays hint at the intended contrast; default to light text (with shadow)
  const od = bg.overlayDark ?? 0;
  const ol = bg.overlayLight ?? 0;
  if (ol > od + 10) return true;
  return false;
}

const LIGHT_TOKENS: Record<string, string> = {
  '--surface': '#ffffff',
  '--surface-2': '#f4f5f9',
  '--surface-hover': '#eceef5',
  '--text-1': '#101322',
  '--text-2': '#5b6172',
  '--text-3': '#8a8fa3',
  '--border': 'rgba(16, 19, 34, 0.09)',
  '--border-strong': 'rgba(16, 19, 34, 0.16)',
  '--accent': '#4c5fd5',
  '--accent-strong': '#3d4fc0',
  '--accent-soft': 'rgba(76, 95, 213, 0.10)',
  '--on-accent': '#ffffff',
  '--danger': '#c92a2a',
  '--danger-soft': 'rgba(201, 42, 42, 0.09)',
  '--success': '#15803d',
  '--ring': 'rgba(76, 95, 213, 0.35)',
};

const DARK_TOKENS: Record<string, string> = {
  '--surface': '#1b1e2a',
  '--surface-2': '#232736',
  '--surface-hover': '#2a2f40',
  '--text-1': '#e8eaf2',
  '--text-2': '#9aa1b5',
  '--text-3': '#6d7488',
  '--border': 'rgba(255, 255, 255, 0.08)',
  '--border-strong': 'rgba(255, 255, 255, 0.16)',
  '--accent': '#8ea0ff',
  '--accent-strong': '#a5b3ff',
  '--accent-soft': 'rgba(142, 160, 255, 0.13)',
  '--on-accent': '#10132a',
  '--danger': '#f2777a',
  '--danger-soft': 'rgba(242, 119, 122, 0.13)',
  '--success': '#4ade80',
  '--ring': 'rgba(142, 160, 255, 0.40)',
};

/** Card / floating-surface tokens depend on whether there is a wallpaper behind. */
function surfaceTokens(light: boolean, wallpaper: boolean): Record<string, string> {
  if (wallpaper) {
    return {
      '--card-bg': light ? 'rgba(255, 255, 255, 0.82)' : 'rgba(21, 24, 34, 0.80)',
      '--card-bg-solid': light ? '#ffffff' : '#171a26',
      '--glass-bg': light ? 'rgba(255, 255, 255, 0.66)' : 'rgba(17, 20, 30, 0.66)',
    };
  }
  return {
    '--card-bg': light ? '#ffffff' : '#1b1e2a',
    '--card-bg-solid': light ? '#ffffff' : '#1b1e2a',
    '--glass-bg': light ? 'rgba(255, 255, 255, 0.72)' : 'rgba(27, 30, 42, 0.72)',
  };
}

export function applyTheme(settings: SpeedDialSettings): void {
  const light = isLightTheme(settings);
  const wallpaper = hasWallpaper(settings);
  const root = document.documentElement;
  root.classList.toggle('theme-light', light);
  root.classList.toggle('theme-dark', !light);
  root.classList.toggle('has-wallpaper', wallpaper);

  const bgCSS = backgroundCSS(settings.background);
  const blur = settings.background.blur ?? 0;
  const brightness = (settings.background.brightness ?? 100) / 100;
  const overlayDark = (settings.background.overlayDark ?? 0) / 100;
  const overlayLight = (settings.background.overlayLight ?? 0) / 100;
  const opacity = (settings.background.opacity ?? 100) / 100;

  let filterStr = '';
  if (blur > 0) filterStr += `blur(${blur}px) `;
  if (brightness !== 1) filterStr += `brightness(${brightness}) `;

  const overlayColor = overlayDark > 0
    ? `rgba(0,0,0,${overlayDark})`
    : overlayLight > 0
      ? `rgba(255,255,255,${overlayLight})`
      : 'transparent';

  root.style.setProperty('--page-bg', bgCSS);
  root.style.setProperty('--page-bg-blur', `${blur}px`);
  root.style.setProperty('--page-bg-filter', filterStr.trim());
  root.style.setProperty('--page-overlay', overlayColor);
  root.style.setProperty('--page-opacity', String(opacity));

  const bgLight = backgroundIsLight(settings);
  root.style.setProperty('--page-text-1', bgLight ? '#101322' : '#f2f4fa');
  root.style.setProperty('--page-text-2', bgLight ? '#4a5064' : 'rgba(232, 236, 246, 0.82)');
  root.classList.toggle('bg-light', bgLight);
  root.classList.toggle('bg-dark', !bgLight);

  const tokens = light ? LIGHT_TOKENS : DARK_TOKENS;
  for (const [k, v] of Object.entries(tokens)) root.style.setProperty(k, v);
  for (const [k, v] of Object.entries(surfaceTokens(light, wallpaper))) root.style.setProperty(k, v);

  root.style.setProperty('--card-border', 'var(--border)');
  root.style.setProperty('--card-shadow', shadowValue(settings.cardShadow, light));
  root.style.setProperty('--card-radius', `${settings.cardBorderRadius}px`);
  root.style.setProperty('--card-alpha', String(1 - (settings.cardTransparency ?? 0) / 100));

  root.classList.toggle('no-animations', !settings.animations);
}

export function computeColumns(settings: SpeedDialSettings, containerWidth: number): number {
  if (settings.columns !== 'auto') return settings.columns;
  const width = cardWidth(settings);
  const gap = settings.gapX;
  const usable = Math.max(containerWidth - PAGE_GUTTER * 2, width);
  const cols = Math.floor((usable + gap) / (width * 1.12 + gap));
  return Math.min(Math.max(cols, 2), 12);
}

/** Deterministic pleasant hue from a string — used for favicon-less card gradients. */
export function hueFromString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) % 360;
  }
  return h;
}
