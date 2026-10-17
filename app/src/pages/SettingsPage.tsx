import { useEffect, useRef, useState } from 'react';
import { backupService, type StorageStats, type BackupStatus } from '../services/backupService';
import { notificationService, type NotificationSettings } from '../services/notificationService';
import { useBackButton } from '../hooks/useBackButton';
import { APP_VERSION } from '../config';

type Props = {
  onDataReload: () => Promise<void>;
};

export default function SettingsPage({ onDataReload }: Props) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(backupService.getBackupStatus());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zrušení potvrzovacího dialogu resetu přes tlačítko Zpět (priorita 40)
  useBackButton('settings-reset-confirm', 40, showResetConfirm, () => {
    setShowResetConfirm(false);
    return true;
  });

  // Notification state
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [notifLoading, setNotifLoading] = useState(false);
  const [nextScheduleInfo, setNextScheduleInfo] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      const s = await backupService.getStorageStats();
      setStats(s);
      setBackupStatus(backupService.getBackupStatus());
    } catch (err) {
      console.error('Chyba při načítání statistik:', err);
    }
  };

  const loadNotificationStatus = async () => {
    const s = notificationService.getSettings();
    setNotifSettings(s);
    const perm = await notificationService.checkPermission();
    setNotifPermission(perm);
    if (s.enabled && perm === 'granted') {
      const res = await notificationService.rescheduleAllReminders();
      if (res.nextReminderDate) {
        setNextScheduleInfo(`Příští připomenutí: ${res.nextReminderDate}`);
      } else {
        setNextScheduleInfo('Všechny kytičky jsou zalité a mají péči');
      }
    }
  };

  useEffect(() => {
    loadStats();
    loadNotificationStatus();

    const handleBackupCompleted = () => {
      setBackupStatus(backupService.getBackupStatus());
    };

    window.addEventListener('kytickar-backup-completed', handleBackupCompleted);
    return () => {
      window.removeEventListener('kytickar-backup-completed', handleBackupCompleted);
    };
  }, []);

  const handleToggleNotifications = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetEnabled = e.target.checked;
    setNotifLoading(true);
    setMessage(null);
    try {
      if (targetEnabled) {
        const perm = await notificationService.checkPermission();
        let granted = perm === 'granted';
        if (!granted) {
          granted = await notificationService.requestPermission();
        }
        setNotifPermission(granted ? 'granted' : 'denied');
        if (!granted) {
          setMessage({
            type: 'error',
            text: 'Oprávnění k odesílání notifikací nebylo uděleno v systému Android.',
          });
          const newSettings = { ...notifSettings, enabled: false };
          setNotifSettings(newSettings);
          await notificationService.saveSettings(newSettings);
          return;
        }

        const newSettings = { ...notifSettings, enabled: true };
        setNotifSettings(newSettings);
        await notificationService.saveSettings(newSettings);
        const res = await notificationService.rescheduleAllReminders();
        setMessage({
          type: 'success',
          text: `Připomínky aktivovány v ${newSettings.time}. Naplánováno ${res.scheduledCount} oznámení.`,
        });
        if (res.nextReminderDate) {
          setNextScheduleInfo(`Příští připomenutí: ${res.nextReminderDate}`);
        } else {
          setNextScheduleInfo('Všechny kytičky mají péči');
        }
      } else {
        const newSettings = { ...notifSettings, enabled: false };
        setNotifSettings(newSettings);
        await notificationService.saveSettings(newSettings);
        setNextScheduleInfo(null);
        setMessage({
          type: 'success',
          text: 'Automatické připomínky péče byly vypnuty.',
        });
      }
    } catch (err: any) {
      console.error('Chyba při změně notifikací:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Chyba při nastavení notifikací.',
      });
    } finally {
      setNotifLoading(false);
    }
  };

  const handleTimeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    const newSettings = { ...notifSettings, time: newTime };
    setNotifSettings(newSettings);
    await notificationService.saveSettings(newSettings);
    if (newSettings.enabled && notifPermission === 'granted') {
      const res = await notificationService.rescheduleAllReminders();
      if (res.nextReminderDate) {
        setNextScheduleInfo(`Příští připomenutí: ${res.nextReminderDate}`);
      }
    }
  };

  const handleTestNotification = async () => {
    setNotifLoading(true);
    setMessage(null);
    try {
      await notificationService.sendTestNotification();
      setNotifPermission('granted');
      setMessage({
        type: 'success',
        text: 'Zkušební notifikace byla odeslána! Zkontrolujte horní lištu telefonu.',
      });
    } catch (err: any) {
      console.error('Chyba testovací notifikace:', err);
      setMessage({
        type: 'error',
        text: err?.message || 'Nepodařilo se odeslat testovací notifikaci. Zkontrolujte oprávnění v systému Android.',
      });
    } finally {
      setNotifLoading(false);
    }
  };

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const isZip = lowerName.endsWith('.zip');
    const isJson = lowerName.endsWith('.json');

    if (!isZip && !isJson) {
      setMessage({
        type: 'error',
        text: 'Podporovány jsou pouze záložní soubory .ZIP nebo .JSON.',
      });
      return;
    }

    const confirmed = window.confirm(
      `Opravdu chcete obnovit data ze souboru "${file.name}"?\n\nUpozornění: Stávající rostliny, historie péče a fotografie budou nahrazeny obsahem této zálohy.`
    );
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      if (isZip) {
        const res = await backupService.importZipBackup(file);
        setMessage({
          type: 'success',
          text: `Záloha úspěšně obnovena: ${res.plantsImported} rostlin a ${res.photosImported} fotografií.`,
        });
      } else {
        const res = await backupService.importJsonBackup(file);
        setMessage({
          type: 'success',
          text: `JSON databáze úspěšně obnovena: ${res.plantsImported} rostlin.`,
        });
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
              <span className="stat-label">Fotografií celkem</span>
              <span className="stat-sublabel">
                {stats.userPhotosCount} vašich kytek · {stats.catalogPhotosCount} druhů
              </span>
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

      {/* Notifications card */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-title-group">
            <span className="settings-icon">🔔</span>
            <div>
              <h3 className="settings-card-title">Připomínky a Notifikace</h3>
              <p className="settings-card-desc">Upozornění na zálivku, hnojení a další péči</p>
            </div>
          </div>
        </div>

        <div className="settings-actions-list">
          {/* Toggle row */}
          <div className="settings-action-row">
            <div className="action-info">
              <strong>Povolit připomínky péče</strong>
              <span>
                {notifSettings.enabled
                  ? (notifPermission === 'granted'
                      ? (nextScheduleInfo || 'Notifikace jsou aktivní a naplánované')
                      : 'Čeká se na systémové povolení oznámení v Androidu')
                  : 'Automatická upozornění jsou vypnuta'}
              </span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notifSettings.enabled && notifPermission === 'granted'}
                onChange={handleToggleNotifications}
                disabled={notifLoading}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Time picker row (if enabled) */}
          {notifSettings.enabled && (
            <div className="settings-action-row">
              <div className="action-info">
                <strong>Čas ranního upozornění</strong>
                <span>V kolik hodin vás má telefon upozornit</span>
              </div>
              <input
                type="time"
                className="time-picker-input"
                value={notifSettings.time}
                onChange={handleTimeChange}
                disabled={notifLoading}
              />
            </div>
          )}

          {/* Test button & status row */}
          <div className="settings-action-row">
            <div className="action-info">
              <strong>Zkušební notifikace</strong>
              <span>Ověří zobrazení oznámení na liště telefonu</span>
            </div>
            <button
              type="button"
              className="action-button secondary"
              disabled={notifLoading}
              onClick={handleTestNotification}
            >
              🔔 Otestovat
            </button>
          </div>
        </div>
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

        {/* Dvouměsíční upozornění / doporučení na zálohu */}
        {backupStatus.isDue && (
          <div className="backup-due-alert">
            <span className="backup-due-icon">⏰</span>
            <div className="backup-due-text">
              <strong>Doporučení: Čas na zálohu</strong>
              <span>
                {backupStatus.lastBackupDate
                  ? `Od poslední zálohy uplynulo již ${backupStatus.daysSinceLastBackup} dní (doporučeno každé 2 měsíce). Stáhněte si čerstvý ZIP balíček.`
                  : 'Zatím jste nevytvořili žádnou zálohu. Doporučujeme stáhnout kompletní ZIP balíček pro případ ztráty nebo výměny telefonu.'}
              </span>
            </div>
          </div>
        )}

        <div className="backup-status-pill-wrap">
          <span className={`backup-status-pill ${backupStatus.isDue ? 'pill-due' : 'pill-ok'}`}>
            {backupStatus.lastBackupDate
              ? `Poslední záloha: ${backupStatus.lastBackupDate.toLocaleDateString('cs-CZ')} (před ${backupStatus.daysSinceLastBackup} dny)`
              : 'Poslední záloha: Zatím žádná'}
          </span>
          <span className="backup-interval-hint">Připomínka každé 2 měsíce</span>
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
            accept=".zip,.json,.ZIP,.JSON,application/zip,application/json"
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
            <p className="settings-card-desc">Verze {APP_VERSION} (Mobilní offline edice)</p>
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
