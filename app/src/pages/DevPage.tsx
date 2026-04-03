import { useEffect, useState } from 'react';
import TopNavButton from '../components/TopNavButton';
import { API_BASE_URL } from '../config';
import type { DevOverview, DevTableName, DevTableResponse } from '../types/app';

export default function DevPage() {
  const apiLabel = API_BASE_URL || 'relativni API proxy pres Vite';
  const [data, setData] = useState<DevOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<DevTableName>('media');
  const [selectedRows, setSelectedRows] = useState<Array<Record<string, unknown>>>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/dev/overview`);

        if (!response.ok) {
          throw new Error(`Backend vratil ${response.status}`);
        }

        const payload = (await response.json()) as DevOverview;

        if (active) {
          setData(payload);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Neznama chyba');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTable() {
      try {
        setTableLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/dev/table/${selectedTable}`);

        if (!response.ok) {
          throw new Error(`Backend vratil ${response.status}`);
        }

        const payload = (await response.json()) as DevTableResponse;

        if (active) {
          setSelectedRows(payload.rows);
          setTableError(null);
        }
      } catch (err) {
        if (active) {
          setTableError(err instanceof Error ? err.message : 'Neznama chyba');
          setSelectedRows([]);
        }
      } finally {
        if (active) {
          setTableLoading(false);
        }
      }
    }

    loadTable();

    return () => {
      active = false;
    };
  }, [selectedTable]);

  const cards: Array<{ key: DevTableName; label: string; value: number }> = data
    ? [
        { key: 'media', label: 'media', value: data.counts.media },
        { key: 'druhy', label: 'druhy', value: data.counts.druhy },
        { key: 'umisteni', label: 'umisteni', value: data.counts.umisteni },
        { key: 'rostliny', label: 'rostliny', value: data.counts.rostliny },
        { key: 'typyAkci', label: 'typy_akci', value: data.counts.typyAkci },
        { key: 'historiePece', label: 'historie_pece', value: data.counts.historiePece },
        { key: 'odlozeneAkce', label: 'odlozene_akce', value: data.counts.odlozeneAkce },
        { key: 'galerieFotky', label: 'galerie_fotky', value: data.counts.galerieFotky },
      ]
    : [];

  return (
    <main className="shell">
      <header className="top-row top-row-end">
        <TopNavButton />
      </header>
      <section className="hero">
        <p className="eyebrow">Dev Panel</p>
        <h1>Stav databaze</h1>
        <p className="lead">Tady vidis rychly prehled nad SQLite databazi a poslednimi zaznamy.</p>
        <div className="hero-actions">
          <a className="button primary" href="/">
            Zpet na uvod
          </a>
          <a className="button secondary" href={`${API_BASE_URL}/health`} target="_blank" rel="noreferrer">
            Health endpoint
          </a>
        </div>
      </section>

      {loading && <section className="panel-single">Nacitam data z backendu...</section>}

      {error && !loading && (
        <section className="panel-single error-box">
          Nepodarilo se nacist data: {error}. Over, ze backend bezi pres {apiLabel}.
        </section>
      )}

      {data && !loading && !error && (
        <>
          <section className="panel" aria-label="Pocty tabulek">
            {cards.map((card) => (
              <button
                key={card.key}
                className={`card card-button ${selectedTable === card.key ? 'active' : ''}`}
                type="button"
                onClick={() => {
                  setSelectedTable(card.key);
                }}
              >
                <h2>{card.label}</h2>
                <p>{card.value}</p>
              </button>
            ))}
            <article className="card">
              <h2>aktualizace</h2>
              <p>{new Date(data.generatedAt).toLocaleString('cs-CZ')}</p>
            </article>
          </section>

          <section className="table-card" aria-label="Obsah vybrane tabulky">
            <h2>Obsah tabulky: {selectedTable}</h2>

            {tableLoading && <p>Nacitam obsah tabulky...</p>}

            {tableError && !tableLoading && <p className="error-text">Chyba nacitani: {tableError}</p>}

            {!tableLoading && !tableError && selectedRows.length === 0 && <p>Tabulka je prazdna.</p>}

            {!tableLoading && !tableError && selectedRows.length > 0 && (
              <pre className="json-view">{JSON.stringify(selectedRows, null, 2)}</pre>
            )}
          </section>

          <section className="dev-tables" aria-label="Posledni data">
            <article className="table-card">
              <h2>Posledni rostliny</h2>
              <ul>
                {data.posledniRostliny.map((item) => (
                  <li key={item.id}>
                    #{item.id} {item.vlastniJmeno} ({item.druh.nazev}), zdravi {item.aktualniZdravi}/5
                  </li>
                ))}
                {data.posledniRostliny.length === 0 && <li>Zatim bez zaznamu.</li>}
              </ul>
            </article>

            <article className="table-card">
              <h2>Posledni media</h2>
              <ul>
                {data.posledniMedia.map((item) => (
                  <li key={item.id}>
                    #{item.id} {item.nazev} | popis: {item.popis || '-'}
                  </li>
                ))}
                {data.posledniMedia.length === 0 && <li>Zatim bez zaznamu.</li>}
              </ul>
            </article>

            <article className="table-card">
              <h2>Posledni historie pece</h2>
              <ul>
                {data.posledniHistorie.map((item) => (
                  <li key={item.id}>
                    {new Date(item.datum).toLocaleString('cs-CZ')}: {item.rostlina.vlastniJmeno} - {item.typAkce.typAkce}
                  </li>
                ))}
                {data.posledniHistorie.length === 0 && <li>Zatim bez zaznamu.</li>}
              </ul>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
