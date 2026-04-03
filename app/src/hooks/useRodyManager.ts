import { useState } from 'react';
import type { FormEvent } from 'react';
import { createRod, deleteRod, updateRod } from '../api/rodyApi';

export function useRodyManager(reload: () => Promise<void>) {
  const [editingRodId, setEditingRodId] = useState<number | null>(null);
  const [rodNazev, setRodNazev] = useState('');
  const [rodPopis, setRodPopis] = useState('');
  const [rodMessage, setRodMessage] = useState<string | null>(null);

  async function submitRod(event: FormEvent) {
    event.preventDefault();
    setRodMessage(null);

    try {
      if (editingRodId) {
        await updateRod(editingRodId, { nazev: rodNazev, popis: rodPopis || null });
      } else {
        await createRod({ nazev: rodNazev, popis: rodPopis || null });
      }

      setRodMessage(editingRodId ? 'Rod upraven.' : 'Rod vytvoren.');
      setEditingRodId(null);
      setRodNazev('');
      setRodPopis('');
      await reload();
    } catch (err) {
      setRodMessage(err instanceof Error ? err.message : 'Ulozeni rodu selhalo.');
    }
  }

  async function removeRod(id: number) {
    setRodMessage(null);

    try {
      await deleteRod(id);

      if (editingRodId === id) {
        setEditingRodId(null);
        setRodNazev('');
        setRodPopis('');
      }

      setRodMessage('Rod smazan.');
      await reload();
    } catch (err) {
      setRodMessage(err instanceof Error ? err.message : 'Smazani rodu selhalo.');
    }
  }

  async function submitNewRodInline(params: {
    nazev: string;
    popis: string;
    onCreated: (id: number) => void;
    onSuccess: () => void;
    onError: (message: string) => void;
  }) {
    try {
      const created = await createRod({ nazev: params.nazev, popis: params.popis || null });
      if (!created) {
        params.onError('Vytvoreni rodu selhalo.');
        return;
      }

      params.onCreated(created.id);
      params.onSuccess();
      await reload();
    } catch (err) {
      params.onError(err instanceof Error ? err.message : 'Vytvoreni rodu selhalo.');
    }
  }

  return {
    editingRodId,
    setEditingRodId,
    rodNazev,
    setRodNazev,
    rodPopis,
    setRodPopis,
    rodMessage,
    setRodMessage,
    submitRod,
    removeRod,
    submitNewRodInline,
  };
}
