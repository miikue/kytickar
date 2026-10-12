import { useState, type FormEvent } from 'react';
import MediaEditor from '../components/MediaEditor';
import type { Medium } from '../types/app';

type Props = {
  media: Medium[];
  editingMediaId: number | null;
  setEditingMediaId: (id: number | null) => void;
  mediaNazev: string;
  setMediaNazev: (nazev: string) => void;
  mediaPopis: string;
  setMediaPopis: (popis: string) => void;
  submitMedia: (event: FormEvent) => Promise<void>;
  removeMedia: (id: number) => Promise<void>;
  mediaMessage: string | null;
  setMediaMessage: (message: string | null) => void;
};

export default function MediaPage({
  media,
  editingMediaId,
  setEditingMediaId,
  mediaNazev,
  setMediaNazev,
  mediaPopis,
  setMediaPopis,
  submitMedia,
  removeMedia,
  mediaMessage,
  setMediaMessage,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isFormOpen = editingMediaId !== null || isAdding;

  function handleStartAdd() {
    setEditingMediaId(null);
    setMediaNazev('');
    setMediaPopis('');
    setMediaMessage(null);
    setIsAdding(true);
  }

  function handleStartEdit(item: Medium) {
    setIsAdding(false);
    setEditingMediaId(item.id);
    setMediaNazev(item.nazev);
    setMediaPopis(item.popis || '');
    setMediaMessage(null);
  }

  function handleCancel() {
    setIsAdding(false);
    setEditingMediaId(null);
    setMediaNazev('');
    setMediaPopis('');
    setMediaMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    await submitMedia(e);
    setIsAdding(false);
  }

  const filteredMedia = media.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.nazev.toLowerCase().includes(q) || (item.popis && item.popis.toLowerCase().includes(q));
  });

  return (
    <div className="catalog-tab-page">
      <div className="catalog-section-bar">
        <div className="catalog-section-top-row">
          <h3 className="catalog-section-title">
            <span>🪴</span> Pěstební substráty & média
            <span className="category-chip-badge">{media.length}</span>
          </h3>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" onClick={handleStartAdd}>
              <span>+</span> Přidat substrát
            </button>
          )}
        </div>

        {media.length > 0 && !isFormOpen && (
          <input
            type="search"
            className="catalog-search-input"
            placeholder="🔍 Hledat substrát podle názvu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {mediaMessage && (
        <div
          className={`catalog-feedback-banner ${
            mediaMessage.includes('selhalo') || mediaMessage.includes('nelze') ? 'error' : 'success'
          }`}
        >
          <span className="feedback-banner-icon">
            {mediaMessage.includes('selhalo') || mediaMessage.includes('nelze') ? '⚠️' : '✅'}
          </span>
          <span className="feedback-banner-text">{mediaMessage}</span>
          <button
            type="button"
            className="catalog-feedback-dismiss"
            onClick={() => setMediaMessage(null)}
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>
      )}

      {isFormOpen && (
        <MediaEditor
          editingId={editingMediaId}
          nazev={mediaNazev}
          setNazev={setMediaNazev}
          popis={mediaPopis}
          setPopis={setMediaPopis}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={removeMedia}
          message={mediaMessage}
        />
      )}

      {filteredMedia.length === 0 ? (
        <div className="catalog-empty-state">
          <span className="catalog-empty-icon">🪴</span>
          <p>{searchQuery ? 'Žádný substrát neodpovídá hledání.' : 'Zatím nemáte vytvořené žádné substráty.'}</p>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" style={{ margin: '8px auto 0' }} onClick={handleStartAdd}>
              + Přidat první substrát
            </button>
          )}
        </div>
      ) : (
        <div className="catalog-items-list">
          {filteredMedia.map((item) => (
            <div key={item.id} className="catalog-item-card">
              <div className="catalog-item-media">
                <span className="catalog-item-avatar">🪴</span>
              </div>

              <div className="catalog-item-content">
                <h4 className="catalog-item-title">{item.nazev}</h4>
                {item.popis && <p className="catalog-item-desc">{item.popis}</p>}
              </div>

              <div className="catalog-item-actions">
                <button
                  type="button"
                  className="catalog-action-btn edit"
                  onClick={() => handleStartEdit(item)}
                  title="Upravit substrát"
                  aria-label="Upravit"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="catalog-action-btn delete"
                  onClick={() => {
                    if (window.confirm(`Opravdu chcete smazat substrát "${item.nazev}"?`)) {
                      removeMedia(item.id);
                    }
                  }}
                  title="Smazat substrát"
                  aria-label="Smazat"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
