import { useState, useCallback } from 'react';
import { Download, Upload, FileJson, FileText, RotateCcw, Database } from 'lucide-react';
import type { SpeedDialItem, SpeedDialSettings, BackupData } from '../types';
import { getSettings, saveSettings, getSites, saveSites, resetAll } from '../services/storageService';
import { exportBackup, validateBackup, mergeSites, replaceSites, summarizeBackup } from '../services/backupService';
import { applyTheme } from '../utils/theme';
import { SettingRow, SettingCard, FileButton, ConfirmDialog } from './ui';

interface Props {
  onToast: (message: string, type: 'success' | 'error') => void;
  onDataRestored?: () => void;
}

export function BackupPanel({ onToast, onDataRestored }: Props) {
  const [importData, setImportData] = useState<BackupData | null>(null);
  const [importSummary, setImportSummary] = useState<{ sites: number; customImages: number } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = useCallback(async () => {
    const sites = await getSites();
    const settings = await getSettings();
    const json = exportBackup(sites, settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `speed-dial-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('Backup exported', 'success');
  }, [onToast]);

  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const result = validateBackup(data);
        if (!result.valid || !result.backup) {
          onToast(`Invalid backup: ${result.reason}`, 'error');
          return;
        }
        setImportData(result.backup);
        setImportSummary(summarizeBackup(result.backup));
      } catch {
        onToast('Could not parse backup file', 'error');
      }
    };
    reader.readAsText(file);
  }, [onToast]);

  const handleImportConfirm = useCallback(async (mode: 'replace' | 'merge') => {
    if (!importData) return;
    const currentSites = await getSites();
    const newSites = mode === 'replace' ? replaceSites(importData.sites) : mergeSites(currentSites, importData.sites);
    await saveSites(newSites);
    await saveSettings(importData.settings);
    applyTheme(importData.settings);
    setImportData(null);
    setImportSummary(null);
    onToast(`Backup ${mode === 'replace' ? 'replaced' : 'merged'} successfully`, 'success');
    onDataRestored?.();
  }, [importData, onToast, onDataRestored]);

  const handleReset = useCallback(async () => {
    await resetAll();
    const { DEFAULT_SETTINGS } = await import('../types');
    applyTheme(DEFAULT_SETTINGS);
    setShowResetConfirm(false);
    onToast('Extension reset to defaults', 'success');
    onDataRestored?.();
  }, [onToast, onDataRestored]);

  const handleExportLinks = useCallback(async (format: 'json' | 'html') => {
    const sites = await getSites();
    let blob: Blob;
    let filename: string;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(sites, null, 2)], { type: 'application/json' });
      filename = 'speed-dial-links.json';
    } else {
      const html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten. DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${sites.map(s => `    <DT><A HREF="${s.url}">${s.title}</A>`).join('\n')}
</DL><p>`;
      blob = new Blob([html], { type: 'text/html' });
      filename = 'speed-dial-links.html';
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onToast(`Links exported as ${format.toUpperCase()}`, 'success');
  }, [onToast]);

  return (
    <>
      <SettingCard title="Full backup" desc="Sites, images and all settings in a single JSON file.">
        <SettingRow title="Export backup" desc="Download everything as a .json file." icon={Download}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export backup
          </button>
        </SettingRow>
        <SettingRow title="Import backup" desc="Restore from a previously exported .json file." icon={Upload}>
          <FileButton accept=".json,application/json" onFile={handleImportFile}>
            <Upload size={14} /> Import backup
          </FileButton>
        </SettingRow>
      </SettingCard>

      <SettingCard title="Export links" desc="Just the URLs — useful for bookmark tools.">
        <SettingRow title="Export as JSON" icon={FileJson}>
          <button className="btn btn-secondary" onClick={() => handleExportLinks('json')}>
            <FileJson size={14} /> JSON
          </button>
        </SettingRow>
        <SettingRow title="Export as bookmarks HTML" icon={FileText}>
          <button className="btn btn-secondary" onClick={() => handleExportLinks('html')}>
            <FileText size={14} /> HTML
          </button>
        </SettingRow>
      </SettingCard>

      <SettingCard title="Reset" desc="Remove all sites and restore default settings.">
        <SettingRow title="Reset extension" icon={RotateCcw}>
          <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
            <RotateCcw size={14} /> Reset extension
          </button>
        </SettingRow>
      </SettingCard>

      {importData && importSummary && (
        <div className="modal-overlay" onClick={() => { setImportData(null); setImportSummary(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Restore backup" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h2><Database size={18} aria-hidden="true" /> Restore backup</h2>
              <button className="icon-btn ghost" onClick={() => { setImportData(null); setImportSummary(null); }} aria-label="Close">×</button>
            </div>
            <div className="modal-msg">
              <p><strong>{importSummary.sites}</strong> sites · <strong>{importSummary.customImages}</strong> custom images · settings included</p>
            </div>
            <div className="modal-actions column">
              <button className="btn btn-primary" onClick={() => handleImportConfirm('replace')}>Replace current data</button>
              <button className="btn btn-secondary" onClick={() => handleImportConfirm('merge')}>Merge with current data</button>
              <button className="btn btn-ghost" onClick={() => { setImportData(null); setImportSummary(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <ConfirmDialog
          title="Reset extension"
          message="This deletes every site and restores the default settings. This cannot be undone."
          confirmLabel="Reset everything"
          danger
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </>
  );
}
