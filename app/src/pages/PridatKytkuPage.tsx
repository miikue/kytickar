import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Druh, Medium, Rod, Umisteni } from '../types/app';

type NewPlantForm = {
  vlastniJmeno: string;
  druhId: string;
  mediumId: string;
  umisteniId: string;
  aktualniZdravi: string;
};

type Props = {
  form: NewPlantForm;
  setForm: (updater: (prev: NewPlantForm) => NewPlantForm) => void;
  initialPhoto: File | null;
  setInitialPhoto: (photo: File | null) => void;
  initialPhotoMessage: string | null;
  setInitialPhotoMessage: (message: string | null) => void;
  druhy: Druh[];
  rody: Rod[];
  media: Medium[];
  umisteni: Umisteni[];
  onSubmit: (event: FormEvent) => Promise<void>;
  message: string | null;
  showNewDruhForm: boolean;
  setShowNewDruhForm: (show: boolean) => void;
  newDruhNazev: string;
  setNewDruhNazev: (nazev: string) => void;
  newDruhPopis: string;
  setNewDruhPopis: (popis: string) => void;
  newDruhMessage: string | null;
  newDruhRodId: string;
  setNewDruhRodId: (rodId: string) => void;
  showNewDruhRodForm: boolean;
  setShowNewDruhRodForm: (show: boolean) => void;
  newDruhRodNazev: string;
  setNewDruhRodNazev: (nazev: string) => void;
  newDruhRodPopis: string;
  setNewDruhRodPopis: (popis: string) => void;
  newDruhRodMessage: string | null;
  createInlineDruh: () => Promise<void>;
  createInlineDruhRod: () => Promise<void>;
  showNewMediumForm: boolean;
  setShowNewMediumForm: (show: boolean) => void;
  newMediumNazev: string;
  setNewMediumNazev: (nazev: string) => void;
  newMediumPopis: string;
  setNewMediumPopis: (popis: string) => void;
  newMediumMessage: string | null;
  createInlineMedium: () => Promise<void>;
  showNewUmisteniForm: boolean;
  setShowNewUmisteniForm: (show: boolean) => void;
  newUmisteniNazev: string;
  setNewUmisteniNazev: (nazev: string) => void;
  newUmisteniMessage: string | null;
  createInlineUmisteni: () => Promise<void>;
};

export default function PridatKytkuPage({
  form,
  setForm,
  initialPhoto,
  setInitialPhoto,
  initialPhotoMessage,
  setInitialPhotoMessage,
  druhy,
  rody,
  media,
  umisteni,
  onSubmit,
  message,
  showNewDruhForm,
  setShowNewDruhForm,
  newDruhNazev,
  setNewDruhNazev,
  newDruhPopis,
  setNewDruhPopis,
  newDruhMessage,
  newDruhRodId,
  setNewDruhRodId,
  showNewDruhRodForm,
  setShowNewDruhRodForm,
  newDruhRodNazev,
  setNewDruhRodNazev,
  newDruhRodPopis,
  setNewDruhRodPopis,
  newDruhRodMessage,
  createInlineDruh,
  createInlineDruhRod,
  showNewMediumForm,
  setShowNewMediumForm,
  newMediumNazev,
  setNewMediumNazev,
  newMediumPopis,
  setNewMediumPopis,
  newMediumMessage,
  createInlineMedium,
  showNewUmisteniForm,
  setShowNewUmisteniForm,
  newUmisteniNazev,
  setNewUmisteniNazev,
  newUmisteniMessage,
  createInlineUmisteni,
}: Props) {
  const [selectedRodFilterId, setSelectedRodFilterId] = useState('');
  const selectedDruh = druhy.find((item) => String(item.id) === form.druhId) || null;
  const selectedDruhRodNazev = selectedDruh
    ? selectedDruh.rod?.nazev || rody.find((rod) => rod.id === selectedDruh.rodId)?.nazev || null
    : null;
  const filteredDruhy = useMemo(
    () => (selectedRodFilterId ? druhy.filter((item) => String(item.rodId || '') === selectedRodFilterId) : []),
    [druhy, selectedRodFilterId],
  );

  return (
    <section className="table-card">
      <h2>Pridat novou kytku</h2>
      <form className="stack-form" onSubmit={onSubmit}>
        <label>
          Vlastni jmeno
          <input required value={form.vlastniJmeno} onChange={(event) => setForm((prev) => ({ ...prev, vlastniJmeno: event.target.value }))} />
        </label>

        <label>
          Druh
          <div className="add-picker-block">
            <div className="add-picker-row">
              <select
                value={selectedRodFilterId}
                onChange={(event) => {
                  const nextRodId = event.target.value;
                  setSelectedRodFilterId(nextRodId);
                  setForm((prev) => ({ ...prev, druhId: '' }));
                }}
              >
                <option value="">-- nejdriv vyber rod --</option>
                {rody.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nazev}
                  </option>
                ))}
              </select>
            </div>
            <div className="add-picker-row">
              <select
                required
                value={form.druhId}
                disabled={!selectedRodFilterId}
                onChange={(event) => setForm((prev) => ({ ...prev, druhId: event.target.value }))}
              >
                <option value="">{selectedRodFilterId ? '-- vyber druh --' : '-- nejdriv vyber rod --'}</option>
                {filteredDruhy.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nazev}
                  </option>
                ))}
              </select>
              <button type="button" className="button secondary" onClick={() => setShowNewDruhForm(!showNewDruhForm)}>
                {showNewDruhForm ? 'Zrusit' : 'Novy druh'}
              </button>
            </div>
            {selectedDruh && (
              <div className="selected-druh-summary">
                <p className="selected-druh-summary-title">Vybrany druh</p>
                <p>
                  <strong>{selectedDruh.nazev}</strong>
                </p>
                <p>Rod: {selectedDruhRodNazev || '-'}</p>
                <p>Popis: {selectedDruh.popis || '-'}</p>
              </div>
            )}
            {showNewDruhForm && (
              <div className="add-inline-panel">
                <div className="add-inline-panel-title">Novy druh</div>
                <div className="inline-entity-flow">
                  <section className="inline-entity-step">
                    <p className="inline-entity-step-label">1. Rod (samostatna entita)</p>
                    <div className="inline-field-group">
                      <span>Vyber rod</span>
                      <div className="add-picker-row">
                        <select required value={newDruhRodId} onChange={(event) => setNewDruhRodId(event.target.value)}>
                          <option value="">-- vyber rod --</option>
                          {rody.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.nazev}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="button secondary" onClick={() => setShowNewDruhRodForm(!showNewDruhRodForm)}>
                          {showNewDruhRodForm ? 'Zrusit' : 'Novy rod'}
                        </button>
                      </div>
                    </div>
                    {showNewDruhRodForm && (
                      <div className="add-inline-panel nested">
                        <div className="add-inline-panel-title">Novy rod</div>
                        <input type="text" placeholder="Nazev noveho rodu..." value={newDruhRodNazev} onChange={(event) => setNewDruhRodNazev(event.target.value)} />
                        <textarea placeholder="Popis rodu (volitelne)..." value={newDruhRodPopis} onChange={(event) => setNewDruhRodPopis(event.target.value)} rows={2} />
                        <div className="form-actions">
                          <button type="button" className="button primary" onClick={createInlineDruhRod}>
                            Vytvorit rod
                          </button>
                        </div>
                        {newDruhRodMessage && <p className="info-text">{newDruhRodMessage}</p>}
                      </div>
                    )}
                  </section>

                  <section className="inline-entity-step">
                    <p className="inline-entity-step-label">2. Druh (vazba na rod)</p>
                    <input type="text" placeholder="Nazev noveho druhu..." value={newDruhNazev} onChange={(event) => setNewDruhNazev(event.target.value)} />
                    <textarea placeholder="Popis druhu (volitelne)..." value={newDruhPopis} onChange={(event) => setNewDruhPopis(event.target.value)} rows={2} />
                    <div className="form-actions">
                      <button type="button" className="button primary" onClick={createInlineDruh}>
                        Vytvorit druh
                      </button>
                    </div>
                    {newDruhMessage && <p className="info-text">{newDruhMessage}</p>}
                  </section>
                </div>
              </div>
            )}
          </div>
        </label>

        <label>
          Medium
          <div className="add-picker-block">
            <div className="add-picker-row">
              <select value={form.mediumId} onChange={(event) => setForm((prev) => ({ ...prev, mediumId: event.target.value }))}>
                <option value="">-- volitelne --</option>
                {media.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nazev}
                  </option>
                ))}
              </select>
              <button type="button" className="button secondary" onClick={() => setShowNewMediumForm(!showNewMediumForm)}>
                {showNewMediumForm ? 'Zrusit' : 'Nove medium'}
              </button>
            </div>
            {showNewMediumForm && (
              <div className="add-inline-panel">
                <div className="add-inline-panel-title">Nove medium</div>
                <input type="text" placeholder="Nazev noveho media..." value={newMediumNazev} onChange={(event) => setNewMediumNazev(event.target.value)} />
                <textarea placeholder="Popis media (volitelne)..." value={newMediumPopis} onChange={(event) => setNewMediumPopis(event.target.value)} rows={2} />
                <div className="form-actions">
                  <button type="button" className="button primary" onClick={createInlineMedium}>
                    Vytvorit medium
                  </button>
                </div>
                {newMediumMessage && <p className="info-text">{newMediumMessage}</p>}
              </div>
            )}
          </div>
        </label>

        <label>
          Umisteni
          <div className="add-picker-block">
            <div className="add-picker-row">
              <select value={form.umisteniId} onChange={(event) => setForm((prev) => ({ ...prev, umisteniId: event.target.value }))}>
                <option value="">-- volitelne --</option>
                {umisteni.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nazev}
                  </option>
                ))}
              </select>
              <button type="button" className="button secondary" onClick={() => setShowNewUmisteniForm(!showNewUmisteniForm)}>
                {showNewUmisteniForm ? 'Zrusit' : 'Nove umisteni'}
              </button>
            </div>
            {showNewUmisteniForm && (
              <div className="add-inline-panel">
                <div className="add-inline-panel-title">Nove umisteni</div>
                <input type="text" placeholder="Nazev noveho umisteni..." value={newUmisteniNazev} onChange={(event) => setNewUmisteniNazev(event.target.value)} />
                <div className="form-actions">
                  <button type="button" className="button primary" onClick={createInlineUmisteni}>
                    Vytvorit umisteni
                  </button>
                </div>
                {newUmisteniMessage && <p className="info-text">{newUmisteniMessage}</p>}
              </div>
            )}
          </div>
        </label>

        <label>
          Uvodni fotka
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              setInitialPhoto(event.target.files?.[0] || null);
              setInitialPhotoMessage(null);
            }}
          />
          {initialPhoto && <p className="info-text">Vybrany soubor: {initialPhoto.name}</p>}
          {initialPhotoMessage && <p className="info-text">{initialPhotoMessage}</p>}
        </label>

        <label>
          Aktualni zdravi (0-5)
          <input
            type="number"
            min={0}
            max={5}
            required
            value={form.aktualniZdravi}
            onChange={(event) => setForm((prev) => ({ ...prev, aktualniZdravi: event.target.value }))}
          />
        </label>

        <div className="form-actions">
          <button className="button primary" type="submit">
            Vytvorit kytku
          </button>
        </div>
        {message && <p>{message}</p>}
      </form>
    </section>
  );
}
