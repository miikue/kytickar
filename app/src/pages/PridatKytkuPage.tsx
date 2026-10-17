import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { getFileUrl } from '../api/http';
import type { Druh, Medium, Rod, Umisteni } from '../types/app';
import PhotoSourceModal from '../components/PhotoSourceModal';
import { useBackButton } from '../hooks/useBackButton';

type NewPlantForm = {
  vlastniJmeno: string;
  druhId: string;
  mediumId: string;
  umisteniId: string;
  aktualniZdravi: string;
};

type Props = {
  form: NewPlantForm;
  setForm: (updater: (prev: NewPlantForm) => NewPlantForm) => void;
  initialPhoto: File | null;
  setInitialPhoto: (photo: File | null) => void;
  initialPhotoMessage: string | null;
  setInitialPhotoMessage: (message: string | null) => void;
  druhy: Druh[];
  rody: Rod[];
  media: Medium[];
  umisteni: Umisteni[];
  onSubmit: (event: FormEvent) => Promise<void>;
  message: string | null;
  showNewDruhForm: boolean;
  setShowNewDruhForm: (show: boolean) => void;
  newDruhNazev: string;
  setNewDruhNazev: (nazev: string) => void;
  newDruhPopis: string;
  setNewDruhPopis: (popis: string) => void;
  newDruhMessage: string | null;
  newDruhRodId: string;
  setNewDruhRodId: (rodId: string) => void;
  showNewDruhRodForm: boolean;
  setShowNewDruhRodForm: (show: boolean) => void;
  newDruhRodNazev: string;
  setNewDruhRodNazev: (nazev: string) => void;
  newDruhRodPopis: string;
  setNewDruhRodPopis: (popis: string) => void;
  newDruhRodMessage: string | null;
  createInlineDruh: () => Promise<void>;
  createInlineDruhRod: () => Promise<void>;
  showNewMediumForm: boolean;
  setShowNewMediumForm: (show: boolean) => void;
  newMediumNazev: string;
  setNewMediumNazev: (nazev: string) => void;
  newMediumPopis: string;
  setNewMediumPopis: (popis: string) => void;
  newMediumMessage: string | null;
  createInlineMedium: () => Promise<void>;
  showNewUmisteniForm: boolean;
  setShowNewUmisteniForm: (show: boolean) => void;
  newUmisteniNazev: string;
  setNewUmisteniNazev: (nazev: string) => void;
  newUmisteniMessage: string | null;
  createInlineUmisteni: () => Promise<void>;
  onCancel?: () => void;
};

const HEALTH_LEVELS = [
  { value: '5', label: 'Výborný', icon: '💚', desc: 'Vitální a zdravá' },
  { value: '4', label: 'Dobrý', icon: '🌱', desc: 'Standardní stav' },
  { value: '3', label: 'Průměrný', icon: '🌿', desc: 'Mírná únava' },
  { value: '2', label: 'Oslabená', icon: '🍂', desc: 'Potřebuje péči' },
  { value: '1', label: 'Kritický', icon: '🥀', desc: 'Velmi špatný stav' },
];

export default function PridatKytkuPage({
  form,
  setForm,
  initialPhoto,
  setInitialPhoto,
  initialPhotoMessage,
  setInitialPhotoMessage,
  druhy,
  rody,
  media,
  umisteni,
  onSubmit,
  message,
  showNewDruhForm,
  setShowNewDruhForm,
  newDruhNazev,
  setNewDruhNazev,
  newDruhPopis,
  setNewDruhPopis,
  newDruhMessage,
  newDruhRodId,
  setNewDruhRodId,
  showNewDruhRodForm,
  setShowNewDruhRodForm,
  newDruhRodNazev,
  setNewDruhRodNazev,
  newDruhRodPopis,
  setNewDruhRodPopis,
  newDruhRodMessage,
  createInlineDruh,
  createInlineDruhRod,
  showNewMediumForm,
  setShowNewMediumForm,
  newMediumNazev,
  setNewMediumNazev,
  newMediumPopis,
  setNewMediumPopis,
  newMediumMessage,
  createInlineMedium,
  showNewUmisteniForm,
  setShowNewUmisteniForm,
  newUmisteniNazev,
  setNewUmisteniNazev,
  newUmisteniMessage,
  createInlineUmisteni,
  onCancel,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedRodFilterId, setSelectedRodFilterId] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // 1. Výběr fotky fotoaparát / galerie (priorita 100)
  useBackButton('pridat-photo-modal', 100, isPhotoModalOpen, () => {
    setIsPhotoModalOpen(false);
    return true;
  });

  // 2. Podformulář pro nový rod uvnitř druhu (priorita 85)
  useBackButton('pridat-druh-rod-form', 85, showNewDruhRodForm, () => {
    setShowNewDruhRodForm(false);
    return true;
  });

  // 3. Modál pro nový druh (priorita 80)
  useBackButton('pridat-druh-form', 80, showNewDruhForm, () => {
    setShowNewDruhForm(false);
    return true;
  });

  // 4. Modál pro nový substrát (priorita 80)
  useBackButton('pridat-medium-form', 80, showNewMediumForm, () => {
    setShowNewMediumForm(false);
    return true;
  });

  // 5. Modál pro nové umístění (priorita 80)
  useBackButton('pridat-umisteni-form', 80, showNewUmisteniForm, () => {
    setShowNewUmisteniForm(false);
    return true;
  });

  useEffect(() => {
    if (!initialPhoto) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(initialPhoto);
    setPhotoPreview(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [initialPhoto]);

  // ESC key listener to close active overlay modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showNewDruhForm) setShowNewDruhForm(false);
        if (showNewMediumForm) setShowNewMediumForm(false);
        if (showNewUmisteniForm) setShowNewUmisteniForm(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewDruhForm, showNewMediumForm, showNewUmisteniForm, setShowNewDruhForm, setShowNewMediumForm, setShowNewUmisteniForm]);

  const selectedDruh = druhy.find((item) => String(item.id) === form.druhId) || null;
  const selectedDruhRodNazev = selectedDruh
    ? selectedDruh.rod?.nazev || rody.find((rod) => rod.id === selectedDruh.rodId)?.nazev || null
    : null;

  const filteredDruhy = useMemo(() => {
    if (selectedRodFilterId) {
      return druhy.filter((item) => String(item.rodId || '') === selectedRodFilterId);
    }
    return druhy;
  }, [druhy, selectedRodFilterId]);

  return (
    <div className="add-plant-form-wrapper">
      <form className="add-plant-form" onSubmit={onSubmit}>
        {/* 1. Fotografie kytičky */}
        <section className="add-plant-section photo-section">
          <div className="add-section-header">
            <span className="add-section-icon">📷</span>
            <div>
              <h3 className="add-section-title">Úvodní fotografie</h3>
              <p className="add-section-subtitle">Přidejte fotografii pro rychlou identifikaci</p>
            </div>
          </div>

          {photoPreview ? (
            <div className="add-plant-photo-preview-wrap">
              <img src={photoPreview} alt="Náhled kytičky" className="add-plant-photo-img" />
              <div className="add-plant-photo-overlay">
                <span className="photo-badge">📷 Vybraná fotografie</span>
                <div className="photo-actions">
                  <button
                    type="button"
                    className="photo-action-btn secondary"
                    onClick={() => setIsPhotoModalOpen(true)}
                  >
                    🔄 Změnit
                  </button>
                  <button
                    type="button"
                    className="photo-action-btn danger"
                    onClick={() => {
                      setInitialPhoto(null);
                      setInitialPhotoMessage(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    ✕ Odstranit
                  </button>
                </div>
              </div>
              <div className="photo-meta-info">
                <span className="photo-meta-name">{initialPhoto?.name}</span>
                {initialPhoto?.size ? (
                  <span className="photo-meta-size">{Math.round(initialPhoto.size / 1024)} KB</span>
                ) : null}
              </div>
            </div>
          ) : (
            <div
              className="add-plant-photo-dropzone"
              onClick={() => setIsPhotoModalOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setIsPhotoModalOpen(true);
                }
              }}
            >
              <div className="photo-dropzone-icon">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span className="photo-dropzone-title">Vybrat nebo vyfotit kytičku</span>
              <span className="photo-dropzone-desc">Klepnutím otevřete fotoaparát nebo galerii</span>
              <span className="photo-dropzone-btn">+ Přidat fotku</span>
            </div>
          )}

          <PhotoSourceModal
            isOpen={isPhotoModalOpen}
            onClose={() => setIsPhotoModalOpen(false)}
            onPhotoSelected={(file) => {
              setInitialPhoto(file);
              setInitialPhotoMessage(null);
            }}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(event) => {
              setInitialPhoto(event.target.files?.[0] || null);
              setInitialPhotoMessage(null);
            }}
          />

          {initialPhotoMessage && <p className="add-field-feedback info">{initialPhotoMessage}</p>}
        </section>

        {/* 2. Základní identifikace */}
        <section className="add-plant-section">
          <div className="add-section-header">
            <span className="add-section-icon">🏷️</span>
            <div>
              <h3 className="add-section-title">Pojmenování</h3>
              <p className="add-section-subtitle">Vlastní název, pod kterým kytku znáte</p>
            </div>
          </div>

          <div className="add-field-group">
            <label className="add-field-label" htmlFor="plant-name-input">
              Název kytičky <span className="required-star">*</span>
            </label>
            <div className="add-input-wrapper">
              <span className="add-input-prefix">🪴</span>
              <input
                id="plant-name-input"
                required
                className="add-text-input"
                placeholder="např. Zuzanka, Velká monstera v rohu..."
                value={form.vlastniJmeno}
                onChange={(event) => setForm((prev) => ({ ...prev, vlastniJmeno: event.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* 3. Botanický Druh & Rod */}
        <section className="add-plant-section">
          <div className="add-section-header">
            <span className="add-section-icon">🌿</span>
            <div>
              <h3 className="add-section-title">Botanický Druh & Rod</h3>
              <p className="add-section-subtitle">Určete botanický druh nebo přidejte nový</p>
            </div>
          </div>

          {/* Volitelný filtr podle rodu */}
          <div className="add-rod-filter-row">
            <label className="add-sublabel" htmlFor="rod-filter-select">
              Filtrovat podle rodu:
            </label>
            <select
              id="rod-filter-select"
              className="add-select-compact"
              value={selectedRodFilterId}
              onChange={(event) => {
                const nextRodId = event.target.value;
                setSelectedRodFilterId(nextRodId);
              }}
            >
              <option value="">Všechny rody ({rody.length})</option>
              {rody.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nazev}
                </option>
              ))}
            </select>
          </div>

          {/* Výběr druhu */}
          <div className="add-field-group">
            <label className="add-field-label" htmlFor="druh-select">
              Druh rostliny <span className="required-star">*</span>
            </label>
            <div className="add-picker-action-row">
              <select
                id="druh-select"
                required
                className="add-select-input"
                value={form.druhId}
                onChange={(event) => setForm((prev) => ({ ...prev, druhId: event.target.value }))}
              >
                <option value="">-- Vyberte druh rostliny --</option>
                {filteredDruhy.map((item) => {
                  const rodName = item.rod?.nazev || rody.find((r) => r.id === item.rodId)?.nazev;
                  return (
                    <option key={item.id} value={item.id}>
                      {item.nazev} {rodName ? `(${rodName})` : ''}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                className="add-inline-toggle-btn"
                onClick={() => setShowNewDruhForm(true)}
              >
                + Nový druh
              </button>
            </div>
          </div>

          {/* Karta vybraného druhu */}
          {selectedDruh && (
            <div className="selected-druh-card">
              <div className="selected-druh-thumb-wrap">
                {selectedDruh.fotka1Name ? (
                  <img
                    src={getFileUrl(selectedDruh.fotka1Name)}
                    alt={selectedDruh.nazev}
                    className="selected-druh-thumb"
                  />
                ) : (
                  <span className="selected-druh-placeholder">🌿</span>
                )}
              </div>
              <div className="selected-druh-details">
                <span className="selected-druh-badge">🌱 Rod: {selectedDruhRodNazev || 'Neuveden'}</span>
                <h4 className="selected-druh-name">{selectedDruh.nazev}</h4>
                {selectedDruh.popis && <p className="selected-druh-desc">{selectedDruh.popis}</p>}
              </div>
            </div>
          )}
        </section>

        {/* 4. Substrát & Umístění */}
        <section className="add-plant-section">
          <div className="add-section-header">
            <span className="add-section-icon">🪴</span>
            <div>
              <h3 className="add-section-title">Pěstování & Umístění</h3>
              <p className="add-section-subtitle">Kde kytička bydlí a v čem roste</p>
            </div>
          </div>

          {/* Substrát / Médium */}
          <div className="add-field-group">
            <label className="add-field-label" htmlFor="medium-select">
              Substrát / Pěstební médium
            </label>
            <div className="add-picker-action-row">
              <div className="add-icon-select-wrap">
                <span className="add-icon-prefix">🪴</span>
                <select
                  id="medium-select"
                  className="add-select-input with-prefix"
                  value={form.mediumId}
                  onChange={(event) => setForm((prev) => ({ ...prev, mediumId: event.target.value }))}
                >
                  <option value="">-- Volitelné (vyberte substrát) --</option>
                  {media.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nazev}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="add-inline-toggle-btn"
                onClick={() => setShowNewMediumForm(true)}
              >
                + Nový
              </button>
            </div>
          </div>

          {/* Umístění */}
          <div className="add-field-group">
            <label className="add-field-label" htmlFor="umisteni-select">
              Umístění v domácnosti
            </label>
            <div className="add-picker-action-row">
              <div className="add-icon-select-wrap">
                <span className="add-icon-prefix">📍</span>
                <select
                  id="umisteni-select"
                  className="add-select-input with-prefix"
                  value={form.umisteniId}
                  onChange={(event) => setForm((prev) => ({ ...prev, umisteniId: event.target.value }))}
                >
                  <option value="">-- Volitelné (vyberte umístění) --</option>
                  {umisteni.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nazev}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="add-inline-toggle-btn"
                onClick={() => setShowNewUmisteniForm(true)}
              >
                + Nové
              </button>
            </div>
          </div>
        </section>

        {/* 5. Aktuální kondice */}
        <section className="add-plant-section">
          <div className="add-section-header">
            <span className="add-section-icon">🩺</span>
            <div>
              <h3 className="add-section-title">Kondice a zdraví</h3>
              <p className="add-section-subtitle">V jakém stavu se rostlinka aktuálně nachází</p>
            </div>
          </div>

          <div className="add-health-picker-grid">
            {HEALTH_LEVELS.map((level) => {
              const isSelected = form.aktualniZdravi === level.value;
              return (
                <button
                  type="button"
                  key={level.value}
                  className={`add-health-pill-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, aktualniZdravi: level.value }))}
                >
                  <span className="health-pill-icon">{level.icon}</span>
                  <div className="health-pill-info">
                    <span className="health-pill-label">{level.label}</span>
                    <span className="health-pill-desc">{level.desc}</span>
                  </div>
                  <span className="health-pill-score">{level.value}/5</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Chybové či stavové zprávy */}
        {message && (
          <div
            className={`add-feedback-banner ${
              message.toLowerCase().includes('selhalo') || message.toLowerCase().includes('chyba')
                ? 'error'
                : 'success'
            }`}
          >
            {message}
          </div>
        )}

        {/* Akční tlačítka */}
        <div className="add-plant-actions-bar">
          <button type="submit" className="add-plant-submit-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Přidat kytičku do sbírky</span>
          </button>

          {onCancel && (
            <button type="button" className="add-plant-cancel-btn" onClick={onCancel}>
              Zrušit
            </button>
          )}
        </div>
      </form>

      {/* =========================================================
          OVERLAY MODAL 1: Nový botanický druh (+ nový rod)
          ========================================================= */}
      {showNewDruhForm && (
        <div className="add-modal-overlay-backdrop" onClick={() => setShowNewDruhForm(false)}>
          <div className="add-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <div className="add-modal-title-wrap">
                <span className="add-modal-icon">🌿</span>
                <div>
                  <h3 className="add-modal-title">Nový botanický druh</h3>
                  <p className="add-modal-subtitle">Zadejte název druhu a přiřaďte rod</p>
                </div>
              </div>
              <button
                type="button"
                className="add-modal-close-btn"
                onClick={() => setShowNewDruhForm(false)}
                aria-label="Zavřít"
              >
                ✕
              </button>
            </div>

            <div className="add-modal-body">
              {/* Krok 1: Výběr / vytvoření rodu */}
              <div className="add-field-group">
                <label className="add-field-label">1. Botanický rod <span className="required-star">*</span></label>
                <div className="add-picker-action-row">
                  <select
                    className="add-select-input"
                    value={newDruhRodId}
                    onChange={(event) => setNewDruhRodId(event.target.value)}
                  >
                    <option value="">-- Vyberte existující rod --</option>
                    {rody.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nazev}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={`add-inline-toggle-btn small ${showNewDruhRodForm ? 'active' : ''}`}
                    onClick={() => setShowNewDruhRodForm(!showNewDruhRodForm)}
                  >
                    {showNewDruhRodForm ? '✕ Zavřít rod' : '+ Nový rod'}
                  </button>
                </div>

                {showNewDruhRodForm && (
                  <div className="add-nested-inline-panel">
                    <span className="add-nested-title">🌱 Vytvořit nový rod</span>
                    <input
                      type="text"
                      className="add-text-input small"
                      placeholder="Název rodu (např. Ficus, Monstera)..."
                      value={newDruhRodNazev}
                      onChange={(event) => setNewDruhRodNazev(event.target.value)}
                    />
                    <textarea
                      className="add-textarea small"
                      placeholder="Popis rodu (volitelné)..."
                      value={newDruhRodPopis}
                      onChange={(event) => setNewDruhRodPopis(event.target.value)}
                      rows={2}
                    />
                    <button type="button" className="add-confirm-btn small" onClick={createInlineDruhRod}>
                      ✓ Vytvořit rod
                    </button>
                    {newDruhRodMessage && <p className="add-field-feedback info">{newDruhRodMessage}</p>}
                  </div>
                )}
              </div>

              {/* Krok 2: Druh */}
              <div className="add-field-group">
                <label className="add-field-label">2. Název nového druhu <span className="required-star">*</span></label>
                <input
                  type="text"
                  className="add-text-input"
                  placeholder="např. Monstera deliciosa, Ficus benjamina..."
                  value={newDruhNazev}
                  onChange={(event) => setNewDruhNazev(event.target.value)}
                />
              </div>

              <div className="add-field-group">
                <label className="add-field-label">Popis druhu (volitelné)</label>
                <textarea
                  className="add-textarea"
                  placeholder="Charakteristika, původ, doporučená péče..."
                  value={newDruhPopis}
                  onChange={(event) => setNewDruhPopis(event.target.value)}
                  rows={3}
                />
              </div>

              {newDruhMessage && <p className="add-field-feedback info">{newDruhMessage}</p>}
            </div>

            <div className="add-modal-footer">
              <button type="button" className="modal-action-btn primary" onClick={createInlineDruh}>
                ✓ Vytvořit a vybrat druh
              </button>
              <button type="button" className="modal-action-btn secondary" onClick={() => setShowNewDruhForm(false)}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          OVERLAY MODAL 2: Nový substrát / Médium
          ========================================================= */}
      {showNewMediumForm && (
        <div className="add-modal-overlay-backdrop" onClick={() => setShowNewMediumForm(false)}>
          <div className="add-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <div className="add-modal-title-wrap">
                <span className="add-modal-icon">🪴</span>
                <div>
                  <h3 className="add-modal-title">Nové pěstební médium</h3>
                  <p className="add-modal-subtitle">Přidejte substrát nebo pěstební směs</p>
                </div>
              </div>
              <button
                type="button"
                className="add-modal-close-btn"
                onClick={() => setShowNewMediumForm(false)}
                aria-label="Zavřít"
              >
                ✕
              </button>
            </div>

            <div className="add-modal-body">
              <div className="add-field-group">
                <label className="add-field-label">Název média / substrátu <span className="required-star">*</span></label>
                <input
                  type="text"
                  className="add-text-input"
                  placeholder="např. Substrát pro pokojovky, Pon, Rašelina..."
                  value={newMediumNazev}
                  onChange={(event) => setNewMediumNazev(event.target.value)}
                />
              </div>

              <div className="add-field-group">
                <label className="add-field-label">Popis média (volitelné)</label>
                <textarea
                  className="add-textarea"
                  placeholder="Složení, propustnost, doporučení..."
                  value={newMediumPopis}
                  onChange={(event) => setNewMediumPopis(event.target.value)}
                  rows={3}
                />
              </div>

              {newMediumMessage && <p className="add-field-feedback info">{newMediumMessage}</p>}
            </div>

            <div className="add-modal-footer">
              <button type="button" className="modal-action-btn primary" onClick={createInlineMedium}>
                ✓ Vytvořit a vybrat médium
              </button>
              <button type="button" className="modal-action-btn secondary" onClick={() => setShowNewMediumForm(false)}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          OVERLAY MODAL 3: Nové umístění
          ========================================================= */}
      {showNewUmisteniForm && (
        <div className="add-modal-overlay-backdrop" onClick={() => setShowNewUmisteniForm(false)}>
          <div className="add-modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="add-modal-header">
              <div className="add-modal-title-wrap">
                <span className="add-modal-icon">📍</span>
                <div>
                  <h3 className="add-modal-title">Nové umístění</h3>
                  <p className="add-modal-subtitle">Přidejte místnost nebo polohu v bytě</p>
                </div>
              </div>
              <button
                type="button"
                className="add-modal-close-btn"
                onClick={() => setShowNewUmisteniForm(false)}
                aria-label="Zavřít"
              >
                ✕
              </button>
            </div>

            <div className="add-modal-body">
              <div className="add-field-group">
                <label className="add-field-label">Název umístění <span className="required-star">*</span></label>
                <input
                  type="text"
                  className="add-text-input"
                  placeholder="např. Obývák - u okna, Ložnice, Balkon..."
                  value={newUmisteniNazev}
                  onChange={(event) => setNewUmisteniNazev(event.target.value)}
                />
              </div>

              {newUmisteniMessage && <p className="add-field-feedback info">{newUmisteniMessage}</p>}
            </div>

            <div className="add-modal-footer">
              <button type="button" className="modal-action-btn primary" onClick={createInlineUmisteni}>
                ✓ Vytvořit a vybrat umístění
              </button>
              <button type="button" className="modal-action-btn secondary" onClick={() => setShowNewUmisteniForm(false)}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
