import type { Rostlina } from '../types/app';
import { apiSend } from './http';

export type NewPlantPayload = {
  vlastniJmeno: string;
  druhId: string;
  mediumId: string;
  umisteniId: string;
  aktualniZdravi: string;
};

export async function createRostlina(form: NewPlantPayload) {
  return apiSend<Rostlina>('/api/rostliny', 'POST', {
    vlastniJmeno: form.vlastniJmeno,
    druhId: Number(form.druhId),
    mediumId: form.mediumId ? Number(form.mediumId) : null,
    umisteniId: form.umisteniId ? Number(form.umisteniId) : null,
    aktualniZdravi: Number(form.aktualniZdravi),
  });
}

export async function updateRostlina(id: number, form: NewPlantPayload) {
  return apiSend<Rostlina>(`/api/rostliny/${id}`, 'PUT', {
    vlastniJmeno: form.vlastniJmeno,
    druhId: Number(form.druhId),
    mediumId: form.mediumId ? Number(form.mediumId) : null,
    umisteniId: form.umisteniId ? Number(form.umisteniId) : null,
    aktualniZdravi: Number(form.aktualniZdravi),
  });
}
