import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Settings, LayoutGrid, Search as SearchIcon } from 'lucide-react';
import type { SpeedDialItem, SpeedDialSettings } from '../types';
import { getSettings, saveSettings, getSites, saveSites } from '../services/storageService';
import { applyTheme, computeColumns } from '../utils/theme';
import { imageFileToDataUrl } from '../utils/imageFile';
import { SpeedDialGrid } from '../components/SpeedDialGrid';
import { AddSiteModal } from '../components/AddSiteModal';
import { SettingsView } from '../components/SettingsView';
import { SearchBar } from '../components/SearchBar';
import { Clock } from '../components/Clock';
import { Toast } from '../components/Toast';
import { ConfirmDialog } from '../components/ui';
import { generateId } from '../services/backupService';

interface ConfirmOpts {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

export function NewTabPage() {
  const [settings, setSettings] = useState<SpeedDialSettings | null>(null);
  const [sites, setSites] = useState<SpeedDialItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingSite, setEditingSite] = useState<SpeedDialItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; action?: { label: string; onClick: () => void } } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmOpts | null>(null);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getSettings(), getSites()]).then(([s, items]) => {
      setSettings(s);
      setSites(items.sort((a, b) => a.position - b.position));
    });
  }, []);

  useEffect(() => {
    if (settings) applyTheme(settings);
  }, [settings]);

  useEffect(() => {
    const onResize = () => setContainerWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success', action?: { label: string; onClick: () => void }) => {
    setToast({ message, type, action });
  }, []);

  const updateSettings = useCallback(async (next: SpeedDialSettings) => {
    setSettings(next);
    try {
      await saveSettings(next);
    } catch {
      showToast('Not saved — browser storage is full', 'error');
    }
  }, [showToast]);

  const updateSites = useCallback(async (next: SpeedDialItem[]) => {
    setSites(next);
    try {
      await saveSites(next);
    } catch {
      showToast('Not saved — browser storage is full', 'error');
    }
  }, [showToast]);

  const handleAddSite = useCallback(async (data: { title: string; url: string; favicon?: string; customImage?: string; backgroundColor?: string; openBehavior?: SpeedDialItem['openBehavior'] }) => {
    const newItem: SpeedDialItem = {
      id: generateId(),
      title: data.title,
      url: data.url,
      favicon: data.favicon,
      customImage: data.customImage,
      backgroundColor: data.backgroundColor,
      openBehavior: data.openBehavior,
      position: sites.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await updateSites([...sites, newItem]);
    setShowAddModal(false);
    showToast('Site added');
  }, [sites, updateSites, showToast]);

  const handleEditSite = useCallback(async (data: { title: string; url: string; favicon?: string; customImage?: string; backgroundColor?: string; openBehavior?: SpeedDialItem['openBehavior'] }) => {
    if (!editingSite) return;
    const updated = sites.map(s => s.id === editingSite.id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s);
    await updateSites(updated);
    setEditingSite(null);
    setShowAddModal(false);
    showToast('Site updated');
  }, [editingSite, sites, updateSites, showToast]);

  const handleDeleteSite = useCallback(async (id: string) => {
    const index = sites.findIndex(s => s.id === id);
    const deleted = sites[index];
    const next = sites.filter(s => s.id !== id).map((s, i) => ({ ...s, position: i }));
    await updateSites(next);
    if (deleted) {
      showToast('Site deleted', 'success', {
        label: 'Undo',
        onClick: () => {
          const restored = [...sites.filter(s => s.id !== id)];
          restored.splice(Math.min(index, restored.length), 0, deleted);
          updateSites(restored.map((s, i) => ({ ...s, position: i })));
          setToast(null);
        },
      });
    }
  }, [sites, updateSites, showToast]);

  const handleReorder = useCallback(async (next: SpeedDialItem[]) => {
    const reindexed = next.map((s, i) => ({ ...s, position: i }));
    await updateSites(reindexed);
  }, [updateSites]);

  const handleChangeImage = useCallback(async (id: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    try {
      const customImage = await imageFileToDataUrl(file);
      const next = sites.map(s => s.id === id ? { ...s, customImage, updatedAt: new Date().toISOString() } : s);
      await updateSites(next);
      showToast('Image changed');
    } catch {
      showToast('Could not read that image', 'error');
    }
  }, [sites, updateSites, showToast]);

  const handleRefreshFavicon = useCallback(async (id: string) => {
    const site = sites.find(s => s.id === id);
    if (!site) return;
    try {
      // Must go to the network: the cached icon is the one already on the card.
      const { fetchFaviconFromSite } = await import('../services/faviconService');
      // '' means "resolved: no icon" — the card falls back to the site initial.
      const favicon = (await fetchFaviconFromSite(site.url)) ?? '';
      const next = sites.map(s => s.id === id ? { ...s, favicon, updatedAt: new Date().toISOString() } : s);
      await updateSites(next);
      showToast(favicon ? 'Favicon refreshed' : 'No icon found — showing the site initial');
    } catch {
      showToast('Could not refresh favicon', 'error');
    }
  }, [sites, updateSites, showToast]);

  const handleDuplicate = useCallback(async (id: string) => {
    const site = sites.find(s => s.id === id);
    if (!site) return;
    const dup: SpeedDialItem = {
      ...site,
      id: generateId(),
      title: `${site.title} (copy)`,
      position: sites.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await updateSites([...sites, dup]);
    showToast('Site duplicated');
  }, [sites, updateSites, showToast]);

  const filteredSites = searchQuery
    ? sites.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.url.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sites;

  if (!settings) {
    return <div className="loading">Loading…</div>;
  }

  const columns = computeColumns(settings, containerWidth);
  const isEmpty = sites.length === 0;
  const noResults = !isEmpty && filteredSites.length === 0;

  return (
    <div className="newtab-page">
      <div className="page-overlay" />

      <div className="page-actions">
        <button className="gear-btn" onClick={() => setShowSettings(true)} aria-label="Settings" title="Settings">
          <Settings size={23} />
        </button>
      </div>

      <div className="page-content">
        <header className="hero">
          {settings.showSearch && settings.searchPosition === 'top' && (
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          )}
        </header>

        {isEmpty ? (
          <div className="empty-state">
            <div className="empty-icon"><LayoutGrid size={26} /></div>
            <h2>Your Aura Dial is empty</h2>
            <p>Add your favorite websites to get started.</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={15} /> Add your first site
            </button>
          </div>
        ) : noResults ? (
          <div className="empty-state">
            <div className="empty-icon"><SearchIcon size={26} /></div>
            <h2>No matches</h2>
            <p>Nothing matches “{searchQuery}”.</p>
            <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>Clear search</button>
          </div>
        ) : (
          <SpeedDialGrid
            ref={gridRef}
            sites={filteredSites}
            settings={settings}
            columns={columns}
            isFiltering={!!searchQuery}
            onReorder={handleReorder}
            onDelete={handleDeleteSite}
            onEdit={site => { setEditingSite(site); setShowAddModal(true); }}
            onChangeImage={handleChangeImage}
            onRefreshFavicon={handleRefreshFavicon}
            onDuplicate={handleDuplicate}
            onAdd={() => setShowAddModal(true)}
            onRequestConfirm={setConfirm}
          />
        )}

        {settings.showSearch && settings.searchPosition === 'bottom' && (
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        )}
      </div>

      {(settings.showClock || settings.showDate) && (
        <div className="page-clock">
          <Clock showClock={settings.showClock} showDate={settings.showDate} clock24h={settings.clock24h} />
        </div>
      )}

      {showAddModal && (
        <AddSiteModal
          initial={editingSite ?? undefined}
          onSave={editingSite ? handleEditSite : handleAddSite}
          onClose={() => { setShowAddModal(false); setEditingSite(null); }}
        />
      )}

      {showSettings && settings && (
        <div className="settings-overlay" onClick={() => setShowSettings(false)}>
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            onClick={e => e.stopPropagation()}
          >
            <SettingsView
              settings={settings}
              onLiveChange={updateSettings}
              onClose={() => setShowSettings(false)}
              onToast={showToast}
              onDataRestored={async () => {
                const items = await getSites();
                setSites(items.sort((a, b) => a.position - b.position));
              }}
            />
          </div>
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={confirm.danger}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          action={toast.action}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
