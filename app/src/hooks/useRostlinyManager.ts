import { useState } from 'react';
import type { FormEvent } from 'react';
import { createDruh } from '../api/druhyApi';
import { logActivity } from '../api/activityApi';
import { createGalerieFotka } from '../api/galerieFotkyApi';
import { createMedium } from '../api/mediaApi';
import { createRod } from '../api/rodyApi';
import { createUmisteni } from '../api/umisteniApi';
import { uploadFile } from '../api/http';
import { createRostlina } from '../api/rostlinyApi';

type NewPlantForm = {
  vlastniJmeno: string;
  druhId: string;
  mediumId: string;
  umisteniId: string;
  aktualniZdravi: string;
};

const INITIAL_FORM: NewPlantForm = {
  vlastniJmeno: '',
  druhId: '',
  mediumId: '',
  umisteniId: '',
  aktualniZdravi: '5',
};

export function useRostlinyManager(reload: () => Promise<void>, setActiveTab: (tab: 'kytky') => void) {
  const [newPlant, setNewPlant] = useState<NewPlantForm>(INITIAL_FORM);
  const [plantMessage, setPlantMessage] = useState<string | null>(null);
  const [initialPhoto, setInitialPhoto] = useState<File | null>(null);
  const [initialPhotoMessage, setInitialPhotoMessage] = useState<string | null>(null);
  const [showNewDruhForm, setShowNewDruhForm] = useState(false);
  const [newDruhNazev, setNewDruhNazev] = useState('');
  const [newDruhPopis, setNewDruhPopis] = useState('');
  const [newDruhMessage, setNewDruhMessage] = useState<string | null>(null);
  const [newDruhRodId, setNewDruhRodId] = useState('');
  const [showNewDruhRodForm, setShowNewDruhRodForm] = useState(false);
  const [newDruhRodNazev, setNewDruhRodNazev] = useState('');
  const [newDruhRodPopis, setNewDruhRodPopis] = useState('');
  const [newDruhRodMessage, setNewDruhRodMessage] = useState<string | null>(null);

  const [showNewMediumForm, setShowNewMediumForm] = useState(false);
  const [newMediumNazev, setNewMediumNazev] = useState('');
  const [newMediumPopis, setNewMediumPopis] = useState('');
  const [newMediumMessage, setNewMediumMessage] = useState<string | null>(null);

  const [showNewUmisteniForm, setShowNewUmisteniForm] = useState(false);
  const [newUmisteniNazev, setNewUmisteniNazev] = useState('');
  const [newUmisteniMessage, setNewUmisteniMessage] = useState<string | null>(null);

  async function submitRostlina(event: FormEvent) {
    event.preventDefault();
    setPlantMessage(null);
    setInitialPhotoMessage(null);

    try {
      const createdPlant = await createRostlina(newPlant);

      if (!createdPlant) {
        setPlantMessage('Vytvoreni kytky selhalo.');
        return;
      }

      if (initialPhoto) {
        try {
          const fileName = await uploadFile(initialPhoto);
          await createGalerieFotka({
            rostlinaId: createdPlant.id,
            fotkaName: fileName,
            poznamka: 'uvodni',
          });
          setInitialPhotoMessage('Uvodni fotka ulozena.');
        } catch (photoError) {
          setInitialPhotoMessage(
            photoError instanceof Error ? photoError.message : 'Uvodni fotku se nepodarilo ulozit.',
          );
        }
      }

      setPlantMessage('Kytka pridana.');
      void logActivity({ eventType: 'create', section: 'rostliny', label: newPlant.vlastniJmeno.trim(), entityId: createdPlant.id }).catch(() => undefined);
      setNewPlant(INITIAL_FORM);
      setInitialPhoto(null);
      setActiveTab('kytky');
      await reload();
    } catch (err) {
      setPlantMessage(err instanceof Error ? err.message : 'Vytvoreni kytky selhalo.');
    }
  }

  async function createInlineDruh() {
    setNewDruhMessage(null);

    if (!newDruhNazev.trim()) {
      setNewDruhMessage('Nazev druhu je povinny.');
      return;
    }

    if (!newDruhRodId) {
      setNewDruhMessage('Nejdriv vyber nebo vytvor rod.');
      return;
    }

    try {
      const created = await createDruh({ nazev: newDruhNazev, popis: newDruhPopis || null, rodId: Number(newDruhRodId) });

      if (!created) {
        setNewDruhMessage('Vytvoreni druhu selhalo.');
        return;
      }

      setNewPlant((prev) => ({ ...prev, druhId: String(created.id) }));
      void logActivity({ eventType: 'create', section: 'druhy', label: newDruhNazev.trim(), entityId: created.id }).catch(() => undefined);
      setNewDruhNazev('');
      setNewDruhPopis('');
      setShowNewDruhForm(false);
      setNewDruhRodId('');
      setNewDruhMessage('Druh vytvoren a vybran.');
      await reload();
    } catch (err) {
      setNewDruhMessage(err instanceof Error ? err.message : 'Vytvoreni druhu selhalo.');
    }
  }

  async function createInlineDruhRod() {
    setNewDruhRodMessage(null);

    if (!newDruhRodNazev.trim()) {
      setNewDruhRodMessage('Nazev rodu je povinny.');
      return;
    }

    try {
      const created = await createRod({ nazev: newDruhRodNazev, popis: newDruhRodPopis || null });

      if (!created) {
        setNewDruhRodMessage('Vytvoreni rodu selhalo.');
        return;
      }

      setNewDruhRodId(String(created.id));
      void logActivity({ eventType: 'create', section: 'rody', label: newDruhRodNazev.trim(), entityId: created.id }).catch(() => undefined);
      setNewDruhRodNazev('');
      setNewDruhRodPopis('');
      setShowNewDruhRodForm(false);
      setNewDruhRodMessage('Rod vytvoren a vybran.');
      await reload();
    } catch (err) {
      setNewDruhRodMessage(err instanceof Error ? err.message : 'Vytvoreni rodu selhalo.');
    }
  }

  async function createInlineMedium() {
    setNewMediumMessage(null);

    if (!newMediumNazev.trim()) {
      setNewMediumMessage('Nazev media je povinny.');
      return;
    }

    try {
      const created = await createMedium({ nazev: newMediumNazev, popis: newMediumPopis || null });

      if (!created) {
        setNewMediumMessage('Vytvoreni media selhalo.');
        return;
      }

      setNewPlant((prev) => ({ ...prev, mediumId: String(created.id) }));
      void logActivity({ eventType: 'create', section: 'media', label: newMediumNazev.trim(), entityId: created.id }).catch(() => undefined);
      setNewMediumNazev('');
      setNewMediumPopis('');
      setShowNewMediumForm(false);
      setNewMediumMessage('Medium vytvoreno a vybrano.');
      await reload();
    } catch (err) {
      setNewMediumMessage(err instanceof Error ? err.message : 'Vytvoreni media selhalo.');
    }
  }

  async function createInlineUmisteni() {
    setNewUmisteniMessage(null);

    if (!newUmisteniNazev.trim()) {
      setNewUmisteniMessage('Nazev umisteni je povinny.');
      return;
    }

    try {
      const created = await createUmisteni({ nazev: newUmisteniNazev, parentId: null });

      if (!created) {
        setNewUmisteniMessage('Vytvoreni umisteni selhalo.');
        return;
      }

      setNewPlant((prev) => ({ ...prev, umisteniId: String(created.id) }));
      void logActivity({ eventType: 'create', section: 'umisteni', label: newUmisteniNazev.trim(), entityId: created.id }).catch(() => undefined);
      setNewUmisteniNazev('');
      setShowNewUmisteniForm(false);
      setNewUmisteniMessage('Umisteni vytvoreno a vybrano.');
      await reload();
    } catch (err) {
      setNewUmisteniMessage(err instanceof Error ? err.message : 'Vytvoreni umisteni selhalo.');
    }
  }

  return {
    newPlant,
    setNewPlant,
    initialPhoto,
    setInitialPhoto,
    initialPhotoMessage,
    setInitialPhotoMessage,
    plantMessage,
    submitRostlina,
    showNewDruhForm,
    setShowNewDruhForm,
    newDruhNazev,
    setNewDruhNazev,
    newDruhPopis,
    setNewDruhPopis,
    newDruhMessage,
    setNewDruhMessage,
    newDruhRodId,
    setNewDruhRodId,
    showNewDruhRodForm,
    setShowNewDruhRodForm,
    newDruhRodNazev,
    setNewDruhRodNazev,
    newDruhRodPopis,
    setNewDruhRodPopis,
    newDruhRodMessage,
    setNewDruhRodMessage,
    createInlineDruh,
    createInlineDruhRod,
    showNewMediumForm,
    setShowNewMediumForm,
    newMediumNazev,
    setNewMediumNazev,
    newMediumPopis,
    setNewMediumPopis,
    newMediumMessage,
    setNewMediumMessage,
    createInlineMedium,
    showNewUmisteniForm,
    setShowNewUmisteniForm,
    newUmisteniNazev,
    setNewUmisteniNazev,
    newUmisteniMessage,
    setNewUmisteniMessage,
    createInlineUmisteni,
  };
}
