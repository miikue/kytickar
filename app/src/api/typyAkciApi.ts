import type { TypAkce } from '../types/app';
import { apiSend } from './http';

export async function createTypAkce(payload: { typAkce: string }) {
  return apiSend<TypAkce>('/api/typy-akci', 'POST', payload);
}

export async function updateTypAkce(id: number, payload: { typAkce: string }) {
  return apiSend<TypAkce>(`/api/typy-akci/${id}`, 'PUT', payload);
}

export async function deleteTypAkce(id: number) {
  return apiSend<null>(`/api/typy-akci/${id}`, 'DELETE');
}