import type { SpeedDialSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const SETTINGS_KEY = 'speed-dial-settings';
const SITES_KEY = 'speed-dial-sites';

export async function loadSettings(): Promise<SpeedDialSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] ?? {}) };
}

export async function saveSettings(settings: SpeedDialSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function loadSites() {
  const result = await chrome.storage.local.get(SITES_KEY);
  return (result[SITES_KEY] ?? []) as unknown[];
}

export async function saveSites(sites: unknown[]): Promise<void> {
  await chrome.storage.local.set({ [SITES_KEY]: sites });
}
