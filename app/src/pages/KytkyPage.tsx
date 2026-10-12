import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { uploadFile, getFileUrl } from '../api/http';
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
import { logActivity } from '../api/activityApi';
import { deleteRostlina, updateRostlina } from '../api/rostlinyApi';
import type { Druh, GalerieFotka, HistoriePece, Medium, Rostlina, RostlinaOdZaliti, TypAkce, Umisteni } from '../types/app';

type Props = {
  rostliny: Rostlina[];
  druhy: Druh[];
  media: Medium[];
  umisteni: Umisteni[];
  onReload: () => Promise<void>;
  onDetailOpenChange?: (open: boolean) => void;
  resetTrigger?: number;
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

export default function KytkyPage({
  rostliny,
  druhy,
  media,
  umisteni,
  onReload,
  onDetailOpenChange,
  resetTrigger,
}: Props) {
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
  const [activeStoryPlant, setActiveStoryPlant] = useState<RostlinaOdZaliti | null>(null);
  const [storyActionFeedback, setStoryActionFeedback] = useState<string | null>(null);
  const [storyActionLoading, setStoryActionLoading] = useState(false);
  const [showAddPhotoForm, setShowAddPhotoForm] = useState(false);
  const [shouldScrollToDetail, setShouldScrollToDetail] = useState(false);
  const detailCardRef = useRef<HTMLElement | null>(null);

  const selectedRostlina = useMemo(
    () => rostliny.find((item) => item.id === selectedId) || null,
    [rostliny, selectedId],
  );

  useEffect(() => {
    onDetailOpenChange?.(Boolean(selectedRostlina || activeStoryPlant));
  }, [selectedRostlina, activeStoryPlant, onDetailOpenChange]);

  useEffect(() => {
    if (resetTrigger) {
      setSelectedId(null);
      setIsEditing(false);
      setActiveStoryPlant(null);
      setExpandedPhoto(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [resetTrigger]);

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
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadZalitiSummary();
  }, [rostliny]);

  async function handleQuickWater(rostlinaId: number, vlastniJmeno: string) {
    if (storyActionLoading) return;
    setStoryActionLoading(true);
    setStoryActionFeedback(null);
    try {
      let targetTypeId: number | null = null;
      try {
        const types = await fetchTypyAkci();
        const waterType = types.find((t) => isWateringActionName(t.typAkce)) || types[0];
        if (waterType) targetTypeId = waterType.id;
      } catch {
        targetTypeId = 1;
      }

      await createHistoriePece({ rostlinaId, typAkceId: targetTypeId || 1 });
      void logActivity({
        eventType: 'create',
        section: 'historie_pece',
        label: `Zaliti: ${vlastniJmeno}`,
        entityId: rostlinaId,
      }).catch(() => undefined);

      setStoryActionFeedback(`💧 ${vlastniJmeno} zalita!`);

      // Determine next plant in the queue before updating summary
      const currentIndex = nejdelsiOdZaliti.findIndex((item) => item.id === rostlinaId);
      const remaining = nejdelsiOdZaliti.filter((item) => item.id !== rostlinaId);
      const nextPlant = remaining.length > 0 ? remaining[currentIndex < remaining.length ? currentIndex : 0] : null;

      await loadZalitiSummary();
      await onReload();

      if (nextPlant) {
        setTimeout(() => {
          setActiveStoryPlant(nextPlant);
          setStoryActionFeedback(null);
          setStoryActionLoading(false);
        }, 500);
      } else {
        setStoryActionFeedback('🎉 Všechny kytičky jsou zaopatřené!');
        setTimeout(() => {
          setActiveStoryPlant(null);
          setStoryActionFeedback(null);
          setStoryActionLoading(false);
        }, 1200);
      }
    } catch (err: any) {
      setStoryActionFeedback(err?.message || 'Chyba při zálivce.');
      setStoryActionLoading(false);
    }
  }

  async function handleQuickPostpone(rostlinaId: number, vlastniJmeno: string) {
    if (storyActionLoading) return;
    setStoryActionLoading(true);
    setStoryActionFeedback(null);
    try {
      const waterType = typyAkci.find((t) => isWateringActionName(t.typAkce));
      const snoozeDays = waterType?.odlozitDny || 2;
      await odlozitZaliti(rostlinaId, snoozeDays);
      void logActivity({
        eventType: 'postpone',
        section: 'kytky',
        label: `Odloženo zalití: ${vlastniJmeno} (+${snoozeDays} d)`,
        entityId: rostlinaId,
      }).catch(() => undefined);

      setStoryActionFeedback(
        `⏳ Zálivka pro ${vlastniJmeno} odložena o ${snoozeDays} ${
          snoozeDays === 1 ? 'den' : snoozeDays < 5 ? 'dny' : 'dní'
        }.`
      );

      const currentIndex = nejdelsiOdZaliti.findIndex((item) => item.id === rostlinaId);
      const remaining = nejdelsiOdZaliti.filter((item) => item.id !== rostlinaId);
      const nextPlant = remaining.length > 0 ? remaining[currentIndex < remaining.length ? currentIndex : 0] : null;

      await loadZalitiSummary();
      await onReload();

      if (nextPlant) {
        setTimeout(() => {
          setActiveStoryPlant(nextPlant);
          setStoryActionFeedback(null);
          setStoryActionLoading(false);
        }, 500);
      } else {
        setStoryActionFeedback('🎉 Všechny kytičky jsou zaopatřené!');
        setTimeout(() => {
          setActiveStoryPlant(null);
          setStoryActionFeedback(null);
          setStoryActionLoading(false);
        }, 1200);
      }
    } catch (err: any) {
      setStoryActionFeedback(err?.message || 'Chyba při odložení.');
      setStoryActionLoading(false);
    }
  }

  useEffect(() => {
    if (!shouldScrollToDetail || !selectedId) {
      return;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
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

    const openedPlant = rostliny.find((item) => item.id === itemId);
    void logActivity({
      eventType: 'open_detail',
      section: 'kytky',
      label: openedPlant?.vlastniJmeno || 'Rostlina',
      entityId: itemId,
    }).catch(() => undefined);
  }

  function goBackToList() {
    setSelectedId(null);
    setIsEditing(false);
    setNovaAkceMessage(null);
    setEditMessage(null);
    setPhotoMessage(null);
    setExpandedPhoto(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
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
      void logActivity({
        eventType: 'delete',
        section: 'kytky',
        label: selectedRostlina.vlastniJmeno,
        entityId: selectedRostlina.id,
      }).catch(() => undefined);
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
      void logActivity({
        eventType: 'update',
        section: 'kytky',
        label: editForm.vlastniJmeno,
        entityId: selectedId,
      }).catch(() => undefined);
      await onReload();
    } catch (error) {
      setEditMessage(error instanceof Error ? error.message : 'Nepodarilo se ulozit zmeny.');
    }
  }

  async function submitNovaAkce(event: FormEvent) {
    event.preventDefault();

    if (!selectedId || !selectedTypAkceId) {
      setNovaAkceMessage('Vyberte prosím akci.');
      return;
    }

    try {
      await createHistoriePece({ rostlinaId: selectedId, typAkceId: Number(selectedTypAkceId) });
      const actionObj = typyAkci.find((t) => String(t.id) === selectedTypAkceId);
      const actionName = actionObj?.typAkce || 'Akce';
      const actionIcon = actionObj?.ikona || (actionObj && isWateringActionName(actionObj.typAkce) ? '💧' : '✨');
      setNovaAkceMessage(`${actionIcon} ${actionName} úspěšně zaznamenána!`);
      void logActivity({
        eventType: 'create',
        section: 'historie_pece',
        label: `${actionName}: ${selectedRostlina?.vlastniJmeno || 'Rostlina'}`,
        entityId: selectedId,
      }).catch(() => undefined);
      const historieData = await fetchRostlinaHistorie(selectedId);
      setHistorie(historieData);
      await loadZalitiSummary();
      await onReload();
    } catch (error) {
      setNovaAkceMessage(error instanceof Error ? error.message : 'Nepodařilo se uložit akci.');
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

      void logActivity({
        eventType: 'create',
        section: 'galerie_fotky',
        label: selectedRostlina?.vlastniJmeno || 'Rostlina',
        entityId: selectedId,
        details: newPhotoPoznamka.trim() || null,
      }).catch(() => undefined);

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
      void logActivity({
        eventType: 'delete',
        section: 'historie_pece',
        label: selectedRostlina?.vlastniJmeno || 'Rostlina',
        entityId: id,
      }).catch(() => undefined);
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
    <section className={`plants-layout ${selectedRostlina ? 'detail-open' : 'list-open'}`}>
      <article className="plants-list-container">
        {/* STORIES / REELS: Kytky co potřebují pozornost */}
        {nejdelsiOdZaliti.length > 0 ? (
          <section className="plant-stories-section">
            <div className="section-title-row">
              <span className="section-title-label">⚡ Potřebují péči</span>
              <span className="section-title-count">{nejdelsiOdZaliti.length}</span>
            </div>

            <div className="plant-stories-scroll">
              {nejdelsiOdZaliti.map((item) => {
                const overviewPlant = rostliny.find((rostlina) => rostlina.id === item.id) || null;
                const thumb = overviewPlant?.galerieFotky?.[0] || null;
                const waterType = typyAkci.find((t) => isWateringActionName(t.typAkce));
                const urgentThreshold = waterType?.intervalDny || 4;
                const isUrgent = item.dnyOdPoslednihoZaliti === null || item.dnyOdPoslednihoZaliti >= urgentThreshold;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`story-circle-item ${isUrgent ? 'story-urgent' : ''}`}
                    onClick={() => {
                      setStoryActionFeedback(null);
                      setActiveStoryPlant(item);
                    }}
                    title={`${item.vlastniJmeno} - klikněte pro rychlé akce`}
                  >
                    <div className="story-ring">
                      <div className="story-avatar-wrap">
                        {thumb ? (
                          <img src={getFileUrl(thumb.fotkaName)} alt={item.vlastniJmeno} className="story-avatar-img" />
                        ) : (
                          <span className="story-avatar-emoji">🌱</span>
                        )}
                      </div>
                      <span className="story-badge">💧</span>
                    </div>
                    <span className="story-name">{item.vlastniJmeno}</span>
                    <span className="story-days">
                      {item.dnyOdPoslednihoZaliti === null ? 'Nezalito' : `${item.dnyOdPoslednihoZaliti} d`}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="plant-stories-section">
            <div className="all-watered-banner">
              <div className="all-watered-icon-wrap">
                <span className="all-watered-icon">🌿</span>
              </div>
              <div className="all-watered-content">
                <strong>Všechny kytičky mají péči!</strong>
                <span>Žádná rostlina momentálně nepotřebuje zálivku.</span>
              </div>
              <span className="all-watered-check">✅</span>
            </div>
          </section>
        )}

        {/* HLAVNÍ SEZNAM ROSTLIN */}
        <div className="plants-section-header">
          <h2 className="plants-section-title">Moje kytičky</h2>
          <span className="plants-count-pill">{rostliny.length}</span>
        </div>

        {rostliny.length === 0 ? (
          <div className="plants-empty-state">
            <span className="empty-icon">🪴</span>
            <p>Zatím tu nemáte žádné kytičky.</p>
          </div>
        ) : (
          <div className="mobile-plants-grid">
            {rostliny.map((item) => {
              const thumb = item.galerieFotky?.[0];
              const isSelected = item.id === selectedId;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`mobile-plant-card ${isSelected ? 'active' : ''}`}
                  onClick={() => openPlantDetail(item.id)}
                >
                  <div className="mobile-plant-card-media">
                    {thumb ? (
                      <img src={getFileUrl(thumb.fotkaName)} alt={item.vlastniJmeno} className="mobile-plant-card-img" />
                    ) : (
                      <div className="mobile-plant-card-empty">🌿</div>
                    )}
                    <span className="mobile-plant-health-badge">💚 {item.aktualniZdravi}/5</span>
                  </div>
                  <div className="mobile-plant-card-body">
                    <strong className="mobile-plant-card-title">{item.vlastniJmeno}</strong>
                    <span className="mobile-plant-card-species">{item.druh?.nazev || '-'}</span>
                    {item.umisteni && (
                      <span className="mobile-plant-card-location">📍 {item.umisteni.nazev}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </article>

      <article ref={detailCardRef} className="plant-detail-container">
        {selectedRostlina ? (
          <>
            {/* STICKY TOP BAR BELOW CAMERA NOTCH */}
            <div className="detail-mobile-top-bar">
              <button type="button" className="detail-back-button" onClick={goBackToList}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                <span>Zpět na seznam</span>
              </button>

              <div className="detail-top-actions">
                {!isEditing ? (
                  <>
                    <button type="button" className="detail-action-icon-btn" onClick={startEditing} title="Upravit rostlinu" aria-label="Upravit">
                      ✏️
                    </button>
                    <button type="button" className="detail-action-icon-btn danger" onClick={removeRostlina} title="Smazat rostlinu" aria-label="Smazat">
                      🗑️
                    </button>
                  </>
                ) : (
                  <button type="button" className="detail-action-cancel-btn" onClick={cancelEditing}>
                    Zrušit
                  </button>
                )}
              </div>
            </div>

            {detailLoading && (
              <div style={{ textAlign: 'center', padding: '10px', color: '#688975', fontSize: '0.88rem' }}>
                Načítám detaily...
              </div>
            )}
            {detailError && (
              <div style={{ background: '#ffebee', color: '#c62828', padding: '10px 14px', borderRadius: '12px', margin: '8px 16px', fontSize: '0.85rem' }}>
                {detailError}
              </div>
            )}

            {isEditing ? (
              <section className="detail-section-card edit-card">
                <h3 className="section-card-title">Editace rostliny</h3>
                <form className="stack-form" onSubmit={submitEdit}>
                  <label>
                    Vlastní jméno
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
                    Substrát / Médium
                    <select value={editForm.mediumId} onChange={(event) => setEditForm((prev) => ({ ...prev, mediumId: event.target.value }))}>
                      <option value="">-- volitelné --</option>
                      {media.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Umístění
                    <select value={editForm.umisteniId} onChange={(event) => setEditForm((prev) => ({ ...prev, umisteniId: event.target.value }))}>
                      <option value="">-- volitelné --</option>
                      {umisteni.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nazev}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Aktuální zdraví (0-5)
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
                    <button className="action-button primary" type="submit">
                      Uložit změny
                    </button>
                  </div>
                  {editMessage && <p className="detail-feedback-msg">{editMessage}</p>}
                </form>
              </section>
            ) : (
              <div className="detail-content-scroll">
                {/* HERO CARD S VELKOU FOTKOU A NÁZVEM */}
                <div className="plant-detail-hero-card">
                  <div className="hero-photo-wrapper">
                    {latestPhoto ? (
                      <button type="button" className="hero-photo-btn" onClick={() => setExpandedPhoto(latestPhoto)}>
                        <img src={getFileUrl(latestPhoto.fotkaName)} alt={selectedRostlina.vlastniJmeno} className="hero-photo-img" />
                      </button>
                    ) : (
                      <div className="hero-photo-empty">🌿</div>
                    )}
                    <div className="hero-health-pill">💚 Zdraví {selectedRostlina.aktualniZdravi}/5</div>
                    <div className="hero-gradient-overlay">
                      <h1 className="hero-plant-name">{selectedRostlina.vlastniJmeno}</h1>
                      <p className="hero-plant-species">
                        {selectedRostlina.druh?.nazev || 'Neznámý druh'}
                        {selectedRostlina.druh?.rod?.nazev ? ` • ${selectedRostlina.druh.rod.nazev}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* METADATA CHIPS 2x2 GRID */}
                <div className="plant-detail-chips-grid">
                  <div className="detail-chip-card">
                    <span className="chip-icon">🪴</span>
                    <div className="chip-info">
                      <span className="chip-label">Substrát</span>
                      <strong className="chip-value">{selectedRostlina.medium?.nazev || 'Neuvedeno'}</strong>
                    </div>
                  </div>
                  <div className="detail-chip-card">
                    <span className="chip-icon">📍</span>
                    <div className="chip-info">
                      <span className="chip-label">Umístění</span>
                      <strong className="chip-value">{selectedRostlina.umisteni?.nazev || 'Neuvedeno'}</strong>
                    </div>
                  </div>
                  <div className="detail-chip-card">
                    <span className="chip-icon">📅</span>
                    <div className="chip-info">
                      <span className="chip-label">Pořízeno</span>
                      <strong className="chip-value">{new Date(selectedRostlina.datumPorizeni).toLocaleDateString('cs-CZ')}</strong>
                    </div>
                  </div>
                  <div className="detail-chip-card">
                    <span className="chip-icon">🏷️</span>
                    <div className="chip-info">
                      <span className="chip-label">Rod</span>
                      <strong className="chip-value">{selectedRostlina.druh?.rod?.nazev || 'Neuvedeno'}</strong>
                    </div>
                  </div>
                </div>

                {/* KARTA PÉČE: JEDINÝ DROPDOWN A TLAČÍTKO PROVÉST */}
                <div className="detail-section-card care-action-card">
                  <div className="section-card-header">
                    <span className="section-card-icon">⚡</span>
                    <div>
                      <h3 className="section-card-title">Zaznamenat péči</h3>
                      <p className="section-card-desc">Vyberte akci a potvrďte provedení</p>
                    </div>
                  </div>

                  <form className="detail-care-unified-form" onSubmit={submitNovaAkce}>
                    <div className="care-row-unified">
                      <select
                        className="care-select-unified"
                        value={selectedTypAkceId}
                        onChange={(event) => setSelectedTypAkceId(event.target.value)}
                        aria-label="Výběr péče"
                      >
                        {typyAkci.map((item) => {
                          const isWater = isWateringActionName(item.typAkce);
                          const icon = isWater
                            ? '💧'
                            : item.typAkce.toLowerCase().includes('hnoj')
                            ? '🌱'
                            : item.typAkce.toLowerCase().includes('ros')
                            ? '💨'
                            : item.typAkce.toLowerCase().includes('pres')
                            ? '🪴'
                            : '🌿';
                          return (
                            <option key={item.id} value={item.id}>
                              {icon} {item.typAkce}
                            </option>
                          );
                        })}
                      </select>

                      <button className="care-execute-btn" type="submit" disabled={!selectedTypAkceId}>
                        Provést
                      </button>
                    </div>
                    {novaAkceMessage && (
                      <div className="detail-care-feedback-badge">{novaAkceMessage}</div>
                    )}
                  </form>
                </div>

                {/* FOTOGALERIE */}
                <div className="detail-section-card">
                  <div className="section-card-header-split">
                    <div className="section-card-header-left">
                      <span className="section-card-icon">📸</span>
                      <div>
                        <h3 className="section-card-title">Fotogalerie</h3>
                        <p className="section-card-desc">{galerie.length} {galerie.length === 1 ? 'fotografie' : 'fotografií'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="detail-add-photo-toggle"
                      onClick={() => setShowAddPhotoForm(!showAddPhotoForm)}
                    >
                      {showAddPhotoForm ? 'Zavřít' : '+ Přidat'}
                    </button>
                  </div>

                  {showAddPhotoForm && (
                    <form className="detail-photo-upload-box" onSubmit={submitNovaFotka}>
                      <input type="file" accept="image/*" onChange={(event) => setNewPhoto(event.target.files?.[0] || null)} />
                      <input
                        type="text"
                        value={newPhotoPoznamka}
                        onChange={(event) => setNewPhotoPoznamka(event.target.value)}
                        placeholder="Poznámka k fotce (volitelné)"
                      />
                      <button className="action-button primary" type="submit" disabled={!newPhoto}>
                        Nahrát fotografii
                      </button>
                      {photoMessage && <p className="detail-feedback-msg">{photoMessage}</p>}
                    </form>
                  )}

                  {galerie.length > 0 ? (
                    <div className="detail-gallery-row">
                      {galerie.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="detail-gallery-thumb-btn"
                          onClick={() => setExpandedPhoto(item)}
                        >
                          <img src={getFileUrl(item.fotkaName)} alt={item.poznamka || 'Fotka'} className="detail-gallery-thumb-img" />
                          <span className="detail-gallery-thumb-date">{new Date(item.datumPorizeni).toLocaleDateString('cs-CZ')}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="detail-empty-text">Zatím bez dalších fotografií.</p>
                  )}
                </div>

                {/* HISTORIE PÉČE */}
                <div className="detail-section-card">
                  <div className="section-card-header">
                    <span className="section-card-icon">📜</span>
                    <div>
                      <h3 className="section-card-title">Historie péče</h3>
                      <p className="section-card-desc">{historie.length} {historie.length === 1 ? 'záznam' : 'záznamů'}</p>
                    </div>
                  </div>

                  {historie.length > 0 ? (
                    <ul className="detail-history-list">
                      {historie.map((item) => {
                        const isWatering = isWateringActionName(item.typAkce.typAkce);
                        const icon = item.typAkce.ikona || (isWatering ? '💧' : '🌱');
                        return (
                          <li key={item.id} className="detail-history-item">
                            <span className="history-item-icon">{icon}</span>
                            <div className="history-item-body">
                              <strong>{item.typAkce.typAkce}</strong>
                              <span>{new Date(item.datum).toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                            <button
                              type="button"
                              className="history-delete-btn"
                              onClick={() => removeHistorieItem(item.id)}
                              title="Smazat záznam"
                              aria-label="Smazat záznam"
                            >
                              ✕
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="detail-empty-text">Zatím žádné záznamy o péči.</p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="detail-empty-text">Vyberte rostlinu ze seznamu.</p>
        )}
      </article>

      {expandedPhoto && (
        <div className="photo-modal" role="dialog" aria-modal="true">
          <button type="button" className="photo-modal-backdrop" onClick={() => setExpandedPhoto(null)} aria-label="Zavrit detail fotky" />
          <div className="photo-modal-panel">
            <img src={getFileUrl(expandedPhoto.fotkaName)} alt={expandedPhoto.poznamka || 'Zvetsena fotka'} className="photo-modal-image" />
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
                href={getFileUrl(expandedPhoto.fotkaName)}
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

      {/* QUICK STORY ACTION MODAL / SHEET */}
      {activeStoryPlant && (
        <div className="story-modal" role="dialog" aria-modal="true">
          <div
            className="story-modal-backdrop"
            onClick={() => {
              setActiveStoryPlant(null);
              setStoryActionFeedback(null);
            }}
          />
          <div className="story-modal-card">
            <button
              type="button"
              className="story-modal-close"
              onClick={() => {
                setActiveStoryPlant(null);
                setStoryActionFeedback(null);
              }}
              aria-label="Zavřít"
            >
              ✕
            </button>

            {(() => {
              const fullPlant = rostliny.find((r) => r.id === activeStoryPlant.id);
              const thumb = fullPlant?.galerieFotky?.[0];
              return (
                <>
                  <div className="story-modal-hero">
                    {thumb ? (
                      <img
                        src={getFileUrl(thumb.fotkaName)}
                        alt={activeStoryPlant.vlastniJmeno}
                        className="story-modal-image"
                      />
                    ) : (
                      <div className="story-modal-placeholder">🌿</div>
                    )}
                    <div className="story-modal-badge">
                      {activeStoryPlant.dnyOdPoslednihoZaliti === null
                        ? 'Zatím bez zálivky'
                        : `Nezalito ${activeStoryPlant.dnyOdPoslednihoZaliti} dní`}
                    </div>
                  </div>

                  <div className="story-modal-info">
                    <h3 className="story-modal-title">{activeStoryPlant.vlastniJmeno}</h3>
                    <p className="story-modal-species">
                      {activeStoryPlant.druh.nazev}
                      {activeStoryPlant.druh.rodNazev ? ` • ${activeStoryPlant.druh.rodNazev}` : ''}
                    </p>
                    {fullPlant?.umisteni && (
                      <span className="story-modal-location">📍 {fullPlant.umisteni.nazev}</span>
                    )}
                  </div>

                  {storyActionFeedback && (
                    <div className="story-modal-feedback">{storyActionFeedback}</div>
                  )}

                  <div className="story-modal-actions">
                    <button
                      type="button"
                      className="story-action-btn primary"
                      disabled={storyActionLoading}
                      onClick={() => handleQuickWater(activeStoryPlant.id, activeStoryPlant.vlastniJmeno)}
                    >
                      💧 Zalít nyní
                    </button>
                    <button
                      type="button"
                      className="story-action-btn secondary"
                      disabled={storyActionLoading}
                      onClick={() => handleQuickPostpone(activeStoryPlant.id, activeStoryPlant.vlastniJmeno)}
                    >
                      ⏳ Odložit o 2 dny
                    </button>
                    <button
                      type="button"
                      className="story-action-btn ghost"
                      onClick={() => {
                        const id = activeStoryPlant.id;
                        setActiveStoryPlant(null);
                        openPlantDetail(id);
                      }}
                    >
                      🔍 Otevřít celou kartu
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </section>
  );
}
