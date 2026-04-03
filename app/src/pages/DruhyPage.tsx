import type { FormEvent } from 'react';
import DruhuEditor from '../components/DruhuEditor';
import { API_BASE_URL } from '../config';
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
}: Props) {
  return (
    <section className="dev-tables">
      <article className="table-card">
        <h2>Existujici druhy</h2>
        {druhy.length === 0 && <p>Zatim nejsou zadne druhy.</p>}
        {druhy.length > 0 && (
          <ul>
            {druhy.map((item) => (
              <li key={item.id}>
                <div className="druh-item">
                  <div className="druh-photos">
                    {item.fotka1Name && <img src={`${API_BASE_URL}/api/files/${item.fotka1Name}`} alt="Fotka 1" className="druh-photo-small" />}
                    {item.fotka2Name && <img src={`${API_BASE_URL}/api/files/${item.fotka2Name}`} alt="Fotka 2" className="druh-photo-large" />}
                  </div>
                  <div className="druh-info">
                    <div>
                      <button
                        type="button"
                        className="inline-action"
                        onClick={() => {
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
                        }}
                      >
                        Upravit
                      </button>{' '}
                      <button type="button" className="inline-action" onClick={() => removeDruh(item.id)}>
                        Smazat
                      </button>{' '}
                      <strong>{item.nazev}</strong> | rod: {item.rod?.nazev || '-'}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <DruhuEditor
        editingId={editingDruhId}
        form={druhForm}
        setForm={setDruhForm}
        uploadingPhotos={uploadingDruhPhotos}
        setUploadingPhotos={setUploadingDruhPhotos}
        uploadedPhotoNames={uploadedDruhPhotoNames}
        rody={rody}
        onSubmit={submitDruh}
        onCancel={() => {
          setEditingDruhId(null);
          setDruhForm({ nazev: '', popis: '', rodId: '' });
          setUploadingDruhPhotos({ fotka1: null, fotka2: null });
          setUploadedDruhPhotoNames({ fotka1: '', fotka2: '' });
        }}
        onDelete={removeDruh}
        message={druhMessage}
      />
    </section>
  );
}
