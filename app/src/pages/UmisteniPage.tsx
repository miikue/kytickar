import type { FormEvent } from 'react';
import UmisteniEditor from '../components/UmisteniEditor';
import type { Umisteni } from '../types/app';

type FormState = {
  nazev: string;
  parentId: string;
};

type Props = {
  umisteni: Umisteni[];
  editingUmisteniId: number | null;
  setEditingUmisteniId: (id: number | null) => void;
  umisteniForm: FormState;
  setUmisteniForm: (form: FormState) => void;
  submitUmisteni: (event: FormEvent) => Promise<void>;
  removeUmisteni: (id: number) => Promise<void>;
  umisteniMessage: string | null;
  setUmisteniMessage: (message: string | null) => void;
};

export default function UmisteniPage({
  umisteni,
  editingUmisteniId,
  setEditingUmisteniId,
  umisteniForm,
  setUmisteniForm,
  submitUmisteni,
  removeUmisteni,
  umisteniMessage,
  setUmisteniMessage,
}: Props) {
  return (
    <section className="dev-tables">
      <article className="table-card">
        <h2>Existujici umisteni</h2>
        {umisteni.length === 0 && <p>Zatim nejsou zadna umisteni.</p>}
        {umisteni.length > 0 && (
          <ul>
            {umisteni.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => {
                    setEditingUmisteniId(item.id);
                    setUmisteniForm({
                      nazev: item.nazev,
                      parentId: item.parentId ? String(item.parentId) : '',
                    });
                  }}
                >
                  Upravit
                </button>{' '}
                <button type="button" className="inline-action" onClick={() => removeUmisteni(item.id)}>
                  Smazat
                </button>{' '}
                <strong>{item.nazev}</strong> | nadrazene ID: {item.parentId || '-'}
              </li>
            ))}
          </ul>
        )}
      </article>

      <UmisteniEditor
        editingId={editingUmisteniId}
        form={umisteniForm}
        setForm={setUmisteniForm}
        umisteni={umisteni}
        onSubmit={submitUmisteni}
        onCancel={() => {
          setEditingUmisteniId(null);
          setUmisteniForm({ nazev: '', parentId: '' });
          setUmisteniMessage(null);
        }}
        onDelete={removeUmisteni}
        message={umisteniMessage}
      />
    </section>
  );
}