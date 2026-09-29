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
  { file: 'wallpapers/nebula.jpg', label: 'Nebula' },
  { file: 'wallpapers/golden-clouds.jpg', label: 'Golden Clouds' },
  { file: 'wallpapers/pastel-waves.jpg', label: 'Pastel Waves' },
  { file: 'wallpapers/neon-skyline.jpg', label: 'Neon Skyline' },
  { file: 'wallpapers/mountain-lake.jpg', label: 'Mountain Lake' },
  { file: 'wallpapers/floating-islands.jpg', label: 'Floating Islands' },
];

export const DEFAULT_WALLPAPER = WALLPAPERS[0].file;
