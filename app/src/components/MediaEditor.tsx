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

export default function MediaEditor({
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
    <article className="table-card">
      <h2>{editingId ? 'Upravit medium' : 'Pridat medium'}</h2>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Nazev media
          <input required value={nazev} onChange={(event) => setNazev(event.target.value)} />
        </label>
        <label>
          Poznamka
          <textarea value={popis} onChange={(event) => setPopis(event.target.value)} />
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
