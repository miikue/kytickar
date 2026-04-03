import { useState } from 'react';
import type { FormEvent } from 'react';
import { createMedium, deleteMedium, updateMedium } from '../api/mediaApi';

export function useMediaManager(reload: () => Promise<void>) {
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null);
  const [mediaNazev, setMediaNazev] = useState('');
  const [mediaPopis, setMediaPopis] = useState('');
  const [mediaMessage, setMediaMessage] = useState<string | null>(null);

  async function submitMedia(event: FormEvent) {
    event.preventDefault();
    setMediaMessage(null);

    try {
      if (editingMediaId) {
        await updateMedium(editingMediaId, { nazev: mediaNazev, popis: mediaPopis || null });
      } else {
        await createMedium({ nazev: mediaNazev, popis: mediaPopis || null });
      }

      setMediaMessage(editingMediaId ? 'Medium upraveno.' : 'Medium vytvoreno.');
      setEditingMediaId(null);
      setMediaNazev('');
      setMediaPopis('');
      await reload();
    } catch (err) {
      setMediaMessage(err instanceof Error ? err.message : 'Ulozeni media selhalo.');
    }
  }

  async function removeMedia(id: number) {
    setMediaMessage(null);

    try {
      await deleteMedium(id);

      if (editingMediaId === id) {
        setEditingMediaId(null);
        setMediaNazev('');
        setMediaPopis('');
      }

      setMediaMessage('Medium smazano.');
      await reload();
    } catch (err) {
      setMediaMessage(err instanceof Error ? err.message : 'Smazani media selhalo.');
    }
  }

  return {
    editingMediaId,
    setEditingMediaId,
    mediaNazev,
    setMediaNazev,
    mediaPopis,
    setMediaPopis,
    mediaMessage,
    setMediaMessage,
    submitMedia,
    removeMedia,
  };
}
