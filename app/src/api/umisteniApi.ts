import type { Umisteni } from '../types/app';
import { apiSend } from './http';

export async function createUmisteni(payload: { nazev: string; parentId: number | null }) {
  return apiSend<Umisteni>('/api/umisteni', 'POST', payload);
}
