import { useState, type FormEvent } from 'react';
import TypAkceEditor from '../components/TypAkceEditor';
import type { TypAkce } from '../types/app';
import { getDefaultActionIcon } from '../services/localDb';

type Props = {
  typyAkci: TypAkce[];
  editingTypAkceId: number | null;
  setEditingTypAkceId: (id: number | null) => void;
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
  submitTypAkce: (event: FormEvent) => Promise<void>;
  removeTypAkce: (id: number) => Promise<void>;
  typAkceMessage: string | null;
  setTypAkceMessage: (message: string | null) => void;
};

export default function TypyAkciPage({
  typyAkci,
  editingTypAkceId,
  setEditingTypAkceId,
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
  submitTypAkce,
  removeTypAkce,
  typAkceMessage,
  setTypAkceMessage,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isFormOpen = editingTypAkceId !== null || isAdding;

  function handleStartAdd() {
    setEditingTypAkceId(null);
    setTypAkceNazev('');
    setTypAkceIkona('💧');
    setTypAkceInterval('7');
    setTypAkceOdlozit('2');
    setTypAkceIsWatering(false);
    setTypAkceMessage(null);
    setIsAdding(true);
  }

  function handleStartEdit(item: TypAkce) {
    setIsAdding(false);
    setEditingTypAkceId(item.id);
    setTypAkceNazev(item.typAkce);
    setTypAkceIkona(item.ikona || getDefaultActionIcon(item.typAkce));
    setTypAkceInterval(item.intervalDny !== undefined && item.intervalDny !== null ? String(item.intervalDny) : '7');
    setTypAkceOdlozit(item.odlozitDny !== undefined && item.odlozitDny !== null ? String(item.odlozitDny) : '2');
    setTypAkceIsWatering(Boolean(item.isWatering));
    setTypAkceMessage(null);
  }

  function handleCancel() {
    setIsAdding(false);
    setEditingTypAkceId(null);
    setTypAkceNazev('');
    setTypAkceIkona('💧');
    setTypAkceInterval('7');
    setTypAkceOdlozit('2');
    setTypAkceIsWatering(false);
    setTypAkceMessage(null);
  }

  async function handleSubmit(e: FormEvent) {
    await submitTypAkce(e);
    setIsAdding(false);
  }

  const filteredTypy = typyAkci.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return item.typAkce.toLowerCase().includes(q);
  });

  return (
    <div className="catalog-tab-page">
      <div className="catalog-section-bar">
        <div className="catalog-section-top-row">
          <h3 className="catalog-section-title">
            <span>⚡</span> Typy péče a zásahů
            <span className="category-chip-badge">{typyAkci.length}</span>
          </h3>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" onClick={handleStartAdd}>
              <span>+</span> Přidat typ péče
            </button>
          )}
        </div>

        {typyAkci.length > 0 && !isFormOpen && (
          <input
            type="search"
            className="catalog-search-input"
            placeholder="🔍 Hledat typ péče podle názvu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        )}
      </div>

      {typAkceMessage && (
        <div
          className={`catalog-feedback-banner ${
            typAkceMessage.includes('selhalo') || typAkceMessage.includes('nelze') ? 'error' : 'success'
          }`}
        >
          <span className="feedback-banner-icon">
            {typAkceMessage.includes('selhalo') || typAkceMessage.includes('nelze') ? '⚠️' : '✅'}
          </span>
          <span className="feedback-banner-text">{typAkceMessage}</span>
          <button
            type="button"
            className="catalog-feedback-dismiss"
            onClick={() => setTypAkceMessage(null)}
            aria-label="Zavřít"
          >
            ✕
          </button>
        </div>
      )}

      {isFormOpen && (
        <TypAkceEditor
          editingId={editingTypAkceId}
          typAkceNazev={typAkceNazev}
          setTypAkceNazev={setTypAkceNazev}
          typAkceIkona={typAkceIkona}
          setTypAkceIkona={setTypAkceIkona}
          typAkceInterval={typAkceInterval}
          setTypAkceInterval={setTypAkceInterval}
          typAkceOdlozit={typAkceOdlozit}
          setTypAkceOdlozit={setTypAkceOdlozit}
          typAkceIsWatering={typAkceIsWatering}
          setTypAkceIsWatering={setTypAkceIsWatering}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onDelete={removeTypAkce}
          message={typAkceMessage}
        />
      )}

      {filteredTypy.length === 0 ? (
        <div className="catalog-empty-state">
          <span className="catalog-empty-icon">⚡</span>
          <p>{searchQuery ? 'Žádný typ péče neodpovídá hledání.' : 'Zatím nemáte vytvořené žádné typy péče.'}</p>
          {!isFormOpen && (
            <button type="button" className="catalog-add-btn" style={{ margin: '8px auto 0' }} onClick={handleStartAdd}>
              + Přidat první typ péče
            </button>
          )}
        </div>
      ) : (
        <div className="catalog-items-list">
          {filteredTypy.map((item) => (
            <div key={item.id} className="catalog-item-card">
              <div className="catalog-item-media">
                <span className="catalog-item-avatar">{item.ikona || getDefaultActionIcon(item.typAkce)}</span>
              </div>

              <div className="catalog-item-content">
                <div className="catalog-item-title-row">
                  <h4 className="catalog-item-title">{item.typAkce}</h4>
                </div>
                <div className="catalog-item-tags-row">
                  {item.isWatering ? (
                    <span className="catalog-item-tag watering" title="Považováno za hlavní zálivku">
                      💧 Zálivka
                    </span>
                  ) : null}
                  {item.intervalDny ? (
                    <span className="catalog-item-tag timing" title={`Připomínat každých ${item.intervalDny} dní`}>
                      ⏱️ {item.intervalDny} d
                    </span>
                  ) : null}
                  {item.odlozitDny ? (
                    <span className="catalog-item-tag snooze" title={`Při odložení posunout o ${item.odlozitDny} dní`}>
                      ⏳ +{item.odlozitDny} d
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="catalog-item-actions">
                <button
                  type="button"
                  className="catalog-action-btn edit"
                  onClick={() => handleStartEdit(item)}
                  title="Upravit typ péče"
                  aria-label="Upravit"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="catalog-action-btn delete"
                  onClick={() => {
                    if (window.confirm(`Opravdu chcete smazat typ péče "${item.typAkce}"?`)) {
                      removeTypAkce(item.id);
                    }
                  }}
                  title="Smazat typ péče"
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