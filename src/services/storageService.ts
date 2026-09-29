import type { SpeedDialSettings, SpeedDialItem, BackupData, BackgroundSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { DEFAULT_WALLPAPER } from '../utils/wallpapers';

const SETTINGS_KEY = 'speed-dial-settings';
const SITES_KEY = 'speed-dial-sites';

function isSpeedDialSettings(value: unknown): value is SpeedDialSettings {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return typeof s.columns === 'number' || s.columns === 'auto';
}

/* Saves are coalesced per key: a slider drag fires dozens of writes and the
 * store only needs the last value. Waiters settle with the real write, so the
 * "storage is full" toast still fires. */
const pending = new Map<string, { value: unknown; resolve: Array<() => void>; reject: Array<(e: unknown) => void> }>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushWrites(): Promise<void> {
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (pending.size === 0) return;
  const batch = [...pending.entries()];
  pending.clear();
  try {
    await chrome.storage.local.set(Object.fromEntries(batch.map(([k, w]) => [k, w.value])));
    batch.forEach(([, w]) => w.resolve.forEach(fn => fn()));
  } catch (e) {
    batch.forEach(([, w]) => w.reject.forEach(fn => fn(e)));
  }
}

function write(key: string, value: unknown): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const w = pending.get(key);
    if (w) {
      w.value = value;
      w.resolve.push(resolve);
      w.reject.push(reject);
    } else {
      pending.set(key, { value, resolve: [resolve], reject: [reject] });
      if (flushTimer === null) flushTimer = setTimeout(() => void flushWrites(), 250);
    }
  });
}

// Nothing pending may be lost on page close.
window.addEventListener('pagehide', () => void flushWrites());

export async function getSettings(): Promise<SpeedDialSettings> {
  await flushWrites();
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY];
  if (isSpeedDialSettings(stored)) {
    const merged: SpeedDialSettings = {
      ...DEFAULT_SETTINGS,
      ...stored,
      background: { ...DEFAULT_SETTINGS.background, ...(stored.background as object | undefined) },
    };
    // One-time move off the old factory gradient so the wallpaper shows up for
    // installs that predate it. Idempotent: after the swap the test is false.
    const bg = merged.background;
    if (bg.type === 'gradient' && bg.gradientFrom === '#101322' && bg.gradientTo === '#232a45') {
      merged.background = { ...bg, type: 'image', imageData: DEFAULT_WALLPAPER, overlayDark: bg.overlayDark || 14 };
    }
    return merged;
  }
  return { ...DEFAULT_SETTINGS };
}

export async function saveSettings(settings: SpeedDialSettings): Promise<void> {
  return write(SETTINGS_KEY, settings);
}

export async function getSites(): Promise<SpeedDialItem[]> {
  await flushWrites();
  const result = await chrome.storage.local.get(SITES_KEY);
  const stored = result[SITES_KEY];
  if (Array.isArray(stored)) return stored as SpeedDialItem[];
  return [];
}

export async function saveSites(sites: SpeedDialItem[]): Promise<void> {
  return write(SITES_KEY, sites);
}

export async function resetAll(): Promise<void> {
  await flushWrites();
  await chrome.storage.local.remove([SETTINGS_KEY, SITES_KEY]);
}

export function createEmptyBackup(): BackupData {
  return {
    format: 'speed-dial-backup',
    version: 1,
    timestamp: new Date().toISOString(),
    sites: [],
    settings: DEFAULT_SETTINGS,
  };
}
