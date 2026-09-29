import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Link2, Type, Image as ImageIcon, Globe, MousePointerClick, Upload, Trash2, Palette } from 'lucide-react';
import type { SpeedDialItem, OpenBehavior } from '../types';
import { discoverFavicon, extractDomain, normalizeUserUrl, persistableFavicon, fetchSitePreview, letterForDomain } from '../services/faviconService';
import { imageFileToDataUrl } from '../utils/imageFile';
import { FieldLabel, SelectField } from './ui';

interface Props {
  initial?: SpeedDialItem;
  onSave: (data: { title: string; url: string; favicon?: string; customImage?: string; backgroundColor?: string; openBehavior?: OpenBehavior }) => void;
  onClose: () => void;
}

export function AddSiteModal({ initial, onSave, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [customImage, setCustomImage] = useState<string | undefined>(initial?.customImage);
  const [favicon, setFavicon] = useState<string | undefined>(initial?.favicon);
  const [preview, setPreview] = useState<string | undefined>(initial?.favicon);
  const [backgroundColor, setBackgroundColor] = useState(initial?.backgroundColor ?? '');
  const [openBehavior, setOpenBehavior] = useState<OpenBehavior | ''>(initial?.openBehavior ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [picking, setPicking] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fetchTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    dialogRef.current?.querySelector('input')?.focus();
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.clearTimeout(fetchTimer.current);
    };
  }, [onClose]);

  const handleUrlChange = useCallback((value: string) => {
    setUrl(value);
    setError('');
    setImageOptions([]);
    window.clearTimeout(fetchTimer.current);
    const normalized = normalizeUserUrl(value);
    if (!normalized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    // Debounced: one lookup per typed URL, not one per keystroke.
    fetchTimer.current = window.setTimeout(async () => {
      const [icon, page] = await Promise.all([
        discoverFavicon(normalized).catch(() => null),
        fetchSitePreview(normalized).catch(() => ({ title: undefined, images: [] as string[] })),
      ]);
      if (icon) {
        setFavicon(persistableFavicon(icon));
        // Only a real image may stand in for the card's icon — the browser's
        // stock placeholder would look like a favicon that failed to load.
        setPreview(icon.dataUrl);
      }
      setTitle(current => current || page.title || extractDomain(normalized));
      setImageOptions(page.images);
      setLoading(false);
    }, 450);
  }, []);

  const pickImage = useCallback(async (imageUrl: string) => {
    setPicking(imageUrl);
    setError('');
    try {
      const res = await fetch(imageUrl, { credentials: 'omit' });
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) throw new Error('not an image');
      setCustomImage(await imageFileToDataUrl(new File([blob], 'thumbnail', { type: blob.type })));
    } catch {
      setError('Could not load that image');
    } finally {
      setPicking(null);
    }
  }, []);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setError('');
    imageFileToDataUrl(file)
      .then(setCustomImage)
      .catch(() => setError('Could not read that image'));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUserUrl(url);
    if (!normalized) {
      setError('Please enter a valid URL');
      return;
    }
    onSave({
      title: title || extractDomain(normalized),
      url: normalized,
      favicon,
      customImage,
      backgroundColor: backgroundColor || undefined,
      openBehavior: openBehavior || undefined,
    });
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal site-modal" ref={dialogRef} role="dialog" aria-modal="true" aria-label={initial ? 'Edit site' : 'Add site'} onMouseDown={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{initial ? 'Edit site' : 'Add site'}</h2>
          <button className="icon-btn ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="site-form">
          <div className="form-group">
            <FieldLabel icon={Link2} htmlFor="site-url">URL</FieldLabel>
            <div className="input-affix">
              <Globe size={14} className="input-affix-icon" aria-hidden="true" />
              <input id="site-url" type="text" value={url} onChange={e => handleUrlChange(e.target.value)} placeholder="https://github.com" autoComplete="off" spellCheck={false} />
              {loading && <span className="input-spinner" aria-hidden="true" />}
            </div>
            {loading && <span className="loading-hint">Detecting icon…</span>}
          </div>

          <div className="form-group">
            <FieldLabel icon={Type} htmlFor="site-name">Name</FieldLabel>
            <input id="site-name" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Filled in from the URL" autoComplete="off" />
          </div>

          <div className="form-group">
            <FieldLabel icon={ImageIcon}>Thumbnail (optional)</FieldLabel>
            <div className="image-field">
              <div className={`image-preview ${customImage ? 'filled' : preview ? 'icon-only' : ''}`}>
                {customImage ? (
                  <img src={customImage} alt="Card preview" />
                ) : preview ? (
                  <img src={preview} alt="" className="as-icon" onError={() => setPreview(undefined)} />
                ) : favicon === '' ? (
                  <span className="preview-letter" aria-hidden="true">{letterForDomain(normalizeUserUrl(url) ?? url)}</span>
                ) : (
                  <ImageIcon size={20} aria-hidden="true" />
                )}
              </div>
              <div className="image-actions">
                <label className="btn btn-secondary file-btn">
                  <Upload size={14} /> Upload image
                  <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml" onChange={handleImageUpload} />
                </label>
                {customImage && (
                  <button type="button" className="btn btn-ghost" onClick={() => setCustomImage(undefined)}>
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
            <span className="setting-desc">
              Without an image the card shows a coloured tile.
            </span>
            {(preview || imageOptions.length > 0) && (
              <div>
                <span className="setting-desc">Images found on the site — click to use one:</span>
                <div className="og-options">
                  {preview && (
                    <button
                      type="button"
                      className="og-thumb icon"
                      onClick={() => { setCustomImage(undefined); setError(''); }}
                      aria-label="Use the site icon"
                      title="Use the site icon"
                    >
                      <img src={preview} alt="" onError={() => setPreview(undefined)} />
                    </button>
                  )}
                  {imageOptions.map(src => (
                    <button
                      key={src}
                      type="button"
                      className="og-thumb"
                      onClick={() => pickImage(src)}
                      disabled={picking !== null}
                      aria-label="Use this image"
                      title="Use this image"
                    >
                      <img src={src} alt="" loading="lazy" onError={e => { e.currentTarget.parentElement!.style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <FieldLabel icon={MousePointerClick} htmlFor="site-behavior">Open behavior</FieldLabel>
            <SelectField id="site-behavior" ariaLabel="Open behavior" value={openBehavior} onChange={v => setOpenBehavior(v as OpenBehavior | '')}>
              <option value="">Use default</option>
              <option value="same-tab">Same tab</option>
              <option value="new-tab">New tab</option>
              <option value="background-tab">New background tab</option>
              <option value="new-window">New window</option>
              <option value="incognito">Incognito window</option>
            </SelectField>
          </div>

          <div className="form-group">
            <FieldLabel icon={Palette} htmlFor="site-bg">Tint color (optional)</FieldLabel>
            <div className="tint-row">
              <input id="site-bg" className="color-input bare" type="color" value={backgroundColor || '#4c5fd5'} onChange={e => setBackgroundColor(e.target.value)} />
              <span className="setting-desc">Tints the card thumbnail.</span>
              {backgroundColor && (
                <button type="button" className="btn btn-ghost sm" onClick={() => setBackgroundColor('')}>Clear</button>
              )}
            </div>
          </div>

          {error && <div className="form-error" role="alert">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{initial ? 'Save changes' : 'Add site'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
