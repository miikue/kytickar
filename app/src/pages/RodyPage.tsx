import type { FormEvent } from 'react';
import RodEditor from '../components/RodEditor';
import type { Rod } from '../types/app';

type Props = {
  rody: Rod[];
  editingRodId: number | null;
  setEditingRodId: (id: number | null) => void;
  rodNazev: string;
  setRodNazev: (nazev: string) => void;
  rodPopis: string;
  setRodPopis: (popis: string) => void;
  submitRod: (event: FormEvent) => Promise<void>;
  removeRod: (id: number) => Promise<void>;
  rodMessage: string | null;
  setRodMessage: (message: string | null) => void;
};

export default function RodyPage({
  rody,
  editingRodId,
  setEditingRodId,
  rodNazev,
  setRodNazev,
  rodPopis,
  setRodPopis,
  submitRod,
  removeRod,
  rodMessage,
  setRodMessage,
}: Props) {
  return (
    <section className="dev-tables">
      <article className="table-card">
        <h2>Existujici rody</h2>
        {rody.length === 0 && <p>Zatim nejsou zadne rody.</p>}
        {rody.length > 0 && (
          <ul>
            {rody.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => {
                    setEditingRodId(item.id);
                    setRodNazev(item.nazev);
                    setRodPopis(item.popis || '');
                  }}
                >
                  Upravit
                </button>{' '}
                <button type="button" className="inline-action" onClick={() => removeRod(item.id)}>
                  Smazat
                </button>{' '}
                <strong>{item.nazev}</strong> | popis: {item.popis || '-'}
              </li>
            ))}
          </ul>
        )}
      </article>

      <RodEditor
        editingId={editingRodId}
        nazev={rodNazev}
        setNazev={setRodNazev}
        popis={rodPopis}
        setPopis={setRodPopis}
        onSubmit={submitRod}
        onCancel={() => {
          setEditingRodId(null);
          setRodNazev('');
          setRodPopis('');
          setRodMessage(null);
        }}
        onDelete={removeRod}
        message={rodMessage}
      />
    </section>
  );
}
