import { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* FieldLabel — 13px muted label with a discreet leading icon          */
/* ------------------------------------------------------------------ */
export function FieldLabel({ icon: Icon, children, htmlFor }: { icon?: LucideIcon; children: React.ReactNode; htmlFor?: string }) {
  return (
    <label className="field-label" htmlFor={htmlFor}>
      {Icon && <Icon className="field-label-icon" size={13} aria-hidden="true" />}
      <span>{children}</span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle — modern switch                                              */
/* ------------------------------------------------------------------ */
export function Toggle({ checked, onChange, labelledBy }: { checked: boolean; onChange: (v: boolean) => void; labelledBy?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      className={`toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Slider — range with filled track and live value                     */
/* ------------------------------------------------------------------ */
export function Slider({ value, min, max, step = 1, unit = '', onChange, ariaLabel }: {
  value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (v: number) => void; ariaLabel?: string;
}) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-row">
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={ariaLabel}
        style={{ '--fill': `${pct}%` } as React.CSSProperties}
        onChange={e => onChange(Number(e.target.value))}
      />
      <span className="slider-value">{value}{unit}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SegmentGroup — pill segmented control with sliding indicator        */
/* ------------------------------------------------------------------ */
export interface SegOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  title?: string;
}

export function SegmentGroup<T extends string | number>({ options, value, onChange, ariaLabel }: {
  options: SegOption<T>[]; value: T; onChange: (v: T) => void; ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const idx = options.findIndex(o => o.value === value);
    const btn = el.querySelectorAll<HTMLButtonElement>('.seg-btn')[idx];
    if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [options, value]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  return (
    <div className="segment" role="radiogroup" aria-label={ariaLabel}>
      <div className="seg-track" ref={ref} style={{ '--seg-left': `${thumb.left}px`, '--seg-width': `${thumb.width}px` } as React.CSSProperties}>
        <span className="seg-thumb" aria-hidden="true" />
        {options.map(o => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            title={o.title}
            className={`seg-btn ${o.value === value ? 'active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SelectField — styled select (value left, chevron pinned right)      */
/* ------------------------------------------------------------------ */
export function SelectField<T extends string>({ value, onChange, children, id, ariaLabel }: {
  value: T; onChange: (v: T) => void; children: React.ReactNode; id?: string; ariaLabel?: string;
}) {
  return (
    <div className="select-wrap">
      <select id={id} aria-label={ariaLabel} className="select" value={value} onChange={e => onChange(e.target.value as T)}>
        {children}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ColorField — swatch trigger for native color input                  */
/* ------------------------------------------------------------------ */
export function ColorField({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel?: string }) {
  return (
    <div className="color-field">
      <span className="color-swatch" style={{ background: value }} aria-hidden="true" />
      <span className="color-hex">{value.toLowerCase()}</span>
      <input
        type="color"
        className="color-input"
        value={value}
        aria-label={ariaLabel}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SettingRow — label + description on the left, control on the right  */
/* ------------------------------------------------------------------ */
export function SettingRow({ title, desc, icon: Icon, children, stack }: {
  title: string; desc?: string; icon?: LucideIcon; children: React.ReactNode; stack?: boolean;
}) {
  const titleId = `row-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className={`setting-row ${stack ? 'stack' : ''}`}>
      <div className="setting-info">
        <span className="setting-title" id={titleId}>
          {Icon && <Icon size={13} aria-hidden="true" className="setting-title-icon" />}
          {title}
        </span>
        {desc && <span className="setting-desc">{desc}</span>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SettingCard — grouped block with heading                            */
/* ------------------------------------------------------------------ */
export function SettingCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="setting-card">
      <header className="setting-card-head">
        <h3>{title}</h3>
        {desc && <p>{desc}</p>}
      </header>
      <div className="setting-card-body">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* ConfirmDialog — themed replacement for window.confirm               */
/* ------------------------------------------------------------------ */
export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: {
  title: string; message: React.ReactNode; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" role="alertdialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn ghost" onClick={onCancel} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-msg">{message}</div>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} onClick={onConfirm} autoFocus>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Button-ish file picker label                                        */
/* ------------------------------------------------------------------ */
export function FileButton({ accept, onFile, children, className = 'btn btn-secondary' }: {
  accept: string; onFile: (file: File) => void; children: React.ReactNode; className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()}>{children}</button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = '';
        }}
      />
    </>
  );
}
