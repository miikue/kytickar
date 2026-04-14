import type { FormEvent } from 'react';

type Props = {
  editingId: number | null;
  typAkceNazev: string;
  setTypAkceNazev: (nazev: string) => void;
  onSubmit: (event: FormEvent) => Promise<void>;
  onCancel: () => void;
  onDelete: (id: number) => Promise<void>;
  message: string | null;
};

export default function TypAkceEditor({
  editingId,
  typAkceNazev,
  setTypAkceNazev,
  onSubmit,
  onCancel,
  onDelete,
  message,
}: Props) {
  return (
    <article className="table-card">
      <h2>{editingId ? 'Upravit typ akce' : 'Pridat typ akce'}</h2>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Nazev typu akce
          <input required value={typAkceNazev} onChange={(event) => setTypAkceNazev(event.target.value)} />
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