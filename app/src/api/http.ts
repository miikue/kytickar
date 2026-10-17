import { Capacitor } from '@capacitor/core';
import { API_BASE_URL } from '../config';
import { localDb } from '../services/localDb';

export const DEFAULT_PLANT_ICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='48' height='48'><rect width='48' height='48' rx='12' fill='%23e8f5e9'/><path d='M24 10c0 0-10 6-10 16 0 7 5 11 10 11s10-4 10-11c0-10-10-16-10-16zm0 24c-3.5 0-7-2.5-7-8 0-6 7-11 7-11s7 5 7 11c0 5.5-3.5 8-7 8z' fill='%232e7d32'/><path d='M24 16v18' stroke='%232e7d32' stroke-width='2' stroke-linecap='round'/></svg>";

const photoUrlCache = new Map<string, string>();

export function setPhotoUrlCache(fileName: string, dataUrl: string): void {
  const clean = fileName.replace(/^(\/?species\/|\/?fotky\/)/, '');
  photoUrlCache.set(clean, dataUrl);
}

export function clearPhotoUrlCache(): void {
  photoUrlCache.clear();
}

if (typeof window !== 'undefined') {
  window.addEventListener('kytickar-db-reset', () => {
    photoUrlCache.clear();
  });
  window.addEventListener('kytickar-photo-saved', ((e: CustomEvent<{ fileName: string; dataUrl: string }>) => {
    if (e.detail?.fileName && e.detail?.dataUrl) {
      setPhotoUrlCache(e.detail.fileName, e.detail.dataUrl);
    }
  }) as EventListener);
}

export function getFileUrl(fileName: string | null | undefined): string {
  if (!fileName) return '';
  if (fileName.startsWith('data:') || fileName.startsWith('blob:') || fileName.startsWith('http')) {
    return fileName;
  }
  const cleanName = fileName.replace(/^(\/?species\/|\/?fotky\/)/, '');

  const cached = photoUrlCache.get(cleanName);
  if (cached) return cached;

  localDb.getPhoto(cleanName).then((dataUrl) => {
    if (dataUrl) {
      photoUrlCache.set(cleanName, dataUrl);
      window.dispatchEvent(new CustomEvent('kytickar-photo-loaded', { detail: cleanName }));
    }
  });

  if (fileName.startsWith('/')) {
    return fileName;
  }
  if (API_BASE_URL) {
    return `${API_BASE_URL}/api/files/${cleanName}`;
  }
  return `/species/${cleanName}`;
}

const isStandaloneMode = Capacitor.isNativePlatform() || !API_BASE_URL;

async function handleLocalRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T | null> {
  const url = path.split('?')[0];

  // 1. Rostliny
  if (url === '/api/rostliny') {
    if (method === 'GET') return (await localDb.getRostliny()) as unknown as T;
    if (method === 'POST') return (await localDb.createRostlina(body)) as unknown as T;
  }
  const matchRostlinaId = url.match(/^\/api\/rostliny\/(\d+)$/);
  if (matchRostlinaId) {
    const id = Number(matchRostlinaId[1]);
    if (method === 'PUT') return (await localDb.updateRostlina(id, body)) as unknown as T;
    if (method === 'DELETE') return (await localDb.deleteRostlina(id)) as unknown as T;
  }
  if (url === '/api/rostliny/nejdelsi-od-zaliti' && method === 'GET') {
    return (await localDb.getNejdelsiOdZaliti()) as unknown as T;
  }

  // 2. Druhy
  if (url === '/api/druhy') {
    if (method === 'GET') return (await localDb.getDruhy()) as unknown as T;
    if (method === 'POST') return (await localDb.createDruh(body)) as unknown as T;
  }
  const matchDruhId = url.match(/^\/api\/druhy\/(\d+)$/);
  if (matchDruhId) {
    const id = Number(matchDruhId[1]);
    if (method === 'PUT') return (await localDb.updateDruh(id, body)) as unknown as T;
    if (method === 'DELETE') return (await localDb.deleteDruh(id)) as unknown as T;
  }

  // 3. Rody
  if (url === '/api/rody') {
    if (method === 'GET') return (await localDb.getRody()) as unknown as T;
    if (method === 'POST') return (await localDb.createRod(body)) as unknown as T;
  }
  const matchRodId = url.match(/^\/api\/rody\/(\d+)$/);
  if (matchRodId) {
    const id = Number(matchRodId[1]);
    if (method === 'PUT') return (await localDb.updateRod(id, body)) as unknown as T;
    if (method === 'DELETE') return (await localDb.deleteRod(id)) as unknown as T;
  }

  // 4. Media
  if (url === '/api/media') {
    if (method === 'GET') return (await localDb.getMedia()) as unknown as T;
    if (method === 'POST') return (await localDb.createMedium(body)) as unknown as T;
  }
  const matchMediaId = url.match(/^\/api\/media\/(\d+)$/);
  if (matchMediaId) {
    const id = Number(matchMediaId[1]);
    if (method === 'PUT') return (await localDb.updateMedium(id, body)) as unknown as T;
    if (method === 'DELETE') return (await localDb.deleteMedium(id)) as unknown as T;
  }

  // 5. Umisteni
  if (url === '/api/umisteni') {
    if (method === 'GET') return (await localDb.getUmisteni()) as unknown as T;
    if (method === 'POST') return (await localDb.createUmisteni(body)) as unknown as T;
  }
  const matchUmisteniId = url.match(/^\/api\/umisteni\/(\d+)$/);
  if (matchUmisteniId) {
    const id = Number(matchUmisteniId[1]);
    if (method === 'PUT') return (await localDb.updateUmisteni(id, body)) as unknown as T;
    if (method === 'DELETE') return (await localDb.deleteUmisteni(id)) as unknown as T;
  }

  // 6. Typy akci
  if (url === '/api/typy-akci') {
    if (method === 'GET') return (await localDb.getTypyAkci()) as unknown as T;
    if (method === 'POST') return (await localDb.createTypAkce(body)) as unknown as T;
  }
  const matchTypAkceId = url.match(/^\/api\/typy-akci\/(\d+)$/);
  if (matchTypAkceId) {
    const id = Number(matchTypAkceId[1]);
    if (method === 'PUT') return (await localDb.updateTypAkce(id, body)) as unknown as T;
    if (method === 'DELETE') return (await localDb.deleteTypAkce(id)) as unknown as T;
  }

  // 7. Galerie fotky
  const matchGalerieRostlinaId = url.match(/^\/api\/galerie-fotky\/(\d+)$/);
  if (matchGalerieRostlinaId && method === 'GET') {
    const rostlinaId = Number(matchGalerieRostlinaId[1]);
    return (await localDb.getGalerieFotky(rostlinaId)) as unknown as T;
  }
  if (url === '/api/galerie-fotky') {
    if (method === 'POST') return (await localDb.createGalerieFotka(body)) as unknown as T;
  }
  const matchGalerieId = url.match(/^\/api\/galerie-fotky\/(\d+)$/);
  if (matchGalerieId && method === 'DELETE') {
    const id = Number(matchGalerieId[1]);
    return (await localDb.deleteGalerieFotka(id)) as unknown as T;
  }

  // 8. Historie pece
  const matchHistorieRostlinaId = url.match(/^\/api\/historie-pece\/(\d+)$/);
  if (matchHistorieRostlinaId && method === 'GET') {
    const rostlinaId = Number(matchHistorieRostlinaId[1]);
    return (await localDb.getHistoriePece(rostlinaId)) as unknown as T;
  }
  if (url === '/api/historie-pece') {
    if (method === 'POST') return (await localDb.createHistoriePece(body)) as unknown as T;
  }
  const matchHistorieId = url.match(/^\/api\/historie-pece\/(\d+)$/);
  if (matchHistorieId && method === 'DELETE') {
    const id = Number(matchHistorieId[1]);
    return (await localDb.deleteHistoriePece(id)) as unknown as T;
  }

  // 9. Odlozene akce
  if (url === '/api/odlozene-akce/odlozit-zaliti' && method === 'POST') {
    const { rostlinaId, dny } = (body as any) || {};
    return (await localDb.odlozitZaliti(rostlinaId, dny)) as unknown as T;
  }

  // 10. Activity log
  if (url === '/api/activity-log' && method === 'POST') {
    return (await localDb.logActivity(body)) as unknown as T;
  }

  // 11. Dev overview & table
  if (url === '/api/dev/overview' && method === 'GET') {
    return (await localDb.getDevOverview()) as unknown as T;
  }
  const matchDevTable = url.match(/^\/api\/dev\/table\/(.+)$/);
  if (matchDevTable && method === 'GET') {
    const tableName = matchDevTable[1] as any;
    return (await localDb.getDevTable(tableName)) as unknown as T;
  }

  throw new Error(`Neznamy offline endpoint: ${method} ${path}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  if (isStandaloneMode) {
    const res = await handleLocalRequest<T>(path, 'GET');
    return res as T;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${path}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    // Fallback na localDb pokud je server nedostupny
    console.warn(`Server nedostupny (${path}), pouzivam offline data:`, error);
    const res = await handleLocalRequest<T>(path, 'GET');
    return res as T;
  }
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T | null> {
  if (isStandaloneMode) {
    return await handleLocalRequest<T>(path, method, body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message || `HTTP ${response.status} for ${path}`);
    }

    if (response.status === 204) {
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Server nedostupny (${method} ${path}), pouzivam offline data:`, error);
    return await handleLocalRequest<T>(path, method, body);
  }
}

export async function uploadFile(file: File): Promise<string> {
  if (isStandaloneMode) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const ext = file.name.split('.').pop() || 'jpg';
          const fileName = `foto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
          await localDb.savePhoto(fileName, dataUrl);
          photoUrlCache.set(fileName, dataUrl);
          resolve(fileName);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Chyba pri cteni souboru.'));
      reader.readAsDataURL(file);
    });
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload souboru selhal.');
    }

    const payload = (await response.json()) as { fileName: string };
    return payload.fileName;
  } catch (err) {
    console.warn('Upload na server selhal, ukladam lokalne do telefonu:', err);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const ext = file.name.split('.').pop() || 'jpg';
          const fileName = `foto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
          await localDb.savePhoto(fileName, dataUrl);
          photoUrlCache.set(fileName, dataUrl);
          resolve(fileName);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error('Chyba pri cteni souboru.'));
      reader.readAsDataURL(file);
    });
  }
}
