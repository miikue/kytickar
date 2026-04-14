import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { API_BASE_URL } from '../config';
import { uploadFile } from '../api/http';
import { createGalerieFotka, deleteGalerieFotka } from '../api/galerieFotkyApi';
import {
  fetchRostlinaGalerie,
  fetchRostlinaHistorie,
  fetchTypyAkci,
  createHistoriePece,
  deleteHistoriePece,
  fetchRostlinyNejdelsiOdZaliti,
  odlozitZaliti,
} from '../api/rostlinyDetailApi';
import { deleteRostlina, updateRostlina } from '../api/rostlinyApi';
import type { Druh, GalerieFotka, HistoriePece, Medium, Rostlina, RostlinaOdZaliti, TypAkce, Umisteni } from '../types/app';

type Props = {
  rostliny: Rostlina[];
  druhy: Druh[];
  media: Medium[];
  umisteni: Umisteni[];
  onReload: () => Promise<void>;
};

type PlantEditForm = {
  vlastniJmeno: string;
  druhId: string;
  mediumId: string;
  umisteniId: string;
  aktualniZdravi: string;
};

const EMPTY_EDIT_FORM: PlantEditForm = {
  vlastniJmeno: '',
  druhId: '',
  mediumId: '',
  umisteniId: '',
  aktualniZdravi: '5',
};

export default function KytkyPage({ rostliny, druhy, media, umisteni, onReload }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [galerie, setGalerie] = useState<GalerieFotka[]>([]);
  const [historie, setHistorie] = useState<HistoriePece[]>([]);
  const [typyAkci, setTypyAkci] = useState<TypAkce[]>([]);
  const [selectedTypAkceId, setSelectedTypAkceId] = useState('');
  const [novaAkceMessage, setNovaAkceMessage] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<PlantEditForm>(EMPTY_EDIT_FORM);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPoznamka, setNewPhotoPoznamka] = useState('');
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<GalerieFotka | null>(null);
  const [nejdelsiOdZaliti, setNejdelsiOdZaliti] = useState<RostlinaOdZaliti[]>([]);
  const [zalitiSummaryError, setZalitiSummaryError] = useState<string | null>(null);
  const [zalitiSummaryMessage, setZalitiSummaryMessage] = useState<string | null>(null);
  const [shouldScrollToDetail, setShouldScrollToDetail] = useState(false);
  const detailCardRef = useRef<HTMLElement | null>(null);

  const selectedRostlina = useMemo(
    () => rostliny.find((item) => item.id === selectedId) || null,
    [rostliny, selectedId],
  );

  function isWateringActionName(name: string) {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes('zal');
  }

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      if (!selectedId) {
        setGalerie([]);
        setHistorie([]);
        setTypyAkci([]);
        setSelectedTypAkceId('');
        setDetailError(null);
        setDetailLoading(false);
        return;
      }

      try {
        setDetailLoading(true);
        const [galerieData, historieData, typyData] = await Promise.all([
          fetchRostlinaGalerie(selectedId),
          fetchRostlinaHistorie(selectedId),
          fetchTypyAkci(),
        ]);

        const sortedTypy = [...typyData].sort((a, b) => {
          const aIsWatering = isWateringActionName(a.typAkce);
          const bIsWatering = isWateringActionName(b.typAkce);

          if (aIsWatering && !bIsWatering) {
            return -1;
          }

          if (!aIsWatering && bIsWatering) {
            return 1;
          }

          return a.typAkce.localeCompare(b.typAkce, 'cs-CZ');
        });

        const defaultActionId = String(sortedTypy.find((item) => isWateringActionName(item.typAkce))?.id || sortedTypy[0]?.id || '');

        if (active) {
          setGalerie(galerieData);
          setHistorie(historieData);
          setTypyAkci(sortedTypy);
          setDetailError(null);
          setSelectedTypAkceId((prev) => {
            if (!prev) {
              return defaultActionId;
            }

            return sortedTypy.some((item) => String(item.id) === prev) ? prev : defaultActionId;
          });
        }
      } catch (error) {
        if (active) {
          setDetailError(error instanceof Error ? error.message : 'Nepodarilo se nacist detail rostliny.');
        }
      } finally {
        if (active) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedRostlina) {
      setIsEditing(false);
      return;
    }

    const hasSelectedStillExists = rostliny.some((item) => item.id === selectedRostlina.id);
    if (!hasSelectedStillExists) {
      setSelectedId(null);
      setIsEditing(false);
    }
  }, [rostliny, selectedRostlina]);

  useEffect(() => {
    if (!selectedRostlina) {
      setIsEditing(false);
      setEditForm(EMPTY_EDIT_FORM);
      return;
    }

    setEditForm({
      vlastniJmeno: selectedRostlina.vlastniJmeno,
      druhId: String(selectedRostlina.druh?.id || ''),
      mediumId: String(selectedRostlina.medium?.id || ''),
      umisteniId: String(selectedRostlina.umisteni?.id || ''),
      aktualniZdravi: String(selectedRostlina.aktualniZdravi),
    });
  }, [selectedRostlina]);

  async function loadZalitiSummary() {
    try {
      const data = await fetchRostlinyNejdelsiOdZaliti();
      setNejdelsiOdZaliti(data);
      setZalitiSummaryError(null);
    } catch (error) {
      setZalitiSummaryError(error instanceof Error ? error.message : 'Nepodarilo se nacist prehled zalevani.');
    }
  }

  useEffect(() => {
    loadZalitiSummary();
  }, [rostliny]);

  async function postponeWateringForPlant(rostlinaId: number, vlastniJmeno: string) {
    try {
      await odlozitZaliti(rostlinaId, 2);
      setZalitiSummaryMessage(`${vlastniJmeno} je odlozeno o 2 dny.`);
      await loadZalitiSummary();
    } catch (error) {
      setZalitiSummaryMessage(error instanceof Error ? error.message : 'Odlozeni zalevani selhalo.');
    }
  }

  useEffect(() => {
    if (!shouldScrollToDetail || !selectedId || !detailCardRef.current) {
      return;
    }

    if (window.matchMedia('(max-width: 900px)').matches) {
      detailCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setShouldScrollToDetail(false);
  }, [shouldScrollToDetail, selectedId]);

  const latestPhoto = galerie[0] || selectedRostlina?.galerieFotky?.[0] || null;

  function openPlantDetail(itemId: number) {
    setSelectedId(itemId);
    setShouldScrollToDetail(true);
    setIsEditing(false);
    setNovaAkceMessage(null);
    setEditMessage(null);
    setDetailError(null);
  }

  function goBackToList() {
    setSelectedId(null);
    setIsEditing(false);
    setNovaAkceMessage(null);
    setEditMessage(null);
    setPhotoMessage(null);
    setExpandedPhoto(null);
  }

  function startEditing() {
    if (!selectedRostlina) {
      return;
    }

    setEditMessage(null);
    setIsEditing(true);
  }

  async function removeRostlina() {
    if (!selectedRostlina) {
      return;
    }

    const confirmed = window.confirm(`Opravdu smazat kytku ${selectedRostlina.vlastniJmeno}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteRostlina(selectedRostlina.id);
      setSelectedId(null);
      setIsEditing(false);
      setEditMessage(null);
      setNovaAkceMessage(null);
      setPhotoMessage(null);
      setDetailError(null);
      await onReload();
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : 'Nepodarilo se smazat kytku.');
    }
  }

  function cancelEditing() {
    if (!selectedRostlina) {
      return;
    }

    setEditForm({
      vlastniJmeno: selectedRostlina.vlastniJmeno,
      druhId: String(selectedRostlina.druh?.id || ''),
      mediumId: String(selectedRostlina.medium?.id || ''),
      umisteniId: String(selectedRostlina.umisteni?.id || ''),
      aktualniZdravi: String(selectedRostlina.aktualniZdravi),
    });
    setEditMessage(null);
    setIsEditing(false);
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();

    if (!selectedId) {
      setEditMessage('Vyber rostlinu pro upravu.');
      return;
    }

    if (!editForm.vlastniJmeno.trim() || !editForm.druhId) {
      setEditMessage('Jmeno a druh jsou povinne.');
      return;
    }

    try {
      await updateRostlina(selectedId, editForm);
      setEditMessage('Zaznam ulozen.');
      setIsEditing(false);
      await onReload();
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : 'Nepodarilo se ulozit zmeny.');
    }
  }

  async function submitNovaAkce(event: FormEvent) {
    event.preventDefault();

    if (!selectedId || !selectedTypAkceId) {
      setNovaAkceMessage('Vyber rostlinu i typ akce.');
      return;
    }

    try {
      await createHistoriePece({ rostlinaId: selectedId, typAkceId: Number(selectedTypAkceId) });
      setNovaAkceMessage('Akce ulozena.');
      const historieData = await fetchRostlinaHistorie(selectedId);
      setHistorie(historieData);
    } catch (error) {
      setNovaAkceMessage(error instanceof Error ? error.message : 'Nepodarilo se ulozit akci.');
    }
  }

  async function submitNovaFotka(event: FormEvent) {
    event.preventDefault();

    if (!selectedId) {
      setPhotoMessage('Vyber rostlinu.');
      return;
    }

    if (!newPhoto) {
      setPhotoMessage('Vyber soubor fotky.');
      return;
    }

    try {
      const fileName = await uploadFile(newPhoto);
      await createGalerieFotka({
        rostlinaId: selectedId,
        fotkaName: fileName,
        poznamka: newPhotoPoznamka.trim() || null,
      });

      const galerieData = await fetchRostlinaGalerie(selectedId);
      setGalerie(galerieData);
      setPhotoMessage('Fotka ulozena.');
      setNewPhoto(null);
      setNewPhotoPoznamka('');
      await onReload();
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : 'Nepodarilo se ulozit fotku.');
    }
  }

  async function removeHistorieItem(id: number) {
    if (!selectedId) {
      return;
    }

    try {
      await deleteHistoriePece(id);
      const historieData = await fetchRostlinaHistorie(selectedId);
      setHistorie(historieData);
      setNovaAkceMessage('Akce smazana.');
    } catch (error) {
      setNovaAkceMessage(error instanceof Error ? error.message : 'Nepodarilo se smazat akci.');
    }
  }

  async function removeExpandedPhoto() {
    if (!selectedId || !expandedPhoto) {
      return;
    }

    try {
      await deleteGalerieFotka(expandedPhoto.id);
      const galerieData = await fetchRostlinaGalerie(selectedId);
      setGalerie(galerieData);
      setExpandedPhoto(null);
      setPhotoMessage('Fotka smazana.');
      await onReload();
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : 'Nepodarilo se smazat fotku.');
    }
  }

  return (
    <section className="plants-layout">
      <article className="table-card plants-list-card">
        <section className="watering-priority-box">
          <h3>Nejdelsi cas od posledniho zaliti</h3>
          {zalitiSummaryError && <p className="error-text">{zalitiSummaryError}</p>}
          {zalitiSummaryMessage && <p className="info-text">{zalitiSummaryMessage}</p>}
          {!zalitiSummaryError && nejdelsiOdZaliti.length === 0 && <p>Aktivne kytky k porovnani zatim chybi.</p>}
          {!zalitiSummaryError && nejdelsiOdZaliti.length > 0 && (
            <ul className="watering-priority-list">
              {nejdelsiOdZaliti.slice(0, 5).map((item) => {
                const overviewPlant = rostliny.find((rostlina) => rostlina.id === item.id) || null;
                const thumb = overviewPlant?.galerieFotky?.[0] || null;

                return (
                  <li key={item.id} className="watering-priority-item">
                    <button type="button" className="watering-priority-card" onClick={() => openPlantDetail(item.id)}>
                      <div className="watering-priority-image-wrap">
                        {thumb ? (
                          <img src={`${API_BASE_URL}/api/files/${thumb.fotkaName}`} alt={item.vlastniJmeno} className="watering-priority-image" />
                        ) : (
                          <div className="watering-priority-image-empty">Bez fotky</div>
                        )}
                      </div>
                      <div className="watering-priority-content">
                        <strong>{item.vlastniJmeno}</strong>
                        <span>{item.druh?.nazev || '-'}</span>
                        <span>
                          {item.dnyOdPoslednihoZaliti === null
                            ? 'Zatim bez zaznamu zaliti'
                            : `${item.dnyOdPoslednihoZaliti} dnu od zaliti`}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="icon-button postpone-icon-button"
                      onClick={() => postponeWateringForPlant(item.id, item.vlastniJmeno)}
                      title="Odlozit zalevani o 2 dny"
                      aria-label="Odlozit zalevani o 2 dny"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm1 10.59 2.7 2.7-1.4 1.41L11 13.41V7h2Zm7-1.59h-2a6 6 0 1 0-1.76 4.24l1.42 1.42A8 8 0 1 1 20 11Zm-6 9h-2v-2h2Zm-3-3h-2v-2h2Zm6 0h-2v-2h2Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <h2>Rostliny</h2>
        {rostliny.length === 0 && <p>Zatim tu nejsou zadne kytky.</p>}
        <div className="plant-thumb-grid">
          {rostliny.map((item) => {
            const thumb = item.galerieFotky?.[0];
            const isSelected = item.id === selectedId;

            return (
              <button
                key={item.id}
                type="button"
                className={`plant-thumb-card ${isSelected ? 'active' : ''}`}
                onClick={() => openPlantDetail(item.id)}
              >
                <div className="plant-thumb-image-wrap">
                  {thumb ? (
                    <img src={`${API_BASE_URL}/api/files/${thumb.fotkaName}`} alt={item.vlastniJmeno} className="plant-thumb-image" />
                  ) : (
                    <div className="plant-thumb-placeholder">Bez fotky</div>
                  )}
                </div>
                <div className="plant-thumb-content">
                  <strong>{item.vlastniJmeno}</strong>
                  <span>{item.druh?.nazev || '-'}</span>
                  <span className="plant-thumb-rod">Rod: {item.druh?.rod?.nazev || '-'}</span>
                  <span className="plant-thumb-health">Zdravi {item.aktualniZdravi}/5</span>
                </div>
              </button>
            );
          })}
        </div>
      </article>

      <article ref={detailCardRef} className="table-card plant-detail-card">
        {selectedRostlina ? (
          <>
            <div className="plant-detail-toolbar form-actions">
              <button type="button" className="button secondary" onClick={goBackToList}>
                Zpet
              </button>
              {!isEditing ? (
                <>
                  <button type="button" className="button primary" onClick={startEditing}>
                    Editovat
                  </button>
                  <button type="button" className="button secondary" onClick={removeRostlina}>
                    Smazat
                  </button>
                </>
              ) : (
                <button type="button" className="button secondary" onClick={cancelEditing}>
                  Zrusit editaci
                </button>
              )}
            </div>

            {isEditing ? (
              <section className="plant-action-box">
                <h3>Editace zaznamu</h3>
                <form className="stack-form" onSubmit={submitEdit}>
                  <label>
                    Vlastni jmeno
                    <input required value={editForm.vlastniJmeno} onChange={(event) => setEditForm((prev) => ({ ...prev, vlastniJmeno: event.target.value }))} />
                  </label>
                  <label>
                    Druh
                    <select required value={editForm.druhId} onChange={(event) => setEditForm((prev) => ({ ...prev, druhId: event.target.value }))}>
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
                    <select value={editForm.mediumId} onChange={(event) => setEditForm((prev) => ({ ...prev, mediumId: event.target.value }))}>
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
                    <select value={editForm.umisteniId} onChange={(event) => setEditForm((prev) => ({ ...prev, umisteniId: event.target.value }))}>
                      <option value="">-- volitelne --</option>
                      {umisteni.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Aktualni zdravi (0-5)
                    <input
                      type="number"
                      min={0}
                      max={5}
                      required
                      value={editForm.aktualniZdravi}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, aktualniZdravi: event.target.value }))}
                    />
                  </label>
                  <div className="form-actions">
                    <button className="button primary" type="submit">
                      Ulozit zmeny
                    </button>
                  </div>
                  {editMessage && <p className="info-text">{editMessage}</p>}
                </form>
              </section>
            ) : (
              <>
                <div className="plant-detail-hero">
                  <div className="plant-detail-photo-shell">
                    {latestPhoto ? (
                      <button type="button" className="photo-open-button" onClick={() => setExpandedPhoto(latestPhoto)}>
                        <img src={`${API_BASE_URL}/api/files/${latestPhoto.fotkaName}`} alt={selectedRostlina.vlastniJmeno} className="plant-detail-photo" />
                      </button>
                    ) : (
                      <div className="plant-detail-photo-empty">Bez fotky</div>
                    )}
                  </div>
                  <div className="plant-detail-info">
                    <p className="eyebrow">Detail rostliny</p>
                    <h2>{selectedRostlina.vlastniJmeno}</h2>
                    <p>
                      Druh: <strong>{selectedRostlina.druh?.nazev || '-'}</strong>
                    </p>
                    <p>
                      Rod: <strong>{selectedRostlina.druh?.rod?.nazev || '-'}</strong>
                    </p>
                    <p>
                      Medium: <strong>{selectedRostlina.medium?.nazev || '-'}</strong>
                    </p>
                    <p>
                      Umisteni: <strong>{selectedRostlina.umisteni?.nazev || '-'}</strong>
                    </p>
                    <p>
                      Zdravi: <strong>{selectedRostlina.aktualniZdravi}/5</strong>
                    </p>
                    <p>
                      Porizeno: <strong>{new Date(selectedRostlina.datumPorizeni).toLocaleDateString('cs-CZ')}</strong>
                    </p>
                  </div>
                </div>

                <section className="plant-action-box">
                  <h3>Nova akce</h3>
                  <form className="stack-form" onSubmit={submitNovaAkce}>
                    <label>
                      Typ akce
                      <select value={selectedTypAkceId} onChange={(event) => setSelectedTypAkceId(event.target.value)}>
                        <option value="">-- vyber typ --</option>
                        {typyAkci.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.typAkce}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-actions">
                      <button className="button primary" type="submit">
                        Ulozit akci
                      </button>
                    </div>
                    {novaAkceMessage && <p className="info-text">{novaAkceMessage}</p>}
                  </form>
                </section>

                <section className="plant-scroll-section">
                  <h3>Historie fotek</h3>
                  <form className="stack-form plant-photo-upload" onSubmit={submitNovaFotka}>
                    <label>
                      Pridat fotku
                      <input type="file" accept="image/*" onChange={(event) => setNewPhoto(event.target.files?.[0] || null)} />
                    </label>
                    <label>
                      Poznamka (volitelne)
                      <input
                        value={newPhotoPoznamka}
                        onChange={(event) => setNewPhotoPoznamka(event.target.value)}
                        placeholder="napr. po zaliti"
                      />
                    </label>
                    <div className="form-actions">
                      <button className="button primary" type="submit">
                        Pridat fotku
                      </button>
                    </div>
                    {photoMessage && <p className="info-text">{photoMessage}</p>}
                  </form>
                  {detailLoading && <p>Nacitam detail...</p>}
                  {detailError && <p className="error-text">{detailError}</p>}
                  {!detailLoading && galerie.length === 0 && <p>Zatim bez fotek.</p>}
                  {galerie.length > 0 && (
                    <div className="plant-gallery-strip">
                      {galerie.map((item) => (
                        <figure key={item.id} className="plant-gallery-item">
                          <button type="button" className="photo-open-button" onClick={() => setExpandedPhoto(item)}>
                            <img src={`${API_BASE_URL}/api/files/${item.fotkaName}`} alt={item.poznamka || 'Fotka rostliny'} />
                          </button>
                          <figcaption>{new Date(item.datumPorizeni).toLocaleDateString('cs-CZ')}</figcaption>
                        </figure>
                      ))}
                    </div>
                  )}
                </section>

                <section className="plant-scroll-section">
                  <h3>Historie akci</h3>
                  {!detailLoading && historie.length === 0 && <p>Zatim bez akci.</p>}
                  {historie.length > 0 && (
                    <ul className="plant-history-list">
                      {historie.map((item) => (
                        <li key={item.id} className="plant-history-item">
                          <span>
                            {new Date(item.datum).toLocaleString('cs-CZ')} - {item.typAkce.typAkce}
                          </span>
                          <button
                            type="button"
                            className="icon-button danger"
                            onClick={() => removeHistorieItem(item.id)}
                            title="Smazat akci"
                            aria-label="Smazat akci"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z" fill="currentColor" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </>
        ) : (
          <p>Vyber rostlinu.</p>
        )}
      </article>

      {expandedPhoto && (
        <div className="photo-modal" role="dialog" aria-modal="true">
          <button type="button" className="photo-modal-backdrop" onClick={() => setExpandedPhoto(null)} aria-label="Zavrit detail fotky" />
          <div className="photo-modal-panel">
            <img src={`${API_BASE_URL}/api/files/${expandedPhoto.fotkaName}`} alt={expandedPhoto.poznamka || 'Zvetsena fotka'} className="photo-modal-image" />
            <div className="photo-modal-meta">
              <p>Datum porizeni: {new Date(expandedPhoto.datumPorizeni).toLocaleDateString('cs-CZ')}</p>
              {expandedPhoto.poznamka && <p>Poznamka: {expandedPhoto.poznamka}</p>}
            </div>
            <div className="photo-modal-actions form-actions">
              <button
                type="button"
                className="icon-button modal-icon-button danger"
                onClick={removeExpandedPhoto}
                title="Smazat fotku"
                aria-label="Smazat fotku"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z" fill="currentColor" />
                </svg>
              </button>
              <a
                className="icon-button modal-icon-button"
                href={`${API_BASE_URL}/api/files/${expandedPhoto.fotkaName}`}
                download={expandedPhoto.fotkaName}
                target="_blank"
                rel="noreferrer"
                title="Stahnout fotku"
                aria-label="Stahnout fotku"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3Zm-7 14h14v3H5Z" fill="currentColor" />
                </svg>
              </a>
              <button type="button" className="button secondary" onClick={() => setExpandedPhoto(null)}>
                Zavrit
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
