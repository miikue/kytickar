import { useState } from 'react';
import type { FormEvent } from 'react';
import { createUmisteni, deleteUmisteni, updateUmisteni } from '../api/umisteniApi';

type UmisteniForm = {
  nazev: string;
  parentId: string;
};

export function useUmisteniManager(reload: () => Promise<void>) {
  const [editingUmisteniId, setEditingUmisteniId] = useState<number | null>(null);
  const [umisteniForm, setUmisteniForm] = useState<UmisteniForm>({ nazev: '', parentId: '' });
  const [umisteniMessage, setUmisteniMessage] = useState<string | null>(null);

  async function submitUmisteni(event: FormEvent) {
    event.preventDefault();
    setUmisteniMessage(null);

    try {
      const payload = {
        nazev: umisteniForm.nazev,
        parentId: umisteniForm.parentId ? Number(umisteniForm.parentId) : null,
      };

      if (editingUmisteniId) {
        await updateUmisteni(editingUmisteniId, payload);
      } else {
        await createUmisteni(payload);
      }

      setUmisteniMessage(editingUmisteniId ? 'Umisteni upraveno.' : 'Umisteni vytvoreno.');
      setEditingUmisteniId(null);
      setUmisteniForm({ nazev: '', parentId: '' });
      await reload();
    } catch (err) {
      setUmisteniMessage(err instanceof Error ? err.message : 'Ulozeni umisteni selhalo.');
    }
  }

  async function removeUmisteni(id: number) {
    setUmisteniMessage(null);

    try {
      await deleteUmisteni(id);

      if (editingUmisteniId === id) {
        setEditingUmisteniId(null);
        setUmisteniForm({ nazev: '', parentId: '' });
      }

      setUmisteniMessage('Umisteni smazano.');
      await reload();
    } catch (err) {
      setUmisteniMessage(err instanceof Error ? err.message : 'Smazani umisteni selhalo.');
    }
  }

  return {
    editingUmisteniId,
    setEditingUmisteniId,
    umisteniForm,
    setUmisteniForm,
    umisteniMessage,
    setUmisteniMessage,
    submitUmisteni,
    removeUmisteni,
  };
}