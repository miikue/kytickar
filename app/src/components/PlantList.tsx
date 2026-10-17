import type { Dispatch, SetStateAction } from 'react';
import { getFileUrl } from '../api/http';
import type { Rostlina, Umisteni } from '../types/app';

type Props = {
  rostliny: Rostlina[];
  filteredRostliny: Rostlina[];
  umisteni: Umisteni[];
  selectedId: number | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedUmisteniFilterId: string;
  setSelectedUmisteniFilterId: (id: string) => void;
  isSearchExpanded: boolean;
  setIsSearchExpanded: Dispatch<SetStateAction<boolean>>;
  onSelectPlant: (id: number) => void;
};

export default function PlantList({
  rostliny,
  filteredRostliny,
  umisteni,
  selectedId,
  searchQuery,
  setSearchQuery,
  selectedUmisteniFilterId,
  setSelectedUmisteniFilterId,
  isSearchExpanded,
  setIsSearchExpanded,
  onSelectPlant,
}: Props) {
  return (
    <>
      {/* HLAVNÍ SEZNAM ROSTLIN S NENÁPADNÝM VYHLEDÁVÁNÍM */}
      <div className="plants-section-header">
        <div className="plants-section-title-wrap">
          <h2 className="plants-section-title">Moje kytičky</h2>
          <span className="plants-count-pill">
            {filteredRostliny.length === rostliny.length
              ? rostliny.length
              : `${filteredRostliny.length} / ${rostliny.length}`}
          </span>
        </div>

        <div className="plants-section-actions">
          <button
            type="button"
            className={`plants-search-toggle-btn ${
              isSearchExpanded || searchQuery || selectedUmisteniFilterId !== 'all' ? 'active' : ''
            }`}
            onClick={() => setIsSearchExpanded((prev) => !prev)}
            title={isSearchExpanded ? 'Zavřít hledání' : 'Hledat a filtrovat kytičky'}
            aria-label="Hledat a filtrovat"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      {/* NENÁPADNÝ ROZBALOVACÍ VYHLEDÁVACÍ A FILTROVACÍ PANEL */}
      {(isSearchExpanded || searchQuery || selectedUmisteniFilterId !== 'all') && (
        <div className="plants-subtle-search-bar">
          <div className="plants-subtle-search-input-wrap">
            <span className="plants-subtle-search-icon">🔍</span>
            <input
              type="search"
              className="plants-subtle-search-input"
              placeholder="Hledat podle jména, druhu či umístění..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus={isSearchExpanded && !searchQuery}
            />
            {searchQuery && (
              <button
                type="button"
                className="plants-subtle-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Smazat hledaný text"
              >
                ✕
              </button>
            )}
          </div>

          {umisteni && umisteni.length > 0 && (
            <div className="plants-filter-chips-row">
              <button
                type="button"
                className={`filter-chip ${selectedUmisteniFilterId === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedUmisteniFilterId('all')}
              >
                Vše ({rostliny.length})
              </button>
              {umisteni.map((u) => {
                const count = rostliny.filter((r) => r.umisteni?.id === u.id).length;
                if (count === 0) return null;
                return (
                  <button
                    key={u.id}
                    type="button"
                    className={`filter-chip ${selectedUmisteniFilterId === String(u.id) ? 'active' : ''}`}
                    onClick={() =>
                      setSelectedUmisteniFilterId(selectedUmisteniFilterId === String(u.id) ? 'all' : String(u.id))
                    }
                  >
                    📍 {u.nazev} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {rostliny.length === 0 ? (
        <div className="plants-empty-state">
          <span className="empty-icon">🪴</span>
          <p>Zatím tu nemáte žádné kytičky.</p>
        </div>
      ) : filteredRostliny.length === 0 ? (
        <div className="plants-empty-state">
          <span className="empty-icon">🔍</span>
          <p>Žádná kytička neodpovídá zadanému hledání.</p>
          <button
            type="button"
            className="plants-empty-reset-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedUmisteniFilterId('all');
            }}
          >
            Zrušit filtry
          </button>
        </div>
      ) : (
        <div className="mobile-plants-grid">
          {filteredRostliny.map((item) => {
            const thumb = item.galerieFotky?.[0];
            const isSelected = item.id === selectedId;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className={`mobile-plant-card ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectPlant(item.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectPlant(item.id);
                  }
                }}
              >
                <div className="mobile-plant-card-media">
                  {thumb ? (
                    <img src={getFileUrl(thumb.fotkaName)} alt={item.vlastniJmeno} className="mobile-plant-card-img" />
                  ) : (
                    <div className="mobile-plant-card-empty">🌿</div>
                  )}
                  <span className="mobile-plant-health-badge">💚 {item.aktualniZdravi}/5</span>
                </div>
                <div className="mobile-plant-card-body">
                  <strong className="mobile-plant-card-title">{item.vlastniJmeno}</strong>
                  <span className="mobile-plant-card-species">{item.druh?.nazev || '-'}</span>
                  {item.umisteni && <span className="mobile-plant-card-location">📍 {item.umisteni.nazev}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
