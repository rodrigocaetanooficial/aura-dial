import { useState, useEffect, useCallback } from 'react';
import type { SpeedDialSettings } from '../types';
import { getSettings, saveSettings } from '../services/storageService';
import { applyTheme } from '../utils/theme';
import { SettingsView } from '../components/SettingsView';
import { Toast } from '../components/Toast';

export function OptionsPage() {
  const [settings, setSettings] = useState<SpeedDialSettings | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      applyTheme(s);
    });
  }, []);

  const update = useCallback(async (next: SpeedDialSettings) => {
    setSettings(next);
    await saveSettings(next);
    applyTheme(next);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  if (!settings) return <div className="loading">Loading…</div>;

  return (
    <div className="options-page">
      <SettingsView
        settings={settings}
        onLiveChange={update}
        onToast={showToast}
        onDataRestored={async () => {
          const s = await getSettings();
          setSettings(s);
          applyTheme(s);
        }}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
