import type { Druh } from '../types/app';
import { apiSend, uploadFile } from './http';

export type DruhPayload = {
  nazev: string;
  popis: string;
  rodId: string;
};

export type DruhPhotos = {
  fotka1: File | null;
  fotka2: File | null;
};

export type UploadedPhotoNames = {
  fotka1: string;
  fotka2: string;
};

export async function saveDruh(params: {
  editingDruhId: number | null;
  form: DruhPayload;
  uploadingPhotos: DruhPhotos;
  uploadedPhotoNames: UploadedPhotoNames;
}) {
  const { editingDruhId, form, uploadingPhotos, uploadedPhotoNames } = params;

  let finalFotka1 = uploadedPhotoNames.fotka1;
  let finalFotka2 = uploadedPhotoNames.fotka2;

  if (uploadingPhotos.fotka1) {
    finalFotka1 = await uploadFile(uploadingPhotos.fotka1);
  }

  if (uploadingPhotos.fotka2) {
    finalFotka2 = await uploadFile(uploadingPhotos.fotka2);
  }

  const payload = {
    nazev: form.nazev,
    popis: form.popis,
    rodId: form.rodId ? Number(form.rodId) : null,
    fotka1Name: finalFotka1 || null,
    fotka2Name: finalFotka2 || null,
  };

  if (editingDruhId) {
    return apiSend<Druh>(`/api/druhy/${editingDruhId}`, 'PUT', payload);
  }

  return apiSend<Druh>('/api/druhy', 'POST', payload);
}

export async function createDruh(payload: { nazev: string; popis: string | null; rodId: number | null }) {
  return apiSend<Druh>('/api/druhy', 'POST', {
    nazev: payload.nazev,
    popis: payload.popis,
    rodId: payload.rodId,
    fotka1Name: null,
    fotka2Name: null,
  });
}

export async function deleteDruh(id: number) {
  return apiSend<null>(`/api/druhy/${id}`, 'DELETE');
}
