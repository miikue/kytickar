import { useState, type FormEvent } from 'react';
import RodEditor from '../components/RodEditor';
import type { Rod } from '../types/app';

type Props = {
  rody: Rod[];
  editingRodId: number | null;
  setEditingRodId: (id: number | null) => void;
  rodNazev: string;
  setRodNazev: (nazev: string) => void;
  rodPopis: string;
  setRodPopis: (popis: string) => void;
  submitRod: (event: FormEvent) => Promise<void>;
  removeRod: (id: number) => Promise<void>;
  rodMessage: string | null;
  setRodMessage: (message: string | null) => void;
};

export default function RodyPage({
  rody,
  editingRodId,
  setEditingRodId,
  rodNazev,
  setRodNazev,
  rodPopis,
  setRodPopis,
  submitRod,
  removeRod,
  rodMessage,
  setRodMessage,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isFormOpen = editingRodId !== null || isAdding;

  function handleStartAdd() {
    setEditingRodId(null);
    setRodNazev('');
    setRodPopis('');
    setRodMessage(null);
    setIsAdding(true);
  }

  function handleStartEdit(item: Rod) {
    setIsAdding(false);
    setEditingRodId(item.id);
    setRodNazev(item.nazev);
    setRodPopis(item.popis || '');
    setRodMessage(null);
  }

  function handleCancel() {
    setIsAdding(false);
    setEditingRodId(null);
    setRodNazev('');
    setRodPopis('');
    setRodMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    await submitRod(e);
    setIsAdding(false);
  }

  const filteredRody = rody.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.nazev.toLowerCase().includes(q) || (item.popis && item.popis.toLowerCase().includes(q));
  });

  return (
    <div className="catalog-tab-page">
      <div className="catalog-section-bar">
        <div className="catalog-section-top-row">
          <h3 className="catalog-section-title">
            <span>🌱</span> Botanické rody
            <span className="category-chip-badge">{rody.length}</span>
          </h3>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" onClick={handleStartAdd}>
              <span>+</span> Přidat rod
            </button>
          )}
        </div>

        {rody.length > 0 && !isFormOpen && (
          <input
            type="search"
            className="catalog-search-input"
            placeholder="🔍 Hledat rod podle názvu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {rodMessage && (
        <div
          className={`catalog-feedback-banner ${
            rodMessage.includes('selhalo') || rodMessage.includes('nelze') ? 'error' : 'success'
          }`}
        >
          <span className="feedback-banner-icon">
            {rodMessage.includes('selhalo') || rodMessage.includes('nelze') ? '⚠️' : '✅'}
          </span>
          <span className="feedback-banner-text">{rodMessage}</span>
          <button
            type="button"
            className="catalog-feedback-dismiss"
            onClick={() => setRodMessage(null)}
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>
      )}

      {isFormOpen && (
        <RodEditor
          editingId={editingRodId}
          nazev={rodNazev}
          setNazev={setRodNazev}
          popis={rodPopis}
          setPopis={setRodPopis}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={removeRod}
          message={rodMessage}
        />
      )}

      {filteredRody.length === 0 ? (
        <div className="catalog-empty-state">
          <span className="catalog-empty-icon">🌱</span>
          <p>{searchQuery ? 'Žádný rod neodpovídá hledání.' : 'Zatím nemáte vytvořené žádné rody.'}</p>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" style={{ margin: '8px auto 0' }} onClick={handleStartAdd}>
              + Přidat první rod
            </button>
          )}
        </div>
      ) : (
        <div className="catalog-items-list">
          {filteredRody.map((item) => (
            <div key={item.id} className="catalog-item-card">
              <div className="catalog-item-media">
                <span className="catalog-item-avatar">🌱</span>
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
                  title="Upravit rod"
                  aria-label="Upravit"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="catalog-action-btn delete"
                  onClick={() => {
                    if (window.confirm(`Opravdu chcete smazat rod "${item.nazev}"?`)) {
                      removeRod(item.id);
                    }
                  }}
                  title="Smazat rod"
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
