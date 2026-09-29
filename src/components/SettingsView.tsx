import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Settings2, LayoutGrid, Palette, Search, Clock, Gauge, Database,
  Sun, Moon, Monitor, X, ExternalLink, MousePointerClick, Sparkles,
  Type, Link2, AlignCenter, AlignLeft, Maximize2, Image as ImageIcon,
  Star, Info,
} from 'lucide-react';
import type {
  SpeedDialSettings, Theme, CardSize, Alignment,
  OpenBehavior, BackgroundType, BackgroundSettings,
} from '../types';
import { WALLPAPERS, DEFAULT_WALLPAPER } from '../utils/wallpapers';
import { imageFileToDataUrl } from '../utils/imageFile';
import {
  FieldLabel, Toggle, Slider, SegmentGroup, ColorField,
  SettingRow, SettingCard, FileButton,
} from './ui';
import { BackupPanel } from './BackupPanel';

export type SettingsPage = 'general' | 'layout' | 'appearance' | 'search' | 'clock' | 'behavior' | 'data';

interface NavItem {
  id: SettingsPage;
  label: string;
  icon: LucideIcon;
  group: string;
}

const NAV: NavItem[] = [
  { id: 'general', label: 'General', icon: Settings2, group: 'GENERAL' },
  { id: 'layout', label: 'Layout', icon: LayoutGrid, group: 'GENERAL' },
  { id: 'appearance', label: 'Appearance', icon: Palette, group: 'GENERAL' },
  { id: 'search', label: 'Search', icon: Search, group: 'NEW TAB' },
  { id: 'clock', label: 'Clock', icon: Clock, group: 'NEW TAB' },
  { id: 'behavior', label: 'Behavior', icon: Gauge, group: 'NEW TAB' },
  { id: 'data', label: 'Backup & Restore', icon: Database, group: 'DATA' },
];

const PAGE_META: Record<SettingsPage, { title: string; desc: string }> = {
  general: { title: 'General', desc: 'Theme and the information shown on your cards.' },
  layout: { title: 'Layout', desc: 'Columns, card size and how the grid uses space.' },
  appearance: { title: 'Appearance', desc: 'Colors, backgrounds and the look of the cards.' },
  search: { title: 'Search', desc: 'The search box at the top of your new tab.' },
  clock: { title: 'Clock', desc: 'Time and date shown beside your sites.' },
  behavior: { title: 'Behavior', desc: 'Where links open and general safeguards.' },
  data: { title: 'Backup & Restore', desc: 'Export, import and reset your data.' },
};

const GRADIENT_PRESETS: Array<[string, string]> = [
  ['#101322', '#232a45'],
  ['#1c1129', '#3b2a5e'],
  ['#0b2530', '#14504f'],
  ['#241421', '#58305a'],
  ['#152238', '#2c5f8a'],
  ['#26210f', '#5c4a1e'],
  ['#f2f3f8', '#dfe3f0'],
  ['#fdf3ec', '#f5ded0'],
  ['#eef4f1', '#d9e8e0'],
  ['#f4eef8', '#e3d6f0'],
];

interface Props {
  settings: SpeedDialSettings;
  onLiveChange: (s: SpeedDialSettings) => void;
  initialPage?: SettingsPage;
  onClose?: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
  onDataRestored?: () => void;
}

export function SettingsView({
  settings, onLiveChange, initialPage = 'general', onClose, onToast, onDataRestored,
}: Props) {
  const [page, setPage] = useState<SettingsPage>(initialPage);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (partial: Partial<SpeedDialSettings>) => onLiveChange({ ...settings, ...partial });
  const updateBg = (partial: Partial<BackgroundSettings>) =>
    onLiveChange({ ...settings, background: { ...settings.background, ...partial } });

  const bg = settings.background;

  const renderGroups = () => {
    const groups = Array.from(new Set(NAV.map(n => n.group)));
    return groups.map(g => (
      <div className="settings-nav-group" key={g}>
        <span className="settings-nav-heading">{g}</span>
        {NAV.filter(n => n.group === g).map(n => (
          <button
            key={n.id}
            className={`settings-nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => setPage(n.id)}
            aria-current={page === n.id ? 'page' : undefined}
          >
            <n.icon size={22} aria-hidden="true" />
            {n.label}
          </button>
        ))}
      </div>
    ));
  };

  const renderPage = () => {
    switch (page) {
      case 'general':
        return (
          <>
            <SettingCard title="Theme" desc="Choose your preferred interface theme.">
              <SettingRow title="Mode">
                <SegmentGroup<Theme>
                  ariaLabel="Theme"
                  value={settings.theme}
                  onChange={v => update({ theme: v })}
                  options={[
                    { value: 'light', label: <><Sun size={13} /> Light</>, title: 'Light' },
                    { value: 'dark', label: <><Moon size={13} /> Dark</>, title: 'Dark' },
                    { value: 'system', label: <><Monitor size={13} /> System</>, title: 'Follow the browser' },
                  ]}
                />
              </SettingRow>
            </SettingCard>

            <SettingCard title="Card information" desc="What each card displays under its thumbnail.">
              <SettingRow title="Show site name" desc="Under the thumbnail. Turn off for a thumbnail-only grid." icon={Type}>
                <Toggle checked={settings.showSiteNames} onChange={v => update({ showSiteNames: v })} />
              </SettingRow>
              <SettingRow title="Show domains" desc="Small grey domain under the name." icon={Link2}>
                <Toggle checked={settings.showSiteUrls} onChange={v => update({ showSiteUrls: v })} />
              </SettingRow>
              <SettingRow title="Show tooltips" desc="Full URL when hovering a card." icon={Info}>
                <Toggle checked={settings.showTooltips} onChange={v => update({ showTooltips: v })} />
              </SettingRow>
            </SettingCard>
          </>
        );

      case 'layout':
        return (
          <>
            <SettingCard title="Columns" desc="How many cards fit in a row. Auto adapts to your window.">
              <SegmentGroup<string>
                ariaLabel="Columns"
                value={settings.columns === 'auto' ? 'auto' : String(settings.columns)}
                onChange={v => update({ columns: v === 'auto' ? 'auto' : parseInt(v, 10) })}
                options={[
                  { value: 'auto', label: 'Auto' },
                  ...([3, 4, 5, 6, 7, 8, 9, 10] as const).map(n => ({ value: String(n), label: String(n) })),
                ]}
              />
            </SettingCard>

            <SettingCard title="Card size" desc="Bigger cards show more image; smaller fit more sites.">
              <div className="size-previews">
                {(['small', 'medium', 'large', 'custom'] as const).map(size => (
                  <button
                    key={size}
                    className={`size-preview ${settings.cardSize === size ? 'active' : ''}`}
                    onClick={() => update({ cardSize: size as CardSize })}
                    aria-pressed={settings.cardSize === size}
                  >
                    <span className={`size-preview-card sp-${size}`}>
                      <span className="size-preview-thumb" />
                      <span className="size-preview-line" />
                    </span>
                    <span className="size-preview-label">
                      {size[0].toUpperCase() + size.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
              {settings.cardSize === 'custom' && (
                <div className="custom-size-rows">
                  <SettingRow title="Card width" desc="Minimum width of each column.">
                    <Slider value={settings.customCardWidth ?? 160} min={100} max={320} unit="px" onChange={v => update({ customCardWidth: v })} ariaLabel="Card width" />
                  </SettingRow>
                  <SettingRow title="Thumb height" desc="Height of the image area.">
                    <Slider value={settings.customCardHeight ?? 120} min={72} max={260} unit="px" onChange={v => update({ customCardHeight: v })} ariaLabel="Thumb height" />
                  </SettingRow>
                </div>
              )}
            </SettingCard>

            <SettingCard title="Spacing & alignment">
              <SettingRow title="Horizontal gap">
                <Slider value={settings.gapX} min={4} max={48} unit="px" onChange={v => update({ gapX: v })} ariaLabel="Horizontal gap" />
              </SettingRow>
              <SettingRow title="Vertical gap">
                <Slider value={settings.gapY} min={4} max={48} unit="px" onChange={v => update({ gapY: v })} ariaLabel="Vertical gap" />
              </SettingRow>
              <SettingRow title="Grid alignment">
                <SegmentGroup<Alignment>
                  ariaLabel="Grid alignment"
                  value={settings.alignment}
                  onChange={v => update({ alignment: v })}
                  options={[
                    { value: 'center', label: <><AlignCenter size={13} /> Center</>, title: 'Centre the grid when there is room left' },
                    { value: 'left', label: <><AlignLeft size={13} /> Left</>, title: 'Align cards to the left edge' },
                    { value: 'stretch', label: <><Maximize2 size={13} /> Stretch</>, title: 'Cards grow to fill the full width' },
                  ]}
                />
              </SettingRow>
            </SettingCard>
          </>
        );

      case 'appearance':
        return (
          <>
            <SettingCard title="Background" desc="Solid color, gradient, or a wallpaper behind your sites.">
              <SegmentGroup<BackgroundType>
                ariaLabel="Background type"
                value={bg.type}
                onChange={v => updateBg({ type: v })}
                options={[
                  { value: 'solid', label: 'Solid color' },
                  { value: 'gradient', label: 'Gradient' },
                  { value: 'image', label: 'Image' },
                ]}
              />

              {bg.type === 'solid' && (
                <div className="bg-editor">
                  <SettingRow title="Color">
                    <ColorField value={bg.color ?? '#101322'} onChange={v => updateBg({ color: v })} ariaLabel="Background color" />
                  </SettingRow>
                </div>
              )}

              {bg.type === 'gradient' && (
                <div className="bg-editor">
                  <div className="gradient-presets">
                    {GRADIENT_PRESETS.map(([a, b]) => (
                      <button
                        key={`${a}${b}`}
                        className={`gradient-dot ${bg.gradientFrom === a && bg.gradientTo === b ? 'active' : ''}`}
                        style={{ background: `linear-gradient(160deg, ${a}, ${b})` }}
                        title={`${a} to ${b}`}
                        onClick={() => updateBg({ gradientFrom: a, gradientTo: b })}
                      />
                    ))}
                  </div>
                  <div className="bg-colors-row">
                    <FieldLabel icon={Sparkles}>Colors</FieldLabel>
                    <ColorField value={bg.gradientFrom ?? '#101322'} onChange={v => updateBg({ gradientFrom: v })} ariaLabel="Gradient start color" />
                    <span className="bg-colors-arrow" aria-hidden="true">to</span>
                    <ColorField value={bg.gradientTo ?? '#232a45'} onChange={v => updateBg({ gradientTo: v })} ariaLabel="Gradient end color" />
                  </div>
                  <SettingRow title="Direction">
                    <Slider value={bg.gradientDirection ?? 160} min={0} max={360} unit="°" onChange={v => updateBg({ gradientDirection: v })} ariaLabel="Gradient direction" />
                  </SettingRow>
                </div>
              )}

              {bg.type === 'image' && (
                <div className="bg-editor">
                  <div className="wallpaper-presets">
                    {WALLPAPERS.map(w => (
                      <button
                        key={w.file}
                        type="button"
                        className={`wallpaper-thumb ${bg.imageData === w.file ? 'active' : ''}`}
                        style={{ backgroundImage: `url("${w.file}")` }}
                        title={w.label}
                        aria-label={`${w.label} wallpaper`}
                        aria-pressed={bg.imageData === w.file}
                        onClick={() => updateBg({ imageData: w.file })}
                      />
                    ))}
                  </div>
                  <div
                    className="wallpaper-preview"
                    style={bg.imageData ? { backgroundImage: `url("${bg.imageData}")` } : undefined}
                  >
                    {!bg.imageData && (
                      <div className="wallpaper-empty">
                        <ImageIcon size={22} aria-hidden="true" />
                        <span>Choose an image to use as your wallpaper</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-actions-row">
                    <FileButton
                      accept="image/*"
                      onFile={file => {
                        imageFileToDataUrl(file)
                          .then(data => updateBg({ imageData: data }))
                          .catch(() => onToast('Could not read that image', 'error'));
                      }}
                    >
                      <ImageIcon size={14} /> Upload your own
                    </FileButton>
                    {bg.imageData !== DEFAULT_WALLPAPER && (
                      <button className="btn btn-ghost" onClick={() => updateBg({ imageData: DEFAULT_WALLPAPER })}>
                        <X size={14} /> Reset
                      </button>
                    )}
                  </div>
                  {bg.imageData && (
                    <div className="wallpaper-controls">
                      <SettingRow title="Fit">
                        <SegmentGroup<'cover' | 'contain' | 'stretch'>
                          ariaLabel="Image fit"
                          value={bg.imageSize ?? 'cover'}
                          onChange={v => updateBg({ imageSize: v })}
                          options={[
                            { value: 'cover', label: 'Cover' },
                            { value: 'contain', label: 'Contain' },
                            { value: 'stretch', label: 'Stretch' },
                          ]}
                        />
                      </SettingRow>
                      <SettingRow title="Position">
                        <SegmentGroup<'center' | 'top' | 'bottom' | 'left' | 'right'>
                          ariaLabel="Image position"
                          value={bg.imagePosition ?? 'center'}
                          onChange={v => updateBg({ imagePosition: v })}
                          options={[
                            { value: 'center', label: 'Center' },
                            { value: 'top', label: 'Top' },
                            { value: 'bottom', label: 'Bottom' },
                            { value: 'left', label: 'Left' },
                            { value: 'right', label: 'Right' },
                          ]}
                        />
                      </SettingRow>
                      <SettingRow title="Brightness">
                        <Slider value={bg.brightness ?? 100} min={30} max={160} unit="%" onChange={v => updateBg({ brightness: v })} ariaLabel="Brightness" />
                      </SettingRow>
                      <SettingRow title="Blur">
                        <Slider value={bg.blur ?? 0} min={0} max={40} unit="px" onChange={v => updateBg({ blur: v })} ariaLabel="Blur" />
                      </SettingRow>
                      <SettingRow title="Dark overlay" desc="Keeps text readable on bright wallpapers.">
                        <Slider value={bg.overlayDark ?? 0} min={0} max={80} unit="%" onChange={v => updateBg({ overlayDark: v })} ariaLabel="Dark overlay" />
                      </SettingRow>
                      <SettingRow title="Light overlay">
                        <Slider value={bg.overlayLight ?? 0} min={0} max={80} unit="%" onChange={v => updateBg({ overlayLight: v })} ariaLabel="Light overlay" />
                      </SettingRow>
                    </div>
                  )}
                </div>
              )}
            </SettingCard>

            <SettingCard title="Cards" desc="Surface, corners and depth of each card.">
              <SettingRow title="Corner radius">
                <Slider value={settings.cardBorderRadius} min={0} max={28} unit="px" onChange={v => update({ cardBorderRadius: v })} ariaLabel="Corner radius" />
              </SettingRow>
              <SettingRow title="Shadow">
                <SegmentGroup<'none' | 'subtle' | 'medium' | 'large'>
                  ariaLabel="Card shadow"
                  value={settings.cardShadow}
                  onChange={v => update({ cardShadow: v })}
                  options={[
                    { value: 'none', label: 'None' },
                    { value: 'subtle', label: 'Subtle' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                  ]}
                />
              </SettingRow>
              <SettingRow title="Glass effect" desc="Frosted translucency — best over wallpapers.">
                <Toggle checked={settings.cardGlass} onChange={v => update({ cardGlass: v })} />
              </SettingRow>
              <SettingRow title="Card transparency">
                <Slider value={settings.cardTransparency} min={0} max={60} unit="%" onChange={v => update({ cardTransparency: v })} ariaLabel="Card transparency" />
              </SettingRow>
            </SettingCard>
          </>
        );

      case 'search':
        return (
          <SettingCard title="Search box" desc="Instantly filter your sites. Works with Ctrl+K / Cmd+K.">
            <SettingRow title="Show search bar">
              <Toggle checked={settings.showSearch} onChange={v => update({ showSearch: v })} />
            </SettingRow>
            {settings.showSearch && (
              <SettingRow title="Position">
                <SegmentGroup<'top' | 'bottom'>
                  ariaLabel="Search position"
                  value={settings.searchPosition}
                  onChange={v => update({ searchPosition: v })}
                  options={[
                    { value: 'top', label: 'Top' },
                    { value: 'bottom', label: 'Bottom' },
                  ]}
                />
              </SettingRow>
            )}
          </SettingCard>
        );

      case 'clock':
        return (
          <SettingCard title="Clock & date">
            <SettingRow title="Show clock" desc="Live time above the grid.">
              <Toggle checked={settings.showClock} onChange={v => update({ showClock: v })} />
            </SettingRow>
            <SettingRow title="Show date">
              <Toggle checked={settings.showDate} onChange={v => update({ showDate: v })} />
            </SettingRow>
            <SettingRow title="24-hour format">
              <Toggle checked={settings.clock24h} onChange={v => update({ clock24h: v })} />
            </SettingRow>
          </SettingCard>
        );

      case 'behavior': {
        const behaviors: Array<[OpenBehavior, string, string]> = [
          ['new-tab', 'New tab', 'Opens next to the new tab'],
          ['same-tab', 'Same tab', 'Replaces the new tab'],
          ['background-tab', 'Background tab', 'Opens without switching'],
          ['new-window', 'New window', 'A separate browser window'],
          ['incognito', 'Incognito', 'Private window'],
        ];
        return (
          <>
            <SettingCard title="Opening sites" desc="Where links open when you click a card.">
              <div className="behavior-grid">
                {behaviors.map(([val, label, hint]) => (
                  <button
                    key={val}
                    className={`choice-card ${settings.openBehavior === val ? 'active' : ''}`}
                    onClick={() => update({ openBehavior: val })}
                    aria-pressed={settings.openBehavior === val}
                  >
                    <ExternalLink size={15} className="choice-card-icon" />
                    <span className="choice-card-title">{label}</span>
                    <span className="choice-card-hint">{hint}</span>
                  </button>
                ))}
              </div>
              <p className="settings-note">
                <MousePointerClick size={12} aria-hidden="true" />
                Individual cards can override this from their Edit dialog.
              </p>
            </SettingCard>

            <SettingCard title="Safety & motion">
              <SettingRow title="Confirm before deleting" desc="Ask before removing a card.">
                <Toggle checked={settings.confirmBeforeDelete} onChange={v => update({ confirmBeforeDelete: v })} />
              </SettingRow>
              <SettingRow title="Animations" desc="Hover, drag and entrance motion.">
                <Toggle checked={settings.animations} onChange={v => update({ animations: v })} />
              </SettingRow>
            </SettingCard>
          </>
        );
      }

      case 'data':
        return <BackupPanel onToast={onToast} onDataRestored={onDataRestored} />;
    }
  };

  return (
    <div className="settings-shell">
      <header className="settings-topbar">
        <div className="settings-topbar-title">
          <Star size={16} className="settings-topbar-icon" aria-hidden="true" />
          <span>Aura Dial Settings</span>
        </div>
        {onClose && (
          <button className="btn btn-ghost" onClick={onClose}>
            <X size={15} /> Close
          </button>
        )}
      </header>

      <div className="settings-body">
        <nav className="settings-nav" aria-label="Settings sections">{renderGroups()}</nav>

        <div className="settings-main">
          <div className="settings-page-head">
            <h1>{PAGE_META[page].title}</h1>
            <p>{PAGE_META[page].desc}</p>
          </div>

          {renderPage()}

          <div className="settings-live-note">
            <Info size={12} aria-hidden="true" /> Changes are saved automatically and apply live.
          </div>
        </div>
      </div>
    </div>
  );
}
