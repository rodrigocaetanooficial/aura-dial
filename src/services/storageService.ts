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

export async function getSettings(): Promise<SpeedDialSettings> {
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
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function getSites(): Promise<SpeedDialItem[]> {
  const result = await chrome.storage.local.get(SITES_KEY);
  const stored = result[SITES_KEY];
  if (Array.isArray(stored)) return stored as SpeedDialItem[];
  return [];
}

export async function saveSites(sites: SpeedDialItem[]): Promise<void> {
  await chrome.storage.local.set({ [SITES_KEY]: sites });
}

export async function resetAll(): Promise<void> {
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
