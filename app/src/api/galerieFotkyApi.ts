import { apiSend } from './http';

export async function createGalerieFotka(payload: { rostlinaId: number; fotkaName: string; poznamka: string | null }) {
  return apiSend('/api/galerie-fotky', 'POST', payload);
}

export async function deleteGalerieFotka(id: number) {
  return apiSend<null>(`/api/galerie-fotky/${id}`, 'DELETE');
}
