import { FormEvent } from 'react';
import type { Druh, Medium, Umisteni } from '../types/app';

type Props = {
  editingId: number | null;
  vlastniJmeno: string;
  setVlastiJmeno: (jmeno: string) => void;
  druhId: string;
  setDruhId: (id: string) => void;
  mediumId: string;
  setMediumId: (id: string) => void;
  umisteniId: string;
  setUmisteniId: (id: string) => void;
  aktualniZdravi: string;
  setAktualniZdravi: (zdravi: string) => void;
  druhy: Druh[];
  media: Medium[];
  umisteni: Umisteni[];
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
  onDelete: (id: number) => Promise<void>;
  message: string | null;
};

export default function RostinaEditor({
  editingId,
  vlastniJmeno,
  setVlastiJmeno,
  druhId,
  setDruhId,
  mediumId,
  setMediumId,
  umisteniId,
  setUmisteniId,
  aktualniZdravi,
  setAktualniZdravi,
  druhy,
  media,
  umisteni,
  onSubmit,
  onCancel,
  onDelete,
  message,
}: Props) {
  return (
    <article className="table-card">
      <h2>{editingId ? 'Upravit rostlinu' : 'Pridat rostlinu'}</h2>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Vlastni jmeno
          <input required value={vlastniJmeno} onChange={(event) => setVlastiJmeno(event.target.value)} />
        </label>

        <label>
          Druh
          <select required value={druhId} onChange={(event) => setDruhId(event.target.value)}>
            <option value="">-- vyber druh --</option>
            {druhy.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>

        <label>
          Medium
          <select value={mediumId} onChange={(event) => setMediumId(event.target.value)}>
            <option value="">-- volitelne --</option>
            {media.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>

        <label>
          Umisteni
          <select value={umisteniId} onChange={(event) => setUmisteniId(event.target.value)}>
            <option value="">-- volitelne --</option>
            {umisteni.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev}
              </option>
            ))}
          </select>
        </label>

        <label>
          Aktualni zdravi (1-5)
          <input
            type="number"
            min={1}
            max={5}
            required
            value={aktualniZdravi}
            onChange={(event) => setAktualniZdravi(event.target.value)}
          />
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
              <button className="button secondary" type="button" onClick={() => onDelete(editingId)}>
                Smazat
              </button>
            </>
          )}
        </div>
        {message && <p>{message}</p>}
      </form>
    </article>
  );
}
