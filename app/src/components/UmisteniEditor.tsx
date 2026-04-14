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
    <article className="table-card">
      <h2>{editingId ? 'Upravit umisteni' : 'Pridat umisteni'}</h2>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Nazev umisteni
          <input required value={form.nazev} onChange={(event) => setForm({ ...form, nazev: event.target.value })} />
        </label>
        <label>
          Nadrazene umisteni
          <select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
            <option value="">Bez nadrazeneho umisteni</option>
            {parentOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nazev} (ID {item.id})
              </option>
            ))}
          </select>
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