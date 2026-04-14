import { useState } from 'react';
import type { FormEvent } from 'react';
import { logActivity } from '../api/activityApi';
import { deleteDruh, saveDruh } from '../api/druhyApi';

type DruhForm = {
  nazev: string;
  popis: string;
  rodId: string;
};

type DruhPhotos = {
  fotka1: File | null;
  fotka2: File | null;
};

type UploadedNames = {
  fotka1: string;
  fotka2: string;
};

export function useDruhyManager(reload: () => Promise<void>) {
  const [editingDruhId, setEditingDruhId] = useState<number | null>(null);
  const [druhForm, setDruhForm] = useState<DruhForm>({ nazev: '', popis: '', rodId: '' });
  const [uploadingDruhPhotos, setUploadingDruhPhotos] = useState<DruhPhotos>({ fotka1: null, fotka2: null });
  const [uploadedDruhPhotoNames, setUploadedDruhPhotoNames] = useState<UploadedNames>({ fotka1: '', fotka2: '' });
  const [druhMessage, setDruhMessage] = useState<string | null>(null);

  async function submitDruh(event: FormEvent) {
    event.preventDefault();
    setDruhMessage(null);

    try {
      const currentLabel = druhForm.nazev.trim();
      await saveDruh({
        editingDruhId,
        form: druhForm,
        uploadingPhotos: uploadingDruhPhotos,
        uploadedPhotoNames: uploadedDruhPhotoNames,
      });

      setDruhMessage(editingDruhId ? 'Druh upraven.' : 'Druh vytvoren.');
      void logActivity({
        eventType: editingDruhId ? 'update' : 'create',
        section: 'druhy',
        label: currentLabel,
        entityId: editingDruhId,
      }).catch(() => undefined);
      setEditingDruhId(null);
      setDruhForm({ nazev: '', popis: '', rodId: '' });
      setUploadingDruhPhotos({ fotka1: null, fotka2: null });
      setUploadedDruhPhotoNames({ fotka1: '', fotka2: '' });
      await reload();
    } catch (err) {
      setDruhMessage(err instanceof Error ? err.message : 'Ulozeni druhu selhalo.');
    }
  }

  async function removeDruh(id: number) {
    setDruhMessage(null);

    try {
      await deleteDruh(id);
      void logActivity({ eventType: 'delete', section: 'druhy', label: druhForm.nazev.trim() || null, entityId: id }).catch(() => undefined);

      if (editingDruhId === id) {
        setEditingDruhId(null);
        setDruhForm({ nazev: '', popis: '', rodId: '' });
        setUploadingDruhPhotos({ fotka1: null, fotka2: null });
        setUploadedDruhPhotoNames({ fotka1: '', fotka2: '' });
      }

      setDruhMessage('Druh smazan.');
      await reload();
    } catch (err) {
      setDruhMessage(err instanceof Error ? err.message : 'Smazani druhu selhalo.');
    }
  }

  function resetDruhEditor() {
    setEditingDruhId(null);
    setDruhForm({ nazev: '', popis: '', rodId: '' });
    setUploadingDruhPhotos({ fotka1: null, fotka2: null });
    setUploadedDruhPhotoNames({ fotka1: '', fotka2: '' });
  }

  return {
    editingDruhId,
    setEditingDruhId,
    druhForm,
    setDruhForm,
    uploadingDruhPhotos,
    setUploadingDruhPhotos,
    uploadedDruhPhotoNames,
    setUploadedDruhPhotoNames,
    druhMessage,
    setDruhMessage,
    submitDruh,
    removeDruh,
    resetDruhEditor,
  };
}
