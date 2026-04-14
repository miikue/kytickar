import { useState } from 'react';
import type { FormEvent } from 'react';
import { logActivity } from '../api/activityApi';
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
      const currentLabel = umisteniForm.nazev.trim();
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
      void logActivity({
        eventType: editingUmisteniId ? 'update' : 'create',
        section: 'umisteni',
        label: currentLabel,
        entityId: editingUmisteniId,
      }).catch(() => undefined);
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
      void logActivity({ eventType: 'delete', section: 'umisteni', label: umisteniForm.nazev.trim() || null, entityId: id }).catch(() => undefined);

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