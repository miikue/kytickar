import { forwardRef } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { getFileUrl } from '../api/http';
import { isWateringAction } from '../services/localDb';
import type { Druh, GalerieFotka, HistoriePece, Medium, Rostlina, TypAkce, Umisteni } from '../types/app';
import PhotoSourceModal from './PhotoSourceModal';
import PlantEditForm, { type PlantEditFormData } from './PlantEditForm';

type Props = {
  selectedRostlina: Rostlina | null;
  detailLoading: boolean;
  detailError: string | null;
  isEditing: boolean;
  editForm: PlantEditFormData;
  setEditForm: Dispatch<SetStateAction<PlantEditFormData>>;
  editMessage: string | null;
  druhy: Druh[];
  media: Medium[];
  umisteni: Umisteni[];
  typyAkci: TypAkce[];
  selectedTypAkceId: string;
  setSelectedTypAkceId: (id: string) => void;
  novaAkceMessage: string | null;
  galerie: GalerieFotka[];
  historie: HistoriePece[];
  latestPhoto: GalerieFotka | null;
  newPhoto: File | null;
  setNewPhoto: (file: File | null) => void;
  newPhotoPoznamka: string;
  setNewPhotoPoznamka: (note: string) => void;
  photoMessage: string | null;
  setPhotoMessage: (msg: string | null) => void;
  showAddPhotoForm: boolean;
  setShowAddPhotoForm: Dispatch<SetStateAction<boolean>>;
  isDetailPhotoModalOpen: boolean;
  setIsDetailPhotoModalOpen: Dispatch<SetStateAction<boolean>>;
  onBackToList: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onRemoveRostlina: () => Promise<void>;
  onSubmitEdit: (event: FormEvent) => Promise<void>;
  onSubmitNovaAkce: (event: FormEvent) => Promise<void>;
  onSubmitNovaFotka: (event: FormEvent) => Promise<void>;
  onRemoveHistorieItem: (id: number) => Promise<void>;
  onExpandPhoto: (photo: GalerieFotka) => void;
};

const PlantDetail = forwardRef<HTMLElement, Props>(function PlantDetail(
  {
    selectedRostlina,
    detailLoading,
    detailError,
    isEditing,
    editForm,
    setEditForm,
    editMessage,
    druhy,
    media,
    umisteni,
    typyAkci,
    selectedTypAkceId,
    setSelectedTypAkceId,
    novaAkceMessage,
    galerie,
    historie,
    latestPhoto,
    newPhoto,
    setNewPhoto,
    newPhotoPoznamka,
    setNewPhotoPoznamka,
    photoMessage,
    setPhotoMessage,
    showAddPhotoForm,
    setShowAddPhotoForm,
    isDetailPhotoModalOpen,
    setIsDetailPhotoModalOpen,
    onBackToList,
    onStartEditing,
    onCancelEditing,
    onRemoveRostlina,
    onSubmitEdit,
    onSubmitNovaAkce,
    onSubmitNovaFotka,
    onRemoveHistorieItem,
    onExpandPhoto,
  },
  ref,
) {
  return (
    <article ref={ref} className="plant-detail-container">
      {selectedRostlina ? (
        <>
          {/* STICKY TOP BAR */}
          <div className="detail-mobile-top-bar">
            <button type="button" className="detail-back-button" onClick={onBackToList}>
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              <span>Zpět na seznam</span>
            </button>

            <div className="detail-top-actions">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    className="detail-action-icon-btn"
                    onClick={onStartEditing}
                    title="Upravit rostlinu"
                    aria-label="Upravit"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="detail-action-icon-btn danger"
                    onClick={onRemoveRostlina}
                    title="Smazat rostlinu"
                    aria-label="Smazat"
                  >
                    🗑️
                  </button>
                </>
              ) : (
                <button type="button" className="detail-action-cancel-btn" onClick={onCancelEditing}>
                  Zrušit
                </button>
              )}
            </div>
          </div>

          {detailLoading && (
            <div style={{ textAlign: 'center', padding: '10px', color: '#688975', fontSize: '0.88rem' }}>
              Načítám detaily...
            </div>
          )}
          {detailError && (
            <div
              style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '10px 14px',
                borderRadius: '12px',
                margin: '8px 16px',
                fontSize: '0.85rem',
              }}
            >
              {detailError}
            </div>
          )}

          {isEditing ? (
            <PlantEditForm
              editForm={editForm}
              setEditForm={setEditForm}
              druhy={druhy}
              media={media}
              umisteni={umisteni}
              onSubmit={onSubmitEdit}
              editMessage={editMessage}
            />
          ) : (
            <div className="detail-content-scroll">
              {/* HERO CARD */}
              <div className="plant-detail-hero-card">
                <div className="hero-photo-wrapper">
                  {latestPhoto ? (
                    <button type="button" className="hero-photo-btn" onClick={() => onExpandPhoto(latestPhoto)}>
                      <img
                        src={getFileUrl(latestPhoto.fotkaName)}
                        alt={selectedRostlina.vlastniJmeno}
                        className="hero-photo-img"
                      />
                    </button>
                  ) : (
                    <div className="hero-photo-empty">🌿</div>
                  )}
                  <div className="hero-health-pill">💚 Zdraví {selectedRostlina.aktualniZdravi}/5</div>
                  <div className="hero-gradient-overlay">
                    <h1 className="hero-plant-name">{selectedRostlina.vlastniJmeno}</h1>
                    <p className="hero-plant-species">
                      {selectedRostlina.druh?.nazev || 'Neznámý druh'}
                      {selectedRostlina.druh?.rod?.nazev ? ` • ${selectedRostlina.druh.rod.nazev}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* METADATA CHIPS */}
              <div className="plant-detail-chips-grid">
                <div className="detail-chip-card">
                  <span className="chip-icon">🪴</span>
                  <div className="chip-info">
                    <span className="chip-label">Substrát</span>
                    <strong className="chip-value">{selectedRostlina.medium?.nazev || 'Neuvedeno'}</strong>
                  </div>
                </div>
                <div className="detail-chip-card">
                  <span className="chip-icon">📍</span>
                  <div className="chip-info">
                    <span className="chip-label">Umístění</span>
                    <strong className="chip-value">{selectedRostlina.umisteni?.nazev || 'Neuvedeno'}</strong>
                  </div>
                </div>
                <div className="detail-chip-card">
                  <span className="chip-icon">📅</span>
                  <div className="chip-info">
                    <span className="chip-label">Pořízeno</span>
                    <strong className="chip-value">
                      {new Date(selectedRostlina.datumPorizeni).toLocaleDateString('cs-CZ')}
                    </strong>
                  </div>
                </div>
                <div className="detail-chip-card">
                  <span className="chip-icon">🏷️</span>
                  <div className="chip-info">
                    <span className="chip-label">Rod</span>
                    <strong className="chip-value">{selectedRostlina.druh?.rod?.nazev || 'Neuvedeno'}</strong>
                  </div>
                </div>
              </div>

              {/* KARTA PÉČE */}
              <div className="detail-section-card care-action-card">
                <div className="section-card-header">
                  <span className="section-card-icon">⚡</span>
                  <div>
                    <h3 className="section-card-title">Zaznamenat péči</h3>
                    <p className="section-card-desc">Vyberte akci a potvrďte provedení</p>
                  </div>
                </div>

                <form className="detail-care-unified-form" onSubmit={onSubmitNovaAkce}>
                  <div className="care-row-unified">
                    <select
                      className="care-select-unified"
                      value={selectedTypAkceId}
                      onChange={(event) => setSelectedTypAkceId(event.target.value)}
                      aria-label="Výběr péče"
                    >
                      {typyAkci.map((item) => {
                        const isWater = isWateringAction(item);
                        const icon =
                          item.ikona ||
                          (isWater
                            ? '💧'
                            : item.typAkce.toLowerCase().includes('hnoj')
                            ? '🌱'
                            : item.typAkce.toLowerCase().includes('ros')
                            ? '💨'
                            : item.typAkce.toLowerCase().includes('pres')
                            ? '🪴'
                            : '🌿');
                        return (
                          <option key={item.id} value={item.id}>
                            {icon} {item.typAkce}
                          </option>
                        );
                      })}
                    </select>

                    <button className="care-execute-btn" type="submit" disabled={!selectedTypAkceId}>
                      Provést
                    </button>
                  </div>
                  {novaAkceMessage && <div className="detail-care-feedback-badge">{novaAkceMessage}</div>}
                </form>
              </div>

              {/* FOTOGALERIE */}
              <div className="detail-section-card">
                <div className="section-card-header-split">
                  <div className="section-card-header-left">
                    <span className="section-card-icon">📸</span>
                    <div>
                      <h3 className="section-card-title">Fotogalerie</h3>
                      <p className="section-card-desc">
                        {galerie.length} {galerie.length === 1 ? 'fotografie' : 'fotografií'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="detail-add-photo-toggle"
                    onClick={() => {
                      if (showAddPhotoForm && !newPhoto) {
                        setShowAddPhotoForm(false);
                      } else if (showAddPhotoForm && newPhoto) {
                        setShowAddPhotoForm(false);
                        setNewPhoto(null);
                      } else {
                        setShowAddPhotoForm(true);
                        setIsDetailPhotoModalOpen(true);
                      }
                    }}
                  >
                    {showAddPhotoForm ? 'Zavřít' : '+ Přidat fotku'}
                  </button>
                </div>

                {showAddPhotoForm && (
                  <div className="detail-photo-upload-box">
                    {newPhoto ? (
                      <div className="detail-photo-chosen-preview">
                        <img
                          src={URL.createObjectURL(newPhoto)}
                          alt="Nová fotka"
                          className="detail-photo-thumb-img"
                        />
                        <div className="detail-photo-chosen-info">
                          <span className="chosen-name">{newPhoto.name}</span>
                          <span className="chosen-size">{Math.round(newPhoto.size / 1024)} KB</span>
                          <div className="chosen-actions">
                            <button
                              type="button"
                              className="photo-action-btn secondary small"
                              onClick={() => setIsDetailPhotoModalOpen(true)}
                            >
                              🔄 Změnit fotku
                            </button>
                            <button
                              type="button"
                              className="photo-action-btn danger small"
                              onClick={() => setNewPhoto(null)}
                            >
                              ✕ Zrušit
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="detail-photo-pick-trigger-btn"
                        onClick={() => setIsDetailPhotoModalOpen(true)}
                      >
                        <span className="pick-trigger-icon">📷</span>
                        <div className="pick-trigger-text">
                          <strong>Vyfotit nebo vybrat fotografii</strong>
                          <span>Klepnutím otevřete volbu fotoaparát / galerie</span>
                        </div>
                      </button>
                    )}

                    <form className="detail-photo-form-controls" onSubmit={onSubmitNovaFotka}>
                      <input
                        type="text"
                        className="detail-photo-input-note"
                        value={newPhotoPoznamka}
                        onChange={(event) => setNewPhotoPoznamka(event.target.value)}
                        placeholder="Poznámka k fotce (např. nový výhonek, po zálivce...)"
                      />
                      <div className="detail-photo-actions-row">
                        <button className="action-button primary" type="submit" disabled={!newPhoto}>
                          Uložit do fotogalerie
                        </button>
                      </div>
                      {photoMessage && <p className="detail-feedback-msg">{photoMessage}</p>}
                    </form>
                  </div>
                )}

                <PhotoSourceModal
                  isOpen={isDetailPhotoModalOpen}
                  onClose={() => setIsDetailPhotoModalOpen(false)}
                  onPhotoSelected={(file) => {
                    setNewPhoto(file);
                    setShowAddPhotoForm(true);
                    setPhotoMessage(null);
                  }}
                />

                {galerie.length > 0 ? (
                  <div className="detail-gallery-row">
                    {galerie.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="detail-gallery-thumb-btn"
                        onClick={() => onExpandPhoto(item)}
                      >
                        <img
                          src={getFileUrl(item.fotkaName)}
                          alt={item.poznamka || 'Fotka'}
                          className="detail-gallery-thumb-img"
                        />
                        <span className="detail-gallery-thumb-date">
                          {new Date(item.datumPorizeni).toLocaleDateString('cs-CZ')}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="detail-empty-text">Zatím bez dalších fotografií.</p>
                )}
              </div>

              {/* HISTORIE PÉČE */}
              <div className="detail-section-card">
                <div className="section-card-header">
                  <span className="section-card-icon">📜</span>
                  <div>
                    <h3 className="section-card-title">Historie péče</h3>
                    <p className="section-card-desc">
                      {historie.length} {historie.length === 1 ? 'záznam' : 'záznamů'}
                    </p>
                  </div>
                </div>

                {historie.length > 0 ? (
                  <ul className="detail-history-list">
                    {historie.map((item) => {
                      const isWatering = isWateringAction(item.typAkce);
                      const icon = item.typAkce.ikona || (isWatering ? '💧' : '🌱');
                      return (
                        <li key={item.id} className="detail-history-item">
                          <span className="history-item-icon">{icon}</span>
                          <div className="history-item-body">
                            <strong>{item.typAkce.typAkce}</strong>
                            <span>
                              {new Date(item.datum).toLocaleString('cs-CZ', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="history-delete-btn"
                            onClick={() => onRemoveHistorieItem(item.id)}
                            title="Smazat záznam"
                            aria-label="Smazat záznam"
                          >
                            ✕
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="detail-empty-text">Zatím žádné záznamy o péči.</p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="detail-empty-text">Vyberte rostlinu ze seznamu.</p>
      )}
    </article>
  );
});

export default PlantDetail;
