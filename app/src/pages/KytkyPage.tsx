import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
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
import { logActivity } from '../api/activityApi';
import { deleteRostlina, updateRostlina } from '../api/rostlinyApi';
import type { Druh, GalerieFotka, HistoriePece, Medium, Rostlina, RostlinaOdZaliti, TypAkce, Umisteni } from '../types/app';
import { isWateringAction } from '../services/localDb';
import PlantStories from '../components/PlantStories';
import PlantList from '../components/PlantList';
import PlantDetail from '../components/PlantDetail';
import PhotoPreviewModal from '../components/PhotoPreviewModal';
import type { PlantEditFormData } from '../components/PlantEditForm';
import { useBackButton } from '../hooks/useBackButton';

type Props = {
  rostliny: Rostlina[];
  druhy: Druh[];
  media: Medium[];
  umisteni: Umisteni[];
  onReload: () => Promise<void>;
  onDetailOpenChange?: (open: boolean) => void;
  resetTrigger?: number;
};

const EMPTY_EDIT_FORM: PlantEditFormData = {
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
  const [editForm, setEditForm] = useState<PlantEditFormData>(EMPTY_EDIT_FORM);
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
  const [isDetailPhotoModalOpen, setIsDetailPhotoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUmisteniFilterId, setSelectedUmisteniFilterId] = useState<string>('all');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [shouldScrollToDetail, setShouldScrollToDetail] = useState(false);
  const detailCardRef = useRef<HTMLElement | null>(null);

  // 1. Zvětšená fotografie (nejvyšší priorita 100)
  useBackButton('kytky-expanded-photo', 100, expandedPhoto !== null, () => {
    setExpandedPhoto(null);
    return true;
  });

  // 2. Dialog výběru fotoaparát / galerie (priorita 100)
  useBackButton('kytky-photo-modal', 100, isDetailPhotoModalOpen, () => {
    setIsDetailPhotoModalOpen(false);
    return true;
  });

  // 3. Zobrazení Story / Příběhu (priorita 90)
  useBackButton('kytky-story', 90, activeStoryPlant !== null, () => {
    setActiveStoryPlant(null);
    return true;
  });

  // 4. Formulář přidání fotky v detailu (priorita 75)
  useBackButton('kytky-add-photo-form', 75, showAddPhotoForm, () => {
    setShowAddPhotoForm(false);
    setNewPhoto(null);
    setNewPhotoPoznamka('');
    return true;
  });

  // 5. Editační režim kytky (priorita 70)
  useBackButton('kytky-edit-plant', 70, isEditing, () => {
    setIsEditing(false);
    setEditMessage(null);
    return true;
  });

  // 6. Detail kytky (priorita 50 - vrátí zpět do seznamu)
  useBackButton('kytky-selected-plant', 50, selectedId !== null, () => {
    setSelectedId(null);
    onDetailOpenChange?.(false);
    return true;
  });

  const selectedRostlina = useMemo(
    () => rostliny.find((item) => item.id === selectedId) || null,
    [rostliny, selectedId],
  );

  const filteredRostliny = useMemo(() => {
    let result = rostliny;

    if (selectedUmisteniFilterId !== 'all') {
      const umisteniIdNum = Number(selectedUmisteniFilterId);
      result = result.filter((r) => r.umisteni?.id === umisteniIdNum);
    }

    const query = searchQuery.trim();
    if (query) {
      const queryNorm = query
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      result = result.filter((r) => {
        const jmenoNorm = (r.vlastniJmeno || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const druhNorm = (r.druh?.nazev || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const rodNorm = (r.druh?.rod?.nazev || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();
        const umisteniNorm = (r.umisteni?.nazev || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

        return (
          jmenoNorm.includes(queryNorm) ||
          druhNorm.includes(queryNorm) ||
          rodNorm.includes(queryNorm) ||
          umisteniNorm.includes(queryNorm)
        );
      });
    }

    return result;
  }, [rostliny, searchQuery, selectedUmisteniFilterId]);

  useEffect(() => {
    onDetailOpenChange?.(Boolean(selectedRostlina || activeStoryPlant));
  }, [selectedRostlina, activeStoryPlant, onDetailOpenChange]);

  useEffect(() => {
    if (resetTrigger) {
      setSelectedId(null);
      setIsEditing(false);
      setActiveStoryPlant(null);
      setExpandedPhoto(null);
      setSearchQuery('');
      setSelectedUmisteniFilterId('all');
      setIsSearchExpanded(false);
      setIsDetailPhotoModalOpen(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [resetTrigger]);

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
          const aIsWatering = isWateringAction(a);
          const bIsWatering = isWateringAction(b);

          if (aIsWatering && !bIsWatering) {
            return -1;
          }

          if (!aIsWatering && bIsWatering) {
            return 1;
          }

          return a.typAkce.localeCompare(b.typAkce, 'cs-CZ');
        });

        const defaultActionId = String(
          sortedTypy.find((item) => isWateringAction(item))?.id || sortedTypy[0]?.id || '',
        );

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
    const handleOpenDetail = (e: any) => {
      if (e.detail) {
        setSelectedId(Number(e.detail));
        onDetailOpenChange?.(true);
      }
    };
    window.addEventListener('kytickar-open-plant-detail', handleOpenDetail);
    return () => {
      window.removeEventListener('kytickar-open-plant-detail', handleOpenDetail);
    };
  }, [onDetailOpenChange]);

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
      const types = await fetchTypyAkci();
      const waterType = types.find((t) => t.isWatering) || types.find((t) => isWateringAction(t));
      if (!waterType) {
        throw new Error(
          'Nebyl nalezen žádný typ akce pro zálivku. Nastavte v Katalogu u typu péče příznak "Považovat za zálivku".',
        );
      }

      await createHistoriePece({ rostlinaId, typAkceId: waterType.id });
      void logActivity({
        eventType: 'create',
        section: 'historie_pece',
        label: `Zaliti: ${vlastniJmeno}`,
        entityId: rostlinaId,
      }).catch(() => undefined);

      setStoryActionFeedback(`💧 ${vlastniJmeno} zalita!`);

      const currentIndex = nejdelsiOdZaliti.findIndex((item) => item.id === rostlinaId);
      const remaining = nejdelsiOdZaliti.filter((item) => item.id !== rostlinaId);
      const nextPlant =
        remaining.length > 0 ? remaining[currentIndex < remaining.length ? currentIndex : 0] : null;

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
      const waterType = typyAkci.find((t) => t.isWatering) || typyAkci.find((t) => isWateringAction(t));
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
        }.`,
      );

      const currentIndex = nejdelsiOdZaliti.findIndex((item) => item.id === rostlinaId);
      const remaining = nejdelsiOdZaliti.filter((item) => item.id !== rostlinaId);
      const nextPlant =
        remaining.length > 0 ? remaining[currentIndex < remaining.length ? currentIndex : 0] : null;

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
      const actionIcon = actionObj?.ikona || (actionObj && isWateringAction(actionObj) ? '💧' : '✨');
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
        <PlantStories
          rostliny={rostliny}
          nejdelsiOdZaliti={nejdelsiOdZaliti}
          typyAkci={typyAkci}
          activeStoryPlant={activeStoryPlant}
          setActiveStoryPlant={setActiveStoryPlant}
          storyActionFeedback={storyActionFeedback}
          setStoryActionFeedback={setStoryActionFeedback}
          storyActionLoading={storyActionLoading}
          onQuickWater={handleQuickWater}
          onQuickPostpone={handleQuickPostpone}
          onOpenDetail={openPlantDetail}
        />

        <PlantList
          rostliny={rostliny}
          filteredRostliny={filteredRostliny}
          umisteni={umisteni}
          selectedId={selectedId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedUmisteniFilterId={selectedUmisteniFilterId}
          setSelectedUmisteniFilterId={setSelectedUmisteniFilterId}
          isSearchExpanded={isSearchExpanded}
          setIsSearchExpanded={setIsSearchExpanded}
          onSelectPlant={openPlantDetail}
        />
      </article>

      <PlantDetail
        ref={detailCardRef}
        selectedRostlina={selectedRostlina}
        detailLoading={detailLoading}
        detailError={detailError}
        isEditing={isEditing}
        editForm={editForm}
        setEditForm={setEditForm}
        editMessage={editMessage}
        druhy={druhy}
        media={media}
        umisteni={umisteni}
        typyAkci={typyAkci}
        selectedTypAkceId={selectedTypAkceId}
        setSelectedTypAkceId={setSelectedTypAkceId}
        novaAkceMessage={novaAkceMessage}
        galerie={galerie}
        historie={historie}
        latestPhoto={latestPhoto}
        newPhoto={newPhoto}
        setNewPhoto={setNewPhoto}
        newPhotoPoznamka={newPhotoPoznamka}
        setNewPhotoPoznamka={setNewPhotoPoznamka}
        photoMessage={photoMessage}
        setPhotoMessage={setPhotoMessage}
        showAddPhotoForm={showAddPhotoForm}
        setShowAddPhotoForm={setShowAddPhotoForm}
        isDetailPhotoModalOpen={isDetailPhotoModalOpen}
        setIsDetailPhotoModalOpen={setIsDetailPhotoModalOpen}
        onBackToList={goBackToList}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onRemoveRostlina={removeRostlina}
        onSubmitEdit={submitEdit}
        onSubmitNovaAkce={submitNovaAkce}
        onSubmitNovaFotka={submitNovaFotka}
        onRemoveHistorieItem={removeHistorieItem}
        onExpandPhoto={setExpandedPhoto}
      />

      <PhotoPreviewModal
        photo={expandedPhoto}
        onClose={() => setExpandedPhoto(null)}
        onDelete={removeExpandedPhoto}
      />
    </section>
  );
}
