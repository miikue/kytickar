import { useState, type FormEvent } from 'react';
import DruhuEditor from '../components/DruhuEditor';
import { getFileUrl } from '../api/http';
import type { Druh, Rod, Rostlina } from '../types/app';

type DruhForm = {
  nazev: string;
  popis: string;
  rodId: string;
};

type Props = {
  druhy: Druh[];
  editingDruhId: number | null;
  setEditingDruhId: (id: number | null) => void;
  druhForm: DruhForm;
  setDruhForm: (form: DruhForm) => void;
  uploadingDruhPhotos: { fotka1: File | null; fotka2: File | null };
  setUploadingDruhPhotos: (photos: { fotka1: File | null; fotka2: File | null }) => void;
  uploadedDruhPhotoNames: { fotka1: string; fotka2: string };
  setUploadedDruhPhotoNames: (names: { fotka1: string; fotka2: string }) => void;
  rody: Rod[];
  submitDruh: (event: FormEvent) => Promise<void>;
  removeDruh: (id: number) => Promise<void>;
  druhMessage: string | null;
  setDruhMessage?: (msg: string | null) => void;
  rostliny?: Rostlina[];
  onSelectDruhForAdd?: (druhId: number) => void;
};

export default function DruhyPage({
  druhy,
  editingDruhId,
  setEditingDruhId,
  druhForm,
  setDruhForm,
  uploadingDruhPhotos,
  setUploadingDruhPhotos,
  uploadedDruhPhotoNames,
  setUploadedDruhPhotoNames,
  rody,
  submitDruh,
  removeDruh,
  druhMessage,
  setDruhMessage,
  rostliny,
  onSelectDruhForAdd,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDruhDetail, setSelectedDruhDetail] = useState<Druh | null>(null);
  const [activePhotoName, setActivePhotoName] = useState<string>('');
  const [expandedPhoto, setExpandedPhoto] = useState<{ fotkaName: string; poznamka?: string } | null>(null);

  const isFormOpen = editingDruhId !== null || isAdding;

  function handleStartAdd() {
    setEditingDruhId(null);
    setDruhForm({ nazev: '', popis: '', rodId: '' });
    setUploadedDruhPhotoNames({ fotka1: '', fotka2: '' });
    setUploadingDruhPhotos({ fotka1: null, fotka2: null });
    setIsAdding(true);
  }

  function handleStartEdit(item: Druh) {
    setIsAdding(false);
    setEditingDruhId(item.id);
    setDruhForm({
      nazev: item.nazev,
      popis: item.popis || '',
      rodId: item.rodId ? String(item.rodId) : '',
    });
    setUploadedDruhPhotoNames({
      fotka1: item.fotka1Name || '',
      fotka2: item.fotka2Name || '',
    });
    setUploadingDruhPhotos({ fotka1: null, fotka2: null });
  }

  function handleCancel() {
    setIsAdding(false);
    setEditingDruhId(null);
    setDruhForm({ nazev: '', popis: '', rodId: '' });
    setUploadingDruhPhotos({ fotka1: null, fotka2: null });
    setUploadedDruhPhotoNames({ fotka1: '', fotka2: '' });
  }

  async function handleSubmit(e: FormEvent) {
    await submitDruh(e);
    setIsAdding(false);
  }

  const filteredDruhy = druhy.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.nazev.toLowerCase().includes(q) ||
      (item.rod?.nazev && item.rod.nazev.toLowerCase().includes(q)) ||
      (item.popis && item.popis.toLowerCase().includes(q))
    );
  });

  return (
    <div className="catalog-tab-page">
      <div className="catalog-section-bar">
        <div className="catalog-section-top-row">
          <h3 className="catalog-section-title">
            <span>🌿</span> Druhy rostlin
            <span className="category-chip-badge">{druhy.length}</span>
          </h3>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" onClick={handleStartAdd}>
              <span>+</span> Přidat druh
            </button>
          )}
        </div>

        {druhy.length > 0 && !isFormOpen && (
          <input
            type="search"
            className="catalog-search-input"
            placeholder="🔍 Hledat druh podle názvu nebo rodu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {druhMessage && (
        <div
          className={`catalog-feedback-banner ${
            druhMessage.includes('selhalo') || druhMessage.includes('nelze') ? 'error' : 'success'
          }`}
        >
          <span className="feedback-banner-icon">
            {druhMessage.includes('selhalo') || druhMessage.includes('nelze') ? '⚠️' : '✅'}
          </span>
          <span className="feedback-banner-text">{druhMessage}</span>
          {setDruhMessage && (
            <button
              type="button"
              className="catalog-feedback-dismiss"
              onClick={() => setDruhMessage(null)}
              aria-label="Zavřít"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {isFormOpen && (
        <DruhuEditor
          editingId={editingDruhId}
          form={druhForm}
          setForm={setDruhForm}
          uploadingPhotos={uploadingDruhPhotos}
          setUploadingPhotos={setUploadingDruhPhotos}
          uploadedPhotoNames={uploadedDruhPhotoNames}
          rody={rody}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={removeDruh}
          message={druhMessage}
        />
      )}

      {filteredDruhy.length === 0 ? (
        <div className="catalog-empty-state">
          <span className="catalog-empty-icon">🌿</span>
          <p>{searchQuery ? 'Žádný druh neodpovídá hledání.' : 'Zatím nemáte vytvořené žádné druhy.'}</p>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" style={{ margin: '8px auto 0' }} onClick={handleStartAdd}>
              + Přidat první druh
            </button>
          )}
        </div>
      ) : (
        <div className="catalog-items-list">
          {filteredDruhy.map((item) => {
            const thumb = item.fotka1Name || item.fotka2Name;
            return (
              <div
                key={item.id}
                className="catalog-item-card interactive"
                onClick={() => {
                  setSelectedDruhDetail(item);
                  setActivePhotoName(item.fotka1Name || item.fotka2Name || '');
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedDruhDetail(item);
                    setActivePhotoName(item.fotka1Name || item.fotka2Name || '');
                  }
                }}
              >
                <div className="catalog-item-media">
                  {thumb ? (
                    <img src={getFileUrl(thumb)} alt={item.nazev} className="catalog-item-img" />
                  ) : (
                    <span className="catalog-item-avatar">🌿</span>
                  )}
                </div>

                <div className="catalog-item-content">
                  <div className="catalog-item-title-row">
                    <h4 className="catalog-item-title">{item.nazev}</h4>
                    {item.rod && <span className="catalog-item-tag">🌱 {item.rod.nazev}</span>}
                  </div>
                  {item.popis && <p className="catalog-item-desc">{item.popis}</p>}
                </div>

                <div className="catalog-item-actions">
                  <button
                    type="button"
                    className="catalog-action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(item);
                    }}
                    title="Upravit druh"
                    aria-label="Upravit"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="catalog-action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Opravdu chcete smazat druh "${item.nazev}"?`)) {
                        removeDruh(item.id);
                      }
                    }}
                    title="Smazat druh"
                    aria-label="Smazat"
                  >
                    🗑️
                  </button>
                  <span className="catalog-item-chevron" aria-hidden="true">›</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL MODAL PRO VYBRANÝ DRUH */}
      {selectedDruhDetail && (
        <div className="druh-detail-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="druh-detail-backdrop"
            onClick={() => setSelectedDruhDetail(null)}
            aria-label="Zavřít detail druhu"
          />
          <div className="druh-detail-sheet">
            <div className="druh-detail-header">
              <span className="druh-detail-pill">🌿 Detail druhu</span>
              <div className="druh-detail-header-actions">
                <button
                  type="button"
                  className="druh-header-btn edit"
                  onClick={() => {
                    const item = selectedDruhDetail;
                    setSelectedDruhDetail(null);
                    handleStartEdit(item);
                  }}
                  title="Upravit druh"
                >
                  ✏️ Upravit
                </button>
                <button
                  type="button"
                  className="druh-header-btn close"
                  onClick={() => setSelectedDruhDetail(null)}
                  aria-label="Zavřít"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="druh-detail-scrollable">
              {/* VELKÁ FOTOGRAFIE */}
              <div className="druh-detail-hero">
                {activePhotoName ? (
                  <button
                    type="button"
                    className="druh-hero-photo-btn"
                    onClick={() =>
                      setExpandedPhoto({ fotkaName: activePhotoName, poznamka: selectedDruhDetail.nazev })
                    }
                    title="Klepnutím zvětšit fotografii"
                  >
                    <img
                      src={getFileUrl(activePhotoName)}
                      alt={selectedDruhDetail.nazev}
                      className="druh-hero-photo-img"
                    />
                    <span className="druh-zoom-pill">🔍 Zvětšit</span>
                  </button>
                ) : (
                  <div className="druh-hero-photo-empty">🌿</div>
                )}

                {/* Přepínání mezi fotkami, pokud má druh obě */}
                {selectedDruhDetail.fotka1Name && selectedDruhDetail.fotka2Name && (
                  <div className="druh-detail-photo-tabs">
                    <button
                      type="button"
                      className={`druh-photo-tab ${activePhotoName === selectedDruhDetail.fotka1Name ? 'active' : ''}`}
                      onClick={() => setActivePhotoName(selectedDruhDetail.fotka1Name!)}
                    >
                      <img src={getFileUrl(selectedDruhDetail.fotka1Name)} alt="Foto 1" />
                      <span>Fotka 1</span>
                    </button>
                    <button
                      type="button"
                      className={`druh-photo-tab ${activePhotoName === selectedDruhDetail.fotka2Name ? 'active' : ''}`}
                      onClick={() => setActivePhotoName(selectedDruhDetail.fotka2Name!)}
                    >
                      <img src={getFileUrl(selectedDruhDetail.fotka2Name)} alt="Foto 2" />
                      <span>Fotka 2</span>
                    </button>
                  </div>
                )}
              </div>

              {/* NÁZEV A PARAMETRY */}
              <div className="druh-detail-body">
                <div className="druh-name-group">
                  <h2 className="druh-main-title">{selectedDruhDetail.nazev}</h2>
                  <div className="druh-badges-row">
                    {selectedDruhDetail.rod ? (
                      <span className="druh-badge-tag rod">
                        🌱 Rod: <strong>{selectedDruhDetail.rod.nazev}</strong>
                      </span>
                    ) : (
                      <span className="druh-badge-tag muted">🌱 Bez zařazení do rodu</span>
                    )}
                    <span className="druh-badge-tag count">
                      🪴 Ve sbírce:{' '}
                      <strong>
                        {(rostliny || []).filter((r) => r.druh?.id === selectedDruhDetail.id || (r as any).druhId === selectedDruhDetail.id).length}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* BOTANICKÝ POPIS */}
                <div className="druh-detail-section">
                  <h4 className="druh-section-title">📖 Popis a charakteristika</h4>
                  <div className="druh-desc-box">
                    {selectedDruhDetail.popis ? (
                      <p className="druh-desc-text">{selectedDruhDetail.popis}</p>
                    ) : (
                      <p className="druh-desc-empty">Pro tento druh zatím nebyl vyplněn žádný podrobný popis.</p>
                    )}
                  </div>
                </div>

                {/* MOJE KYTKY TOHOTO DRUHU */}
                {(() => {
                  const matching = (rostliny || []).filter((r) => r.druh?.id === selectedDruhDetail.id || (r as any).druhId === selectedDruhDetail.id);
                  if (matching.length === 0) return null;
                  return (
                    <div className="druh-detail-section">
                      <h4 className="druh-section-title">🪴 Vaše kytičky tohoto druhu ({matching.length})</h4>
                      <div className="druh-user-plants-grid">
                        {matching.map((plant) => (
                          <div key={plant.id} className="druh-user-plant-item">
                            <span className="user-plant-leaf">🌱</span>
                            <div className="user-plant-info">
                              <strong className="user-plant-name">{plant.vlastniJmeno}</strong>
                              {plant.umisteni && (
                                <span className="user-plant-loc">📍 {plant.umisteni.nazev}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* SPODNÍ AKCE */}
            <div className="druh-detail-footer">
              {onSelectDruhForAdd && (
                <button
                  type="button"
                  className="druh-detail-add-plant-btn"
                  onClick={() => {
                    const id = selectedDruhDetail.id;
                    setSelectedDruhDetail(null);
                    onSelectDruhForAdd(id);
                  }}
                >
                  <span className="add-plant-plus">+</span> Přidat novou kytičku tohoto druhu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRO ZVĚTŠENÍ FOTKY */}
      {expandedPhoto && (
        <div className="photo-modal" role="dialog" aria-modal="true">
          <button
            type="button"
            className="photo-modal-backdrop"
            onClick={() => setExpandedPhoto(null)}
            aria-label="Zavřít detail fotky"
          />
          <div className="photo-modal-panel">
            <img
              src={getFileUrl(expandedPhoto.fotkaName)}
              alt={expandedPhoto.poznamka || 'Zvětšená fotka'}
              className="photo-modal-image"
            />
            <div className="photo-modal-meta">
              <p>
                <strong>{expandedPhoto.poznamka}</strong>
              </p>
            </div>
            <div className="photo-modal-actions form-actions">
              <button
                type="button"
                className="action-button secondary"
                onClick={() => setExpandedPhoto(null)}
              >
                Zavřít
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
