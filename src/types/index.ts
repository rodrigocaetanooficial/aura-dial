import { DEFAULT_WALLPAPER } from '../utils/wallpapers';

export type OpenBehavior = 'same-tab' | 'new-tab' | 'background-tab' | 'new-window' | 'incognito';

export type CardSize = 'small' | 'medium' | 'large' | 'custom';

export type Theme = 'light' | 'dark' | 'system';

export type Alignment = 'center' | 'left' | 'stretch';

export type BackgroundType = 'solid' | 'gradient' | 'image';

export interface BackgroundSettings {
  type: BackgroundType;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: number;
  imageData?: string;
  imageSize?: 'cover' | 'contain' | 'stretch';
  imagePosition?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  imageRepeat?: 'no-repeat' | 'repeat';
  blur?: number;
  brightness?: number;
  overlayDark?: number;
  overlayLight?: number;
  opacity?: number;
}

export interface SpeedDialItem {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  customImage?: string;
  position: number;
  backgroundColor?: string;
  openBehavior?: OpenBehavior;
  createdAt: string;
  updatedAt: string;
}

export interface SpeedDialSettings {
  columns: number | 'auto';
  cardSize: CardSize;
  customCardWidth?: number;
  customCardHeight?: number;
  gapX: number;
  gapY: number;
  alignment: Alignment;
  openBehavior: OpenBehavior;
  confirmBeforeDelete: boolean;
  showTooltips: boolean;
  showSiteNames: boolean;
  showSiteUrls: boolean;
  animations: boolean;
  theme: Theme;
  background: BackgroundSettings;
  cardBorderRadius: number;
  cardShadow: 'none' | 'subtle' | 'medium' | 'large';
  cardGlass: boolean;
  cardTransparency: number;
  showSearch: boolean;
  searchPosition: 'top' | 'bottom';
  showClock: boolean;
  showDate: boolean;
  clock24h: boolean;
}

export interface BackupData {
  format: 'speed-dial-backup';
  version: number;
  timestamp: string;
  sites: SpeedDialItem[];
  settings: SpeedDialSettings;
}

export const DEFAULT_SETTINGS: SpeedDialSettings = {
  columns: 'auto',
  cardSize: 'medium',
  customCardWidth: 160,
  customCardHeight: 120,
  gapX: 16,
  gapY: 16,
  alignment: 'center',
  openBehavior: 'new-tab',
  confirmBeforeDelete: true,
  showTooltips: true,
  showSiteNames: true,
  showSiteUrls: true,
  animations: true,
  theme: 'system',
  background: {
    type: 'image',
    imageData: DEFAULT_WALLPAPER,
    color: '#101322',
    gradientFrom: '#101322',
    gradientTo: '#232a45',
    gradientDirection: 160,
    imageSize: 'cover',
    imagePosition: 'center',
    imageRepeat: 'no-repeat',
    blur: 0,
    brightness: 100,
    overlayDark: 14,
    overlayLight: 0,
    opacity: 100,
  },
  cardBorderRadius: 12,
  cardShadow: 'subtle',
  cardGlass: false,
  cardTransparency: 0,
  showSearch: true,
  searchPosition: 'top',
  showClock: true,
  showDate: true,
  clock24h: true,
};

export const DEFAULT_BACKUP: BackupData = {
  format: 'speed-dial-backup',
  version: 1,
  timestamp: new Date().toISOString(),
  sites: [],
  settings: DEFAULT_SETTINGS,
};
