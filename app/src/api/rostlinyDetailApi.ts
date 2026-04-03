import { apiGet, apiSend } from './http';
import type { GalerieFotka, HistoriePece, RostlinaOdZaliti, TypAkce } from '../types/app';

export async function fetchRostlinaGalerie(rostlinaId: number) {
  return apiGet<GalerieFotka[]>(`/api/galerie-fotky/${rostlinaId}`);
}

export async function fetchRostlinaHistorie(rostlinaId: number) {
  return apiGet<HistoriePece[]>(`/api/historie-pece/${rostlinaId}`);
}

export async function fetchTypyAkci() {
  return apiGet<TypAkce[]>('/api/typy-akci');
}

export async function createHistoriePece(payload: { rostlinaId: number; typAkceId: number; datum?: string | null }) {
  return apiSend<HistoriePece>('/api/historie-pece', 'POST', payload);
}

export async function deleteHistoriePece(id: number) {
  return apiSend<null>(`/api/historie-pece/${id}`, 'DELETE');
}

export async function fetchRostlinyNejdelsiOdZaliti() {
  return apiGet<RostlinaOdZaliti[]>('/api/rostliny/nejdelsi-od-zaliti');
}

export async function odlozitZaliti(rostlinaId: number, dny = 2) {
  return apiSend('/api/odlozene-akce/odlozit-zaliti', 'POST', { rostlinaId, dny });
}
