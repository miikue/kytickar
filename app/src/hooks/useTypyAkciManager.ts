import { useState } from 'react';
import type { FormEvent } from 'react';
import { logActivity } from '../api/activityApi';
import { createTypAkce, deleteTypAkce, updateTypAkce } from '../api/typyAkciApi';

export function useTypyAkciManager(reload: () => Promise<void>) {
  const [editingTypAkceId, setEditingTypAkceId] = useState<number | null>(null);
  const [typAkceNazev, setTypAkceNazev] = useState('');
  const [typAkceIkona, setTypAkceIkona] = useState('💧');
  const [typAkceInterval, setTypAkceInterval] = useState('7');
  const [typAkceOdlozit, setTypAkceOdlozit] = useState('2');
  const [typAkceIsWatering, setTypAkceIsWatering] = useState(false);
  const [typAkceMessage, setTypAkceMessage] = useState<string | null>(null);

  async function submitTypAkce(event: FormEvent) {
    event.preventDefault();
    setTypAkceMessage(null);

    try {
      const currentLabel = typAkceNazev.trim();
      const intervalVal = typAkceInterval.trim() ? Number(typAkceInterval) : null;
      const odlozitVal = typAkceOdlozit.trim() ? Number(typAkceOdlozit) : null;

      if (editingTypAkceId) {
        await updateTypAkce(editingTypAkceId, {
          typAkce: typAkceNazev,
          ikona: typAkceIkona,
          intervalDny: intervalVal,
          odlozitDny: odlozitVal,
          isWatering: typAkceIsWatering,
        });
      } else {
        await createTypAkce({
          typAkce: typAkceNazev,
          ikona: typAkceIkona,
          intervalDny: intervalVal,
          odlozitDny: odlozitVal,
          isWatering: typAkceIsWatering,
        });
      }

      setTypAkceMessage(editingTypAkceId ? 'Typ akce upraven.' : 'Typ akce vytvořen.');
      void logActivity({
        eventType: editingTypAkceId ? 'update' : 'create',
        section: 'typy_akci',
        label: `${typAkceIkona} ${currentLabel}`,
        entityId: editingTypAkceId,
      }).catch(() => undefined);
      setEditingTypAkceId(null);
      setTypAkceNazev('');
      setTypAkceIkona('💧');
      setTypAkceInterval('7');
      setTypAkceOdlozit('2');
      setTypAkceIsWatering(false);
      await reload();
    } catch (err) {
      setTypAkceMessage(err instanceof Error ? err.message : 'Uložení typu akce selhalo.');
    }
  }

  async function removeTypAkce(id: number) {
    setTypAkceMessage(null);

    try {
      await deleteTypAkce(id);
      void logActivity({ eventType: 'delete', section: 'typy_akci', label: typAkceNazev.trim() || null, entityId: id }).catch(() => undefined);

      if (editingTypAkceId === id) {
        setEditingTypAkceId(null);
        setTypAkceNazev('');
        setTypAkceIkona('💧');
        setTypAkceInterval('7');
        setTypAkceOdlozit('2');
      }

      setTypAkceMessage('Typ akce smazán.');
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Smazání typu akce selhalo.';
      setTypAkceMessage(msg);
      window.alert('⚠️ ' + msg);
    }
  }

  return {
    editingTypAkceId,
    setEditingTypAkceId,
    typAkceNazev,
    setTypAkceNazev,
    typAkceIkona,
    setTypAkceIkona,
    typAkceInterval,
    setTypAkceInterval,
    typAkceOdlozit,
    setTypAkceOdlozit,
    typAkceIsWatering,
    setTypAkceIsWatering,
    typAkceMessage,
    setTypAkceMessage,
    submitTypAkce,
    removeTypAkce,
  };
}