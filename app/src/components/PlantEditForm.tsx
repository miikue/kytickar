import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type { Druh, Medium, Umisteni } from '../types/app';

export type PlantEditFormData = {
  vlastniJmeno: string;
  druhId: string;
  mediumId: string;
  umisteniId: string;
  aktualniZdravi: string;
};

type Props = {
  editForm: PlantEditFormData;
  setEditForm: Dispatch<SetStateAction<PlantEditFormData>>;
  druhy: Druh[];
  media: Medium[];
  umisteni: Umisteni[];
  onSubmit: (event: FormEvent) => Promise<void>;
  editMessage: string | null;
};

export default function PlantEditForm({
  editForm,
  setEditForm,
  druhy,
  media,
  umisteni,
  onSubmit,
  editMessage,
}: Props) {
  return (
    <section className="detail-section-card edit-card">
      <h3 className="section-card-title">Editace rostliny</h3>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Vlastní jméno
          <input
            required
            value={editForm.vlastniJmeno}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, vlastniJmeno: event.target.value }))
            }
          />
        </label>

        <label>
          Druh
          <select
            required
            value={editForm.druhId}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, druhId: event.target.value }))
            }
          >
            <option value="">-- vyber druh --</option>
            {druhy.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>

        <label>
          Substrát / Médium
          <select
            value={editForm.mediumId}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, mediumId: event.target.value }))
            }
          >
            <option value="">-- volitelné --</option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>

        <label>
          Umístění
          <select
            value={editForm.umisteniId}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, umisteniId: event.target.value }))
            }
          >
            <option value="">-- volitelné --</option>
            {umisteni.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>

        <label>
          Aktuální zdraví (0-5)
          <input
            type="number"
            min={0}
            max={5}
            required
            value={editForm.aktualniZdravi}
            onChange={(event) =>
              setEditForm((prev) => ({ ...prev, aktualniZdravi: event.target.value }))
            }
          />
        </label>

        <div className="form-actions">
          <button className="action-button primary" type="submit">
            Uložit změny
          </button>
        </div>

        {editMessage && <p className="detail-feedback-msg">{editMessage}</p>}
      </form>
    </section>
  );
}
