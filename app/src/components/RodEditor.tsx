import { FormEvent } from 'react';

type Props = {
  editingId: number | null;
  nazev: string;
  setNazev: (nazev: string) => void;
  popis: string;
  setPopis: (popis: string) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
  onDelete: (id: number) => Promise<void>;
  message: string | null;
};

export default function RodEditor({
  editingId,
  nazev,
  setNazev,
  popis,
  setPopis,
  onSubmit,
  onCancel,
  onDelete,
  message,
}: Props) {
  return (
    <article className="catalog-editor-card">
      <div className="catalog-editor-header">
        <h3 className="catalog-editor-title">
          {editingId ? `✏️ Upravit rod: ${nazev || ''}` : '✨ Nový botanický rod'}
        </h3>
        <button type="button" className="catalog-editor-close-btn" onClick={onCancel} aria-label="Zavřít">
          ✕
        </button>
      </div>

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Název rodu
          <input
            required
            placeholder="např. Ficus, Monstera, Philodendron, Epipremnum"
            value={nazev}
            onChange={(event) => setNazev(event.target.value)}
          />
        </label>
        <label>
          Popis rodu
          <textarea
            rows={3}
            placeholder="Charakteristika čeledi a rodu..."
            value={popis}
            onChange={(event) => setPopis(event.target.value)}
          />
        </label>
        <div className="catalog-form-actions">
          <button className="catalog-btn-submit" type="submit">
            💾 {editingId ? 'Uložit změny' : 'Přidat rod'}
          </button>
          <button className="catalog-btn-cancel" type="button" onClick={onCancel}>
            Zrušit
          </button>
          {editingId && (
            <button
              className="catalog-btn-delete"
              type="button"
              onClick={() => {
                if (window.confirm(`Opravdu chcete smazat rod "${nazev}"?`)) {
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
