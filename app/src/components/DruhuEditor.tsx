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
    <article className="table-card">
      <h2>{editingId ? 'Upravit druh' : 'Pridat druh'}</h2>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Nazev
          <input
            required
            value={form.nazev}
            onChange={(event) => setForm({ ...form, nazev: event.target.value })}
          />
        </label>
        <label>
          Popis
          <textarea
            rows={3}
            value={form.popis}
            onChange={(event) => setForm({ ...form, popis: event.target.value })}
          />
        </label>
        <label>
          Rod
          <select
            value={form.rodId}
            onChange={(event) => setForm({ ...form, rodId: event.target.value })}
            className="rod-picker-select"
          >
            <option value="">-- bez rodu --</option>
            {rody.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fotka - mala
          <input
            type="file"
            accept="image/*"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setUploadingPhotos({ ...uploadingPhotos, fotka1: event.target.files?.[0] || null });
            }}
          />
          {uploadedPhotoNames.fotka1 && !uploadingPhotos.fotka1 && (
            <p className="info-text">Aktualne ulozena: {uploadedPhotoNames.fotka1}</p>
          )}
          {uploadingPhotos.fotka1 && (
            <p className="info-text">
              Novy soubor: {uploadingPhotos.fotka1.name} ({(uploadingPhotos.fotka1.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </label>

        <label>
          Fotka - velka
          <input
            type="file"
            accept="image/*"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              setUploadingPhotos({ ...uploadingPhotos, fotka2: event.target.files?.[0] || null });
            }}
          />
          {uploadedPhotoNames.fotka2 && !uploadingPhotos.fotka2 && (
            <p className="info-text">Aktualne ulozena: {uploadedPhotoNames.fotka2}</p>
          )}
          {uploadingPhotos.fotka2 && (
            <p className="info-text">
              Novy soubor: {uploadingPhotos.fotka2.name} ({(uploadingPhotos.fotka2.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </label>

        <div className="form-actions">
          <button className="button primary" type="submit">
            Ulozit
          </button>
          {editingId && (
            <>
              <button className="button secondary" type="button" onClick={onCancel}>
                Zrusit editaci
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => onDelete(editingId)}
              >
                Smazat druh
              </button>
            </>
          )}
        </div>
        {message && <p>{message}</p>}
      </form>
    </article>
  );
}
