import type { SpeedDialItem, SpeedDialSettings, BackupData } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function validateBackup(data: unknown): { valid: boolean; reason?: string; backup?: BackupData } {
  if (typeof data !== 'object' || data === null) return { valid: false, reason: 'Not an object' };
  const d = data as Record<string, unknown>;
  if (d.format !== 'speed-dial-backup') return { valid: false, reason: 'Invalid format identifier' };
  if (typeof d.version !== 'number' || d.version < 1) return { valid: false, reason: 'Invalid version' };
  if (!Array.isArray(d.sites)) return { valid: false, reason: 'Sites missing or invalid' };
  if (typeof d.settings !== 'object' || d.settings === null) return { valid: false, reason: 'Settings missing or invalid' };
  const sites = d.sites as SpeedDialItem[];
  for (const s of sites) {
    if (typeof s.id !== 'string' || typeof s.url !== 'string') return { valid: false, reason: 'Site missing id or url' };
  }
  return { valid: true, backup: d as unknown as BackupData };
}

export function summarizeBackup(backup: BackupData): { sites: number; customImages: number } {
  const customImages = backup.sites.filter(s => s.customImage).length;
  return { sites: backup.sites.length, customImages };
}

export function exportBackup(sites: SpeedDialItem[], settings: SpeedDialSettings): string {
  const backup: BackupData = {
    format: 'speed-dial-backup',
    version: 1,
    timestamp: new Date().toISOString(),
    sites,
    settings,
  };
  return JSON.stringify(backup, null, 2);
}

export function mergeSites(existing: SpeedDialItem[], incoming: SpeedDialItem[]): SpeedDialItem[] {
  const map = new Map<string, SpeedDialItem>();
  for (const s of existing) map.set(s.id, s);
  for (const s of incoming) map.set(s.id, s);
  return Array.from(map.values()).sort((a, b) => a.position - b.position);
}

export function replaceSites(incoming: SpeedDialItem[]): SpeedDialItem[] {
  return [...incoming].sort((a, b) => a.position - b.position);
}

export function resetToDefaults(): { settings: SpeedDialSettings } {
  return { settings: DEFAULT_SETTINGS };
}
