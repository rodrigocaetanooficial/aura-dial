/**
 * Built-in wallpapers shipped with the extension (files live in public/wallpapers).
 * Paths are relative to the extension root so they work in newtab.html unchanged.
 */
export interface WallpaperPreset {
  file: string;
  label: string;
}

export const WALLPAPERS: WallpaperPreset[] = [
  { file: 'wallpapers/valley.webp', label: 'Valley' },
  { file: 'wallpapers/fjord.webp', label: 'Fjord' },
  { file: 'wallpapers/highlands.webp', label: 'Highlands' },
  { file: 'wallpapers/waterfall.webp', label: 'Waterfall' },
  { file: 'wallpapers/coast.webp', label: 'Coast' },
];

export const DEFAULT_WALLPAPER = WALLPAPERS[0].file;
