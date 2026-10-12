import { useEffect, useRef, useState } from 'react';
import { backupService, type StorageStats } from '../services/backupService';

type Props = {
  onDataReload: () => Promise<void>;
};

export default function SettingsPage({ onDataReload }: Props) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStats = async () => {
    try {
      const s = await backupService.getStorageStats();
      setStats(s);
    } catch (err) {
      console.error('Chyba pri nacitani statistik:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleExportZip = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await backupService.exportZipBackup();
      setMessage({
        type: 'success',
        text: `Záloha úspěšně uložena: ${res.filename} (${res.sizeKb} KB).`,
      });
      await loadStats();
    } catch (err: any) {
      if (err?.message?.includes('zrušeno')) {
        return;
      }
      console.error('Chyba exportu ZIP:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Chyba při exportu ZIP zálohy.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await backupService.exportJsonBackup();
      setMessage({
        type: 'success',
        text: `JSON databáze úspěšně uložena: ${res.filename} (${res.sizeKb} KB).`,
      });
    } catch (err: any) {
      if (err?.message?.includes('zrušeno')) {
        return;
      }
      console.error('Chyba exportu JSON:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Chyba při exportu JSON souboru.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);
    try {
      if (file.name.endsWith('.zip')) {
        const res = await backupService.importZipBackup(file);
        setMessage({
          type: 'success',
          text: `Záloha obnovena: ${res.plantsImported} rostlin a ${res.photosImported} fotografií.`,
        });
      } else if (file.name.endsWith('.json')) {
        const res = await backupService.importJsonBackup(file);
        setMessage({
          type: 'success',
          text: `JSON databáze obnovena: ${res.plantsImported} rostlin.`,
        });
      } else {
        throw new Error('Podporovány jsou pouze soubory .zip nebo .json');
      }

      await onDataReload();
      await loadStats();
    } catch (err: any) {
      console.error('Chyba importu:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Chyba při importu souboru.',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    setLoading(true);
    setMessage(null);
    try {
      await backupService.resetToDefault();
      await onDataReload();
      await loadStats();
      setMessage({
        type: 'success',
        text: 'Výchozí data byla úspěšně obnovena.',
      });
    } catch (err) {
      console.error('Chyba resetu:', err);
      setMessage({
        type: 'error',
        text: 'Chyba při obnově výchozích dat.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="settings-screen">
      <header className="mobile-page-header">
        <h2 className="mobile-page-title">Nastavení a data</h2>
        <p className="mobile-page-subtitle">Správa offline úložiště, export a zálohování</p>
      </header>

      {message && (
        <div className={`settings-banner ${message.type === 'success' ? 'banner-success' : 'banner-error'}`}>
          <span className="banner-icon">{message.type === 'success' ? '✅' : '⚠️'}</span>
          <span className="banner-text">{message.text}</span>
          <button type="button" className="banner-close" onClick={() => setMessage(null)} aria-label="Zavřít">
            ✕
          </button>
        </div>
      )}

      {/* Storage statistics card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title-group">
            <span className="settings-icon">📊</span>
            <div>
              <h3 className="settings-card-title">Stav úložiště</h3>
              <p className="settings-card-desc">Lokální IndexedDB v zařízení</p>
            </div>
          </div>
          <button
            type="button"
            className="settings-refresh-btn"
            onClick={loadStats}
            title="Aktualizovat statistiky"
            aria-label="Aktualizovat"
          >
            🔄
          </button>
        </div>

        {stats ? (
          <div className="settings-stats-grid">
            <div className="stat-box">
              <span className="stat-number">{stats.rostlinyCount}</span>
              <span className="stat-label">Rostlin</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats.druhyCount}</span>
              <span className="stat-label">Druhů</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats.photosCount}</span>
              <span className="stat-label">Fotografií</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{stats.historieCount}</span>
              <span className="stat-label">Záznamů péče</span>
            </div>
            <div className="stat-box stat-full">
              <span className="stat-number">{stats.approximateSizeKb} KB</span>
              <span className="stat-label">Přibližná velikost dat v zařízení</span>
            </div>
          </div>
        ) : (
          <div className="settings-loading-stats">Načítání údajů o úložišti...</div>
        )}
      </div>

      {/* Backup and export section */}
      <div className="settings-card">
        <div className="settings-card-title-group">
          <span className="settings-icon">📦</span>
          <div>
            <h3 className="settings-card-title">Zálohování a Export</h3>
            <p className="settings-card-desc">Uložte si své kytičky i fotografie do souboru</p>
          </div>
        </div>

        <div className="settings-actions-list">
          <div className="settings-action-row">
            <div className="action-info">
              <strong>Kompletní ZIP balíček</strong>
              <span>Obsahuje databázi db.json a složku s fotkami</span>
            </div>
            <button
              type="button"
              className="action-button primary"
              disabled={loading}
              onClick={handleExportZip}
            >
              📥 Exportovat ZIP
            </button>
          </div>

          <div className="settings-action-row">
            <div className="action-info">
              <strong>Pouze databáze (JSON)</strong>
              <span>Rychlý export textových dat a historie</span>
            </div>
            <button
              type="button"
              className="action-button secondary"
              disabled={loading}
              onClick={handleExportJson}
            >
              📄 Exportovat JSON
            </button>
          </div>
        </div>
      </div>

      {/* Import and restore section */}
      <div className="settings-card">
        <div className="settings-card-title-group">
          <span className="settings-icon">📤</span>
          <div>
            <h3 className="settings-card-title">Obnova a Import</h3>
            <p className="settings-card-desc">Nahrajte dříve vytvořenou zálohu</p>
          </div>
        </div>

        <div className="import-box">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.json"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            id="backup-file-input"
          />
          <button
            type="button"
            className="import-dropzone"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="dropzone-icon">📁</span>
            <strong>Vybrat záložní soubor</strong>
            <span className="dropzone-hint">Podporuje .ZIP (včetně fotek) nebo .JSON databázi</span>
          </button>
        </div>
      </div>

      {/* Reset to defaults */}
      <div className="settings-card danger-card">
        <div className="settings-card-title-group">
          <span className="settings-icon">⚠️</span>
          <div>
            <h3 className="settings-card-title">Výchozí data</h3>
            <p className="settings-card-desc">Vrátit aplikaci do původního ukázkového stavu</p>
          </div>
        </div>

        {!showResetConfirm ? (
          <button
            type="button"
            className="action-button danger"
            disabled={loading}
            onClick={() => setShowResetConfirm(true)}
          >
            🔄 Obnovit výchozí data aplikace
          </button>
        ) : (
          <div className="reset-confirm-box">
            <p className="confirm-warning">
              Opravdu chcete přepsat současná data výchozím balíčkem? Současné kytky a záznamy budou nahrazeny.
            </p>
            <div className="confirm-buttons">
              <button
                type="button"
                className="action-button danger"
                disabled={loading}
                onClick={handleReset}
              >
                Ano, resetovat
              </button>
              <button
                type="button"
                className="action-button secondary"
                disabled={loading}
                onClick={() => setShowResetConfirm(false)}
              >
                Zrušit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* About section */}
      <div className="settings-card about-card">
        <div className="settings-card-title-group">
          <span className="settings-icon">🌿</span>
          <div>
            <h3 className="settings-card-title">O aplikaci Kytičkář</h3>
            <p className="settings-card-desc">Verze 1.0.0 (Mobilní offline edice)</p>
          </div>
        </div>

        <div className="about-content">
          <p className="about-text">
            Kytičkář funguje zcela autonomně bez závislosti na externím serveru. Veškeré informace o zalévání,
            hnojení, umístění a pořízené fotografie jsou bezpečně uloženy přímo ve vašem mobilním telefonu.
          </p>
          <div className="about-meta">
            <span>© 2026 Kytičkář</span>
            <span>Aplikace pro milovníky pokojovek</span>
          </div>
        </div>
      </div>
    </section>
  );
}
