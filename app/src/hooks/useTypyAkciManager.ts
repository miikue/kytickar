import { useState } from 'react';
import type { FormEvent } from 'react';
import { logActivity } from '../api/activityApi';
import { createTypAkce, deleteTypAkce, updateTypAkce } from '../api/typyAkciApi';

export function useTypyAkciManager(reload: () => Promise<void>) {
  const [editingTypAkceId, setEditingTypAkceId] = useState<number | null>(null);
  const [typAkceNazev, setTypAkceNazev] = useState('');
  const [typAkceMessage, setTypAkceMessage] = useState<string | null>(null);

  async function submitTypAkce(event: FormEvent) {
    event.preventDefault();
    setTypAkceMessage(null);

    try {
      const currentLabel = typAkceNazev.trim();
      if (editingTypAkceId) {
        await updateTypAkce(editingTypAkceId, { typAkce: typAkceNazev });
      } else {
        await createTypAkce({ typAkce: typAkceNazev });
      }

      setTypAkceMessage(editingTypAkceId ? 'Typ akce upraven.' : 'Typ akce vytvoren.');
      void logActivity({
        eventType: editingTypAkceId ? 'update' : 'create',
        section: 'typy_akci',
        label: currentLabel,
        entityId: editingTypAkceId,
      }).catch(() => undefined);
      setEditingTypAkceId(null);
      setTypAkceNazev('');
      await reload();
    } catch (err) {
      setTypAkceMessage(err instanceof Error ? err.message : 'Ulozeni typu akce selhalo.');
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
      }

      setTypAkceMessage('Typ akce smazan.');
      await reload();
    } catch (err) {
      setTypAkceMessage(err instanceof Error ? err.message : 'Smazani typu akce selhalo.');
    }
  }

  return {
    editingTypAkceId,
    setEditingTypAkceId,
    typAkceNazev,
    setTypAkceNazev,
    typAkceMessage,
    setTypAkceMessage,
    submitTypAkce,
    removeTypAkce,
  };
}