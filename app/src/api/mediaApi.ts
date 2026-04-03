import type { Medium } from '../types/app';
import { apiSend } from './http';

export async function createMedium(payload: { nazev: string; popis: string | null }) {
  return apiSend<Medium>('/api/media', 'POST', payload);
}

export async function updateMedium(id: number, payload: { nazev: string; popis: string | null }) {
  return apiSend<Medium>(`/api/media/${id}`, 'PUT', payload);
}

export async function deleteMedium(id: number) {
  return apiSend<null>(`/api/media/${id}`, 'DELETE');
}
