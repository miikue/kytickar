import type { Umisteni } from '../types/app';
import { apiSend } from './http';

export async function createUmisteni(payload: { nazev: string; parentId: number | null }) {
  return apiSend<Umisteni>('/api/umisteni', 'POST', payload);
}

export async function updateUmisteni(id: number, payload: { nazev: string; parentId: number | null }) {
  return apiSend<Umisteni>(`/api/umisteni/${id}`, 'PUT', payload);
}

export async function deleteUmisteni(id: number) {
  return apiSend<null>(`/api/umisteni/${id}`, 'DELETE');
}
