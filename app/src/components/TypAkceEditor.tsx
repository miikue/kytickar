import { useState, type FormEvent } from 'react';
import { getDefaultActionIcon, getDefaultIntervalDays, getDefaultSnoozeDays } from '../services/localDb';

type Props = {
  editingId: number | null;
  typAkceNazev: string;
  setTypAkceNazev: (nazev: string) => void;
  typAkceIkona: string;
  setTypAkceIkona: (ikona: string) => void;
  typAkceInterval: string;
  setTypAkceInterval: (val: string) => void;
  typAkceOdlozit: string;
  setTypAkceOdlozit: (val: string) => void;
  typAkceIsWatering: boolean;
  setTypAkceIsWatering: (val: boolean) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
  onDelete: (id: number) => Promise<void>;
  message: string | null;
};

const PRESET_ICONS = [
  { emoji: '💧', label: 'Zálivka' },
  { emoji: '🌱', label: 'Hnojení' },
  { emoji: '🪴', label: 'Přesazení' },
  { emoji: '💨', label: 'Rosení' },
  { emoji: '✂️', label: 'Stříhání' },
  { emoji: '🔍', label: 'Kontrola' },
  { emoji: '🧽', label: 'Otírání' },
  { emoji: '🧪', label: 'Ošetření' },
  { emoji: '☀️', label: 'Světlo' },
  { emoji: '🌡️', label: 'Teplota' },
  { emoji: '🐛', label: 'Škůdci' },
  { emoji: '🧤', label: 'Údržba' },
  { emoji: '🌸', label: 'Květy' },
  { emoji: '🚿', label: 'Sprcha' },
  { emoji: '⚡', label: 'Zásah' },
  { emoji: '🌿', label: 'Péče' },
];

export default function TypAkceEditor({
  editingId,
  typAkceNazev,
  setTypAkceNazev,
  typAkceIkona,
  setTypAkceIkona,
  typAkceInterval,
  setTypAkceInterval,
  typAkceOdlozit,
  setTypAkceOdlozit,
  typAkceIsWatering,
  setTypAkceIsWatering,
  onSubmit,
  onCancel,
  onDelete,
  message,
}: Props) {
  const [hasManuallyPickedIcon, setHasManuallyPickedIcon] = useState(editingId !== null);

  function handleNameChange(value: string) {
    setTypAkceNazev(value);
    // If user hasn't manually picked an emoji yet, auto-suggest based on what they type
    if (!hasManuallyPickedIcon && !editingId) {
      const suggested = getDefaultActionIcon(value);
      setTypAkceIkona(suggested);
      const defInterval = getDefaultIntervalDays(value);
      const defSnooze = getDefaultSnoozeDays(value);
      setTypAkceInterval(String(defInterval));
      setTypAkceOdlozit(String(defSnooze));
      if (value.toLowerCase().includes('zal')) {
        setTypAkceIsWatering(true);
      }
    }
  }

  function handlePickIcon(emoji: string) {
    setHasManuallyPickedIcon(true);
    setTypAkceIkona(emoji);
  }

  return (
    <article className="catalog-editor-card">
      <div className="catalog-editor-header">
        <h3 className="catalog-editor-title">
          {editingId ? `✏️ Upravit typ péče: ${typAkceNazev || ''}` : '✨ Nový typ péče / zásahu'}
        </h3>
        <button type="button" className="catalog-editor-close-btn" onClick={onCancel} aria-label="Zavřít">
          ✕
        </button>
      </div>

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Název zásahu nebo péče
          <input
            required
            placeholder="např. Zálivka, Přihnojení, Přesazení, Zástřih, Rosení"
            value={typAkceNazev}
            onChange={(event) => handleNameChange(event.target.value)}
          />
        </label>

        <div className="action-icon-field">
          <label className="action-icon-field-label">Emotikon / Ikona úkonu</label>
          <div className="action-icon-picker-row">
            <div className="action-icon-preview" title="Aktuálně vybraný emotikon">
              {typAkceIkona || '⚡'}
            </div>
            <input
              type="text"
              maxLength={4}
              className="action-icon-custom-input"
              placeholder="Vlastní např. 🚿"
              value={typAkceIkona}
              onChange={(e) => handlePickIcon(e.target.value)}
            />
          </div>

          <p className="action-icon-preset-hint">Rychlý výběr z oblíbených ikon:</p>
          <div className="action-icon-preset-grid">
            {PRESET_ICONS.map(({ emoji, label }) => {
              const isSelected = typAkceIkona === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`action-icon-preset-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => handlePickIcon(emoji)}
                  title={label}
                  aria-label={`${label} (${emoji})`}
                >
                  <span className="preset-emoji">{emoji}</span>
                  <span className="preset-label">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="action-timing-grid">
          <label className="action-timing-field">
            <span className="action-timing-label">⏱️ Interval připomínky (dny)</span>
            <input
              type="number"
              min="1"
              max="3650"
              required
              className="action-timing-input"
              placeholder="např. 7"
              value={typAkceInterval}
              onChange={(e) => setTypAkceInterval(e.target.value)}
            />
            <span className="action-timing-desc">Po kolika dnech se má úkon připomenout</span>
          </label>

          <label className="action-timing-field">
            <span className="action-timing-label">⏳ Odložení (dny)</span>
            <input
              type="number"
              min="1"
              max="365"
              required
              className="action-timing-input"
              placeholder="např. 2"
              value={typAkceOdlozit}
              onChange={(e) => setTypAkceOdlozit(e.target.value)}
            />
            <span className="action-timing-desc">O kolik dní se posune při kliknutí na „Odložit“</span>
          </label>
        </div>

        <div className="action-watering-checkbox-row">
          <label className="action-watering-checkbox-label">
            <input
              type="checkbox"
              checked={typAkceIsWatering}
              onChange={(e) => setTypAkceIsWatering(e.target.checked)}
            />
            <span className="action-watering-checkbox-text">
              💧 <strong>Považovat za zálivku</strong> (používá se pro rychlé zalévání, frontu péče a dny od zalití)
            </span>
          </label>
        </div>

        <div className="catalog-form-actions">
          <button className="catalog-btn-submit" type="submit">
            💾 {editingId ? 'Uložit změny' : 'Přidat typ péče'}
          </button>
          <button className="catalog-btn-cancel" type="button" onClick={onCancel}>
            Zrušit
          </button>
          {editingId && (
            <button
              className="catalog-btn-delete"
              type="button"
              onClick={() => {
                if (window.confirm(`Opravdu chcete smazat typ péče "${typAkceNazev}"?`)) {
                  onDelete(editingId);
                }
              }}
            >
              🗑️ Smazat
            </button>
          )}
        </div>
        {message && <div className="detail-care-feedback-badge">{message}</div>}
      </form>
    </article>
  );
}