import { localDb } from '../services/localDb';

export const DEFAULT_PLANT_ICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' width='48' height='48'><rect width='48' height='48' rx='12' fill='%23e8f5e9'/><path d='M24 10c0 0-10 6-10 16 0 7 5 11 10 11s10-4 10-11c0-10-10-16-10-16zm0 24c-3.5 0-7-2.5-7-8 0-6 7-11 7-11s7 5 7 11c0 5.5-3.5 8-7 8z' fill='%232e7d32'/><path d='M24 16v18' stroke='%232e7d32' stroke-width='2' stroke-linecap='round'/></svg>";

const photoUrlCache = new Map<string, string>();
const pendingLookups = new Set<string>();

export function setPhotoUrlCache(fileName: string, dataUrl: string): void {
  const clean = fileName.replace(/^(\/?species\/|\/?fotky\/)/, '');
  photoUrlCache.set(clean, dataUrl);
  pendingLookups.delete(clean);
}

export function removePhotoUrlCache(fileName: string): void {
  const clean = fileName.replace(/^(\/?species\/|\/?fotky\/)/, '');
  photoUrlCache.delete(clean);
  pendingLookups.delete(clean);
}

export function clearPhotoUrlCache(): void {
  photoUrlCache.clear();
  pendingLookups.clear();
}

if (typeof window !== 'undefined') {
  window.addEventListener('kytickar-db-reset', () => {
    clearPhotoUrlCache();
  });
  window.addEventListener('kytickar-photo-saved', ((e: CustomEvent<{ fileName: string; dataUrl: string }>) => {
    if (e.detail?.fileName && e.detail?.dataUrl) {
      setPhotoUrlCache(e.detail.fileName, e.detail.dataUrl);
    }
  }) as EventListener);
  window.addEventListener('kytickar-photo-deleted', ((e: CustomEvent<string>) => {
    if (e.detail) {
      removePhotoUrlCache(e.detail);
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

  const fallbackUrl = fileName.startsWith('/') ? fileName : `/species/${cleanName}`;

  if (pendingLookups.has(cleanName)) {
    return fallbackUrl;
  }

  pendingLookups.add(cleanName);
  localDb
    .getPhoto(cleanName)
    .then((dataUrl) => {
      pendingLookups.delete(cleanName);
      if (dataUrl) {
        photoUrlCache.set(cleanName, dataUrl);
        window.dispatchEvent(new CustomEvent('kytickar-photo-loaded', { detail: cleanName }));
      } else {
        // Obrázek není v IndexedDB (jedná se o statickou fotografii druhu z bundle).
        // Zapamatujeme si fallback URL, abychom při dalších renderech neprováděli zbytečné čtení z DB.
        photoUrlCache.set(cleanName, fallbackUrl);
      }
    })
    .catch(() => {
      pendingLookups.delete(cleanName);
      photoUrlCache.set(cleanName, fallbackUrl);
    });

  return fallbackUrl;
}

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

  throw new Error(`Neznámý offline endpoint: ${method} ${path}`);
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await handleLocalRequest<T>(path, 'GET');
  return res as T;
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T | null> {
  return await handleLocalRequest<T>(path, method, body);
}

export async function uploadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        try {
          const maxWidth = 1440;
          let { width, height } = img;
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          let dataUrl: string;
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          } else {
            dataUrl = reader.result as string;
          }

          const fileName = `foto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
          await localDb.savePhoto(fileName, dataUrl);
          photoUrlCache.set(fileName, dataUrl);
          resolve(fileName);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = async () => {
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
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Chyba při čtení souboru.'));
    reader.readAsDataURL(file);
  });
}
