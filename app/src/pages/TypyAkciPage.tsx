import type { FormEvent } from 'react';
import TypAkceEditor from '../components/TypAkceEditor';
import type { TypAkce } from '../types/app';

type Props = {
  typyAkci: TypAkce[];
  editingTypAkceId: number | null;
  setEditingTypAkceId: (id: number | null) => void;
  typAkceNazev: string;
  setTypAkceNazev: (nazev: string) => void;
  submitTypAkce: (event: FormEvent) => Promise<void>;
  removeTypAkce: (id: number) => Promise<void>;
  typAkceMessage: string | null;
  setTypAkceMessage: (message: string | null) => void;
};

export default function TypyAkciPage({
  typyAkci,
  editingTypAkceId,
  setEditingTypAkceId,
  typAkceNazev,
  setTypAkceNazev,
  submitTypAkce,
  removeTypAkce,
  typAkceMessage,
  setTypAkceMessage,
}: Props) {
  return (
    <section className="dev-tables">
      <article className="table-card">
        <h2>Existujici typy akci</h2>
        {typyAkci.length === 0 && <p>Zatim nejsou zadne typy akci.</p>}
        {typyAkci.length > 0 && (
          <ul>
            {typyAkci.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => {
                    setEditingTypAkceId(item.id);
                    setTypAkceNazev(item.typAkce);
                  }}
                >
                  Upravit
                </button>{' '}
                <button type="button" className="inline-action" onClick={() => removeTypAkce(item.id)}>
                  Smazat
                </button>{' '}
                <strong>{item.typAkce}</strong>
              </li>
            ))}
          </ul>
        )}
      </article>

      <TypAkceEditor
        editingId={editingTypAkceId}
        typAkceNazev={typAkceNazev}
        setTypAkceNazev={setTypAkceNazev}
        onSubmit={submitTypAkce}
        onCancel={() => {
          setEditingTypAkceId(null);
          setTypAkceNazev('');
          setTypAkceMessage(null);
        }}
        onDelete={removeTypAkce}
        message={typAkceMessage}
      />
    </section>
  );
}