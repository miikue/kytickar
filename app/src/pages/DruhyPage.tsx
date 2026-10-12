import { useState, type FormEvent } from 'react';
import DruhuEditor from '../components/DruhuEditor';
import { getFileUrl } from '../api/http';
import type { Druh, Rod } from '../types/app';

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
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
              <div key={item.id} className="catalog-item-card">
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
                    onClick={() => handleStartEdit(item)}
                    title="Upravit druh"
                    aria-label="Upravit"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="catalog-action-btn delete"
                    onClick={() => {
                      if (window.confirm(`Opravdu chcete smazat druh "${item.nazev}"?`)) {
                        removeDruh(item.id);
                      }
                    }}
                    title="Smazat druh"
                    aria-label="Smazat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
