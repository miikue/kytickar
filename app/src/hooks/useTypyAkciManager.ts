import { useState } from 'react';
import type { FormEvent } from 'react';
import { createTypAkce, deleteTypAkce, updateTypAkce } from '../api/typyAkciApi';

export function useTypyAkciManager(reload: () => Promise<void>) {
  const [editingTypAkceId, setEditingTypAkceId] = useState<number | null>(null);
  const [typAkceNazev, setTypAkceNazev] = useState('');
  const [typAkceMessage, setTypAkceMessage] = useState<string | null>(null);

  async function submitTypAkce(event: FormEvent) {
    event.preventDefault();
    setTypAkceMessage(null);

    try {
      if (editingTypAkceId) {
        await updateTypAkce(editingTypAkceId, { typAkce: typAkceNazev });
      } else {
        await createTypAkce({ typAkce: typAkceNazev });
      }

      setTypAkceMessage(editingTypAkceId ? 'Typ akce upraven.' : 'Typ akce vytvoren.');
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