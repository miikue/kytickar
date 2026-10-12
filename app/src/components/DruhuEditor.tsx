import { FormEvent, ChangeEvent } from 'react';
import type { Rod } from '../types/app';

type DruhuForm = {
  nazev: string;
  popis: string;
  rodId: string;
};

type Props = {
  editingId: number | null;
  form: DruhuForm;
  setForm: (form: DruhuForm) => void;
  uploadingPhotos: { fotka1: File | null; fotka2: File | null };
  setUploadingPhotos: (photos: { fotka1: File | null; fotka2: File | null }) => void;
  uploadedPhotoNames: { fotka1: string; fotka2: string };
  rody: Rod[];
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
  onDelete: (id: number) => Promise<void>;
  message: string | null;
};

export default function DruhuEditor({
  editingId,
  form,
  setForm,
  uploadingPhotos,
  setUploadingPhotos,
  uploadedPhotoNames,
  rody,
  onSubmit,
  onCancel,
  onDelete,
  message,
}: Props) {
  return (
    <article className="catalog-editor-card">
      <div className="catalog-editor-header">
        <h3 className="catalog-editor-title">
          {editingId ? `✏️ Upravit druh: ${form.nazev || ''}` : '✨ Nový botanický druh'}
        </h3>
        <button type="button" className="catalog-editor-close-btn" onClick={onCancel} aria-label="Zavřít">
          ✕
        </button>
      </div>

      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Název druhu
          <input
            required
            placeholder="např. Monstera Deliciosa, Ficus Elastica"
            value={form.nazev}
            onChange={(event) => setForm({ ...form, nazev: event.target.value })}
          />
        </label>
        <label>
          Botanický rod
          <select
            value={form.rodId}
            onChange={(event) => setForm({ ...form, rodId: event.target.value })}
            className="rod-picker-select"
          >
            <option value="">-- Bez rodu (vyberte rod) --</option>
            {rody.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>
        <label>
          Popis a nároky druhu
          <textarea
            rows={3}
            placeholder="Nároky na světlo, zálivku, původ..."
            value={form.popis}
            onChange={(event) => setForm({ ...form, popis: event.target.value })}
          />
        </label>
        <label>
          Fotografie druhu (náhled)
          <input
            type="file"
            accept="image/*"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setUploadingPhotos({ ...uploadingPhotos, fotka1: event.target.files?.[0] || null });
            }}
          />
          {uploadedPhotoNames.fotka1 && !uploadingPhotos.fotka1 && (
            <p className="info-text">Aktuálně uloženo: {uploadedPhotoNames.fotka1}</p>
          )}
          {uploadingPhotos.fotka1 && (
            <p className="info-text">
              Nový soubor: {uploadingPhotos.fotka1.name} ({(uploadingPhotos.fotka1.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </label>

        <div className="catalog-form-actions">
          <button className="catalog-btn-submit" type="submit">
            💾 {editingId ? 'Uložit změny' : 'Přidat druh'}
          </button>
          <button className="catalog-btn-cancel" type="button" onClick={onCancel}>
            Zrušit
          </button>
          {editingId && (
            <button
              className="catalog-btn-delete"
              type="button"
              onClick={() => {
                if (window.confirm(`Opravdu chcete smazat druh "${form.nazev}"?`)) {
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
