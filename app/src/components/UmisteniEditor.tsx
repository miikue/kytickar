import type { FormEvent } from 'react';
import type { Umisteni } from '../types/app';

type FormState = {
  nazev: string;
  parentId: string;
};

type Props = {
  editingId: number | null;
  form: FormState;
  setForm: (form: FormState) => void;
  umisteni: Umisteni[];
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
  onDelete: (id: number) => Promise<void>;
  message: string | null;
};

export default function UmisteniEditor({ editingId, form, setForm, umisteni, onSubmit, onCancel, onDelete, message }: Props) {
  const parentOptions = umisteni.filter((item) => item.id !== editingId);

  return (
    <article className="catalog-editor-card">
      <div className="catalog-editor-header">
        <h3 className="catalog-editor-title">
          {editingId ? `✏️ Upravit umístění: ${form.nazev || ''}` : '✨ Nové umístění'}
        </h3>
        <button type="button" className="catalog-editor-close-btn" onClick={onCancel} aria-label="Zavřít">
          ✕
        </button>
      </div>

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Název umístění
          <input
            required
            placeholder="např. Obývací pokoj, Parapet na jih, Koupelna, Balkón"
            value={form.nazev}
            onChange={(event) => setForm({ ...form, nazev: event.target.value })}
          />
        </label>
        <label>
          Nadřazená místnost / zóna (volitelné)
          <select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
            <option value="">-- Samostatné umístění (bez nadřazeného) --</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                📍 {item.nazev}
              </option>
            ))}
          </select>
        </label>
        <div className="catalog-form-actions">
          <button className="catalog-btn-submit" type="submit">
            💾 {editingId ? 'Uložit změny' : 'Přidat umístění'}
          </button>
          <button className="catalog-btn-cancel" type="button" onClick={onCancel}>
            Zrušit
          </button>
          {editingId && (
            <button
              className="catalog-btn-delete"
              type="button"
              onClick={() => {
                if (window.confirm(`Opravdu chcete smazat umístění "${form.nazev}"?`)) {
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