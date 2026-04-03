import type { FormEvent } from 'react';
import MediaEditor from '../components/MediaEditor';
import type { Medium } from '../types/app';

type Props = {
  media: Medium[];
  editingMediaId: number | null;
  setEditingMediaId: (id: number | null) => void;
  mediaNazev: string;
  setMediaNazev: (nazev: string) => void;
  mediaPopis: string;
  setMediaPopis: (popis: string) => void;
  submitMedia: (event: FormEvent) => Promise<void>;
  removeMedia: (id: number) => Promise<void>;
  mediaMessage: string | null;
  setMediaMessage: (message: string | null) => void;
};

export default function MediaPage({
  media,
  editingMediaId,
  setEditingMediaId,
  mediaNazev,
  setMediaNazev,
  mediaPopis,
  setMediaPopis,
  submitMedia,
  removeMedia,
  mediaMessage,
  setMediaMessage,
}: Props) {
  return (
    <section className="dev-tables">
      <article className="table-card">
        <h2>Existujici media</h2>
        {media.length === 0 && <p>Zatim nejsou zadna media.</p>}
        {media.length > 0 && (
          <ul>
            {media.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="inline-action"
                  onClick={() => {
                    setEditingMediaId(item.id);
                    setMediaNazev(item.nazev);
                    setMediaPopis(item.popis || '');
                  }}
                >
                  Upravit
                </button>{' '}
                <button type="button" className="inline-action" onClick={() => removeMedia(item.id)}>
                  Smazat
                </button>{' '}
                <strong>{item.nazev}</strong> | popis: {item.popis || '-'}
              </li>
            ))}
          </ul>
        )}
      </article>

      <MediaEditor
        editingId={editingMediaId}
        nazev={mediaNazev}
        setNazev={setMediaNazev}
        popis={mediaPopis}
        setPopis={setMediaPopis}
        onSubmit={submitMedia}
        onCancel={() => {
          setEditingMediaId(null);
          setMediaNazev('');
          setMediaPopis('');
          setMediaMessage(null);
        }}
        onDelete={removeMedia}
        message={mediaMessage}
      />
    </section>
  );
}
