import type { Rod } from '../types/app';
import { apiSend } from './http';

export async function createRod(payload: { nazev: string; popis: string | null }) {
  return apiSend<Rod>('/api/rody', 'POST', payload);
}

export async function updateRod(id: number, payload: { nazev: string; popis: string | null }) {
  return apiSend<Rod>(`/api/rody/${id}`, 'PUT', payload);
}

export async function deleteRod(id: number) {
  return apiSend<null>(`/api/rody/${id}`, 'DELETE');
}
