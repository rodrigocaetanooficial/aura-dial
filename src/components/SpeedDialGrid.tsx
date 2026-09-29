import { useState, useRef, useCallback, forwardRef } from 'react';
import { Plus } from 'lucide-react';
import type { SpeedDialItem, SpeedDialSettings } from '../types';
import { SpeedDialCard } from './SpeedDialCard';
import { cardWidth } from '../utils/theme';

interface Props {
  sites: SpeedDialItem[];
  settings: SpeedDialSettings;
  columns: number;
  isFiltering: boolean;
  onReorder: (sites: SpeedDialItem[]) => void;
  onDelete: (id: string) => void;
  onEdit: (site: SpeedDialItem) => void;
  onChangeImage: (id: string, file: File) => void;
  onRefreshFavicon: (id: string) => void;
  onDuplicate: (id: string) => void;
  onAdd: () => void;
  onRequestConfirm: (opts: { title: string; message: React.ReactNode; confirmLabel: string; danger?: boolean; onConfirm: () => void }) => void;
}

export const SpeedDialGrid = forwardRef<HTMLDivElement, Props>(({
  sites, settings, columns, isFiltering,
  onReorder, onDelete, onEdit, onChangeImage, onRefreshFavicon, onDuplicate, onAdd, onRequestConfirm,
}, ref) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLElement | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    dragNode.current = e.target as HTMLElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(prev => (prev === index ? prev : index));
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...sites];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, sites, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // Cards have a hard max width; leftover space is centred by the grid, so a small
  // card size with few columns stays centred on the page instead of stretching.
  const stretch = settings.alignment === 'stretch';
  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: stretch
      ? `repeat(${columns}, minmax(0, 1fr))`
      : `repeat(${columns}, minmax(0, ${cardWidth(settings)}px))`,
    gap: `${settings.gapY}px ${settings.gapX}px`,
    justifyContent: settings.alignment === 'left' ? 'start' : stretch ? 'stretch' : 'center',
    ['--thumb-h' as string]: `${settings.customCardHeight ?? 120}px`,
  };

  return (
    <div className={`speed-dial-grid size-${settings.cardSize} align-${settings.alignment}`} style={gridStyle} ref={ref}>
      {sites.map((site, index) => (
        <SpeedDialCard
          key={site.id}
          site={site}
          settings={settings}
          index={index}
          isDragging={dragIndex === index}
          isDragOver={dragOverIndex === index && dragIndex !== index}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onDelete={onDelete}
          onEdit={onEdit}
          onChangeImage={onChangeImage}
          onRefreshFavicon={onRefreshFavicon}
          onDuplicate={onDuplicate}
          onRequestConfirm={onRequestConfirm}
        />
      ))}
      {!isFiltering && (
        <button
          className="add-card"
          onClick={onAdd}
          aria-label="Add site"
        >
          <span className="add-card-thumb">
            <span className="add-card-plus"><Plus size={22} /></span>
          </span>
          <span className="add-card-meta">
            <span className="add-card-label">Add site</span>
          </span>
        </button>
      )}
    </div>
  );
});

SpeedDialGrid.displayName = 'SpeedDialGrid';
