import { useState, useCallback, useRef, useEffect } from 'react';
import { MoreVertical, ExternalLink, Pencil, Image as ImageIcon, RefreshCw, Copy, Trash2 } from 'lucide-react';
import type { SpeedDialItem, SpeedDialSettings } from '../types';
import { letterForDomain, extractDomain, faviconApiUrl } from '../services/faviconService';
import { hueFromString } from '../utils/theme';

interface Props {
  site: SpeedDialItem;
  settings: SpeedDialSettings;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onEdit: (site: SpeedDialItem) => void;
  onChangeImage: (id: string, file: File) => void;
  onRefreshFavicon: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRequestConfirm: (opts: { title: string; message: React.ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void }) => void;
}

export function SpeedDialCard({
  site, settings, index, isDragging, isDragOver,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onDelete, onEdit, onChangeImage, onRefreshFavicon, onDuplicate, onRequestConfirm,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuUp, setMenuUp] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [faviconError, setFaviconError] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // A new image deserves a new try — without this a single failure kills the card for good.
  useEffect(() => {
    setImgError(false);
    setFaviconError(false);
  }, [site.customImage, site.favicon, site.url]);

  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    window.addEventListener('click', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', close);
    };
  }, [showMenu]);

  const openUrl = useCallback(() => {
    const behavior = site.openBehavior ?? settings.openBehavior;
    // window.open cannot open a background tab from a new-tab page; the tabs API can.
    const tabs = typeof chrome !== 'undefined' ? chrome.tabs : undefined;
    const wins = typeof chrome !== 'undefined' ? chrome.windows : undefined;
    try {
      switch (behavior) {
        case 'same-tab':
          window.location.href = site.url;
          break;
        case 'background-tab':
          if (tabs?.create) tabs.create({ url: site.url, active: false });
          else window.open(site.url, '_blank', 'noopener');
          break;
        case 'new-window':
          if (wins?.create) wins.create({ url: site.url });
          else window.open(site.url, '_blank', 'width=1200,height=800');
          break;
        case 'incognito':
          if (!wins?.create) { window.open(site.url, '_blank'); break; }
          wins.create({ url: site.url, incognito: true })
            .catch(() => tabs?.create({ url: site.url, active: false }));
          break;
        case 'new-tab':
        default:
          if (tabs?.create) tabs.create({ url: site.url, active: true });
          else window.open(site.url, '_blank');
          break;
      }
    } catch {
      window.open(site.url, '_blank');
    }
  }, [site, settings.openBehavior]);

  const handleDelete = useCallback(() => {
    if (settings.confirmBeforeDelete) {
      onRequestConfirm({
        title: 'Delete site',
        message: <>Delete <strong>{site.title}</strong>? You can undo right after.</>,
        confirmLabel: 'Delete',
        danger: true,
        onConfirm: () => onDelete(site.id),
      });
    } else {
      onDelete(site.id);
    }
  }, [site, settings.confirmBeforeDelete, onDelete, onRequestConfirm]);

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!showMenu && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuUp(rect.bottom + 260 > window.innerHeight);
    }
    setShowMenu(v => !v);
  }, [showMenu]);

  const domain = extractDomain(site.url);
  const hue = hueFromString(domain);
  // Fall back to the browser's own favicon cache so every card gets a real icon.
  const faviconSrc = site.favicon ?? faviconApiUrl(site.url);
  const showImage = !!site.customImage && !imgError;
  const showFavicon = !!faviconSrc && !faviconError;
  // Without a custom image the site icon is the thumbnail's main image.
  const thumbIcon = !showImage;
  const letter = letterForDomain(site.url);

  const cardStyle: React.CSSProperties = {
    ['--card-hue' as string]: String(hue),
  };

  return (
    <div
      className={[
        'speed-dial-card',
        settings.showSiteNames ? '' : 'no-meta',
        isDragging ? 'dragging' : '',
        isDragOver ? 'drag-over' : '',
      ].join(' ')}
      style={cardStyle}
      draggable
      onDragStart={e => onDragStart(e, index)}
      onDragOver={e => onDragOver(e, index)}
      onDrop={e => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onClick={openUrl}
      title={settings.showTooltips ? `${site.title}\n${site.url}` : undefined}
      role="link"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openUrl(); }
        if (e.key === 'Escape') setShowMenu(false);
      }}
    >
      <div
        className={`card-thumb ${showImage ? 'has-image' : 'tinted'}`}
        style={site.backgroundColor ? { background: site.backgroundColor } : undefined}
      >
        {showImage && (
          <img src={site.customImage} alt="" className="thumb-img" loading="lazy" onError={() => setImgError(true)} />
        )}
        {thumbIcon && showFavicon && (
          <img src={faviconSrc} alt="" className="thumb-favicon" loading="lazy" onError={() => setFaviconError(true)} />
        )}
        {thumbIcon && !showFavicon && (
          <span className="thumb-letter" aria-hidden="true">{letter}</span>
        )}
        <span className="thumb-sheen" aria-hidden="true" />
      </div>

      {settings.showSiteNames ? (
        <div className="card-meta">
          <span className={`card-favicon ${showFavicon ? '' : 'letter'}`} aria-hidden="true">
            {showFavicon
              ? <img src={faviconSrc} alt="" loading="lazy" onError={() => setFaviconError(true)} />
              : letter}
          </span>
          <div className="card-text">
            <div className="card-title">{site.title}</div>
            {settings.showSiteUrls && <div className="card-url">{domain}</div>}
          </div>
          <button
            ref={menuBtnRef}
            className={`card-menu-btn ${showMenu ? 'menu-open' : ''}`}
            onClick={toggleMenu}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
            aria-label={`Options for ${site.title}`}
            aria-haspopup="menu"
            aria-expanded={showMenu}
            tabIndex={-1}
          >
            <MoreVertical size={15} />
          </button>
        </div>
      ) : (
        <button
          ref={menuBtnRef}
          className={`card-menu-btn floating ${showMenu ? 'menu-open' : ''}`}
          onClick={toggleMenu}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') e.stopPropagation(); }}
          aria-label={`Options for ${site.title}`}
          aria-haspopup="menu"
          aria-expanded={showMenu}
          tabIndex={-1}
        >
          <MoreVertical size={15} />
        </button>
      )}

      {showMenu && (
        <div className={`card-menu ${menuUp ? 'up' : ''}`} role="menu" onClick={e => e.stopPropagation()}>
          <button role="menuitem" onClick={() => { openUrl(); setShowMenu(false); }}>
            <ExternalLink size={14} /> Open
          </button>
          <button role="menuitem" onClick={() => { onEdit(site); setShowMenu(false); }}>
            <Pencil size={14} /> Edit
          </button>
          <button role="menuitem" onClick={() => { fileRef.current?.click(); setShowMenu(false); }}>
            <ImageIcon size={14} /> Change image
          </button>
          <button role="menuitem" onClick={() => { onRefreshFavicon(site.id); setShowMenu(false); }}>
            <RefreshCw size={14} /> Refresh favicon
          </button>
          <button role="menuitem" onClick={() => { onDuplicate(site.id); setShowMenu(false); }}>
            <Copy size={14} /> Duplicate
          </button>
          <div className="card-menu-sep" />
          <button role="menuitem" className="danger" onClick={() => { handleDelete(); setShowMenu(false); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onChangeImage(site.id, f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
