import { useState, type FormEvent } from 'react';
import UmisteniEditor from '../components/UmisteniEditor';
import type { Umisteni } from '../types/app';

type FormState = {
  nazev: string;
  parentId: string;
};

type Props = {
  umisteni: Umisteni[];
  editingUmisteniId: number | null;
  setEditingUmisteniId: (id: number | null) => void;
  umisteniForm: FormState;
  setUmisteniForm: (form: FormState) => void;
  submitUmisteni: (event: FormEvent) => Promise<void>;
  removeUmisteni: (id: number) => Promise<void>;
  umisteniMessage: string | null;
  setUmisteniMessage: (message: string | null) => void;
};

export default function UmisteniPage({
  umisteni,
  editingUmisteniId,
  setEditingUmisteniId,
  umisteniForm,
  setUmisteniForm,
  submitUmisteni,
  removeUmisteni,
  umisteniMessage,
  setUmisteniMessage,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isFormOpen = editingUmisteniId !== null || isAdding;

  function handleStartAdd() {
    setEditingUmisteniId(null);
    setUmisteniForm({ nazev: '', parentId: '' });
    setUmisteniMessage(null);
    setIsAdding(true);
  }

  function handleStartEdit(item: Umisteni) {
    setIsAdding(false);
    setEditingUmisteniId(item.id);
    setUmisteniForm({
      nazev: item.nazev,
      parentId: item.parentId ? String(item.parentId) : '',
    });
    setUmisteniMessage(null);
  }

  function handleCancel() {
    setIsAdding(false);
    setEditingUmisteniId(null);
    setUmisteniForm({ nazev: '', parentId: '' });
    setUmisteniMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    await submitUmisteni(e);
    setIsAdding(false);
  }

  const filteredUmisteni = umisteni.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.nazev.toLowerCase().includes(q);
  });

  return (
    <div className="catalog-tab-page">
      <div className="catalog-section-bar">
        <div className="catalog-section-top-row">
          <h3 className="catalog-section-title">
            <span>📍</span> Stanoviště a umístění
            <span className="category-chip-badge">{umisteni.length}</span>
          </h3>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" onClick={handleStartAdd}>
              <span>+</span> Přidat umístění
            </button>
          )}
        </div>

        {umisteni.length > 0 && !isFormOpen && (
          <input
            type="search"
            className="catalog-search-input"
            placeholder="🔍 Hledat umístění podle názvu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {umisteniMessage && (
        <div
          className={`catalog-feedback-banner ${
            umisteniMessage.includes('selhalo') || umisteniMessage.includes('nelze') ? 'error' : 'success'
          }`}
        >
          <span className="feedback-banner-icon">
            {umisteniMessage.includes('selhalo') || umisteniMessage.includes('nelze') ? '⚠️' : '✅'}
          </span>
          <span className="feedback-banner-text">{umisteniMessage}</span>
          <button
            type="button"
            className="catalog-feedback-dismiss"
            onClick={() => setUmisteniMessage(null)}
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>
      )}

      {isFormOpen && (
        <UmisteniEditor
          editingId={editingUmisteniId}
          form={umisteniForm}
          setForm={setUmisteniForm}
          umisteni={umisteni}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={removeUmisteni}
          message={umisteniMessage}
        />
      )}

      {filteredUmisteni.length === 0 ? (
        <div className="catalog-empty-state">
          <span className="catalog-empty-icon">📍</span>
          <p>{searchQuery ? 'Žádné umístění neodpovídá hledání.' : 'Zatím nemáte vytvořené žádná umístění.'}</p>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" style={{ margin: '8px auto 0' }} onClick={handleStartAdd}>
              + Přidat první umístění
            </button>
          )}
        </div>
      ) : (
        <div className="catalog-items-list">
          {filteredUmisteni.map((item) => {
            const parentItem = item.parentId ? umisteni.find((u) => u.id === item.parentId) : null;
            return (
              <div key={item.id} className="catalog-item-card">
                <div className="catalog-item-media">
                  <span className="catalog-item-avatar">📍</span>
                </div>

                <div className="catalog-item-content">
                  <div className="catalog-item-title-row">
                    <h4 className="catalog-item-title">{item.nazev}</h4>
                    {parentItem && <span className="catalog-item-tag">🏠 {parentItem.nazev}</span>}
                  </div>
                </div>

                <div className="catalog-item-actions">
                  <button
                    type="button"
                    className="catalog-action-btn edit"
                    onClick={() => handleStartEdit(item)}
                    title="Upravit umístění"
                    aria-label="Upravit"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="catalog-action-btn delete"
                    onClick={() => {
                      if (window.confirm(`Opravdu chcete smazat umístění "${item.nazev}"?`)) {
                        removeUmisteni(item.id);
                      }
                    }}
                    title="Smazat umístění"
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