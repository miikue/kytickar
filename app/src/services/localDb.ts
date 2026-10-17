import type {
  ActivityLog,
  DevOverview,
  DevTableName,
  DevTableResponse,
  Druh,
  GalerieFotka,
  HistoriePece,
  Medium,
  Rod,
  Rostlina,
  RostlinaOdZaliti,
  TypAkce,
  Umisteni,
} from '../types/app';
import defaultData from '../data/defaultData.json';

const DB_NAME = 'kytickar_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB neni podporovano v tomto prostredi.'));
      return;
    }

    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('media')) {
        db.createObjectStore('media', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('rody')) {
        db.createObjectStore('rody', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('umisteni')) {
        db.createObjectStore('umisteni', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('typyAkci')) {
        db.createObjectStore('typyAkci', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('druhy')) {
        db.createObjectStore('druhy', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('rostliny')) {
        db.createObjectStore('rostliny', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('galerieFotky')) {
        db.createObjectStore('galerieFotky', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('historiePece')) {
        db.createObjectStore('historiePece', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('odlozeneAkce')) {
        db.createObjectStore('odlozeneAkce', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('activityLog')) {
        db.createObjectStore('activityLog', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'fileName' });
      }
    };

    request.onsuccess = async (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      try {
        await seedDbIfNeeded(db);
        await ensureDemoPhotoFile(db);
        await ensureTypyAkciDefaults(db);
        await pruneActivityLogIfNeeded(db);
        await cleanupOrphanedPhotos(db);
        resolve(db);
      } catch (err) {
        console.error('Chyba při inicializaci/seedování databáze:', err);
        dbPromise = null;
        reject(err instanceof Error ? err : new Error('Inicializace databáze selhala.'));
      }
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Otevření IndexedDB selhalo.'));
    };

    request.onblocked = () => {
      dbPromise = null;
      reject(new Error('IndexedDB je blokována jiným procesem nebo oknem.'));
    };
  });

  return dbPromise;
}

function getAllFromStore<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

function getFromStore<T>(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
}

function addToStore<T>(db: IDBDatabase, storeName: string, value: T): Promise<number> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(value);
    request.onsuccess = () => resolve(Number(request.result));
    request.onerror = () => reject(request.error);
  });
}

function putToStore<T>(db: IDBDatabase, storeName: string, value: T): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(value);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteFromStore(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function notifyCareUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kytickar-care-updated'));
  }
}

// -------------------------------------------------------------
// SEED & DATA IMPORT HELPER (ČISTÝ ŠTÍT)
// -------------------------------------------------------------
export const ALL_DATA_STORES = [
  'media',
  'rody',
  'umisteni',
  'typyAkci',
  'druhy',
  'rostliny',
  'galerieFotky',
  'historiePece',
  'odlozeneAkce',
  'activityLog',
];

async function clearStore(db: IDBDatabase, storeName: string): Promise<void> {
  if (!db.objectStoreNames.contains(storeName)) return;
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllStores(db: IDBDatabase, clearPhotos = true): Promise<void> {
  for (const name of ALL_DATA_STORES) {
    await clearStore(db, name);
  }
  if (clearPhotos) {
    await clearStore(db, 'photos');
  }
}

async function applyDataToStores(db: IDBDatabase, data: any): Promise<void> {
  for (const name of ALL_DATA_STORES) {
    const items = data[name];
    if (Array.isArray(items) && items.length > 0) {
      const tx = db.transaction(name, 'readwrite');
      const store = tx.objectStore(name);
      for (const item of items) {
        store.put(item);
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error(`Transakce pro ${name} byla přerušena.`));
      });
    }
  }
}

async function seedDbIfNeeded(db: IDBDatabase): Promise<void> {
  const mediaCount = await new Promise<number>((res) => {
    const tx = db.transaction('media', 'readonly');
    const req = tx.objectStore('media').count();
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(0);
  });

  if (mediaCount > 0) return;

  await applyDataToStores(db, (defaultData as any).data);
  await ensureDemoPhotoFile(db);
}

export async function ensureDemoPhotoFile(db: IDBDatabase): Promise<void> {
  try {
    const existingPhoto = await getFromStore<{ fileName: string; dataUrl: string }>(db, 'photos', 'image.png');
    if (!existingPhoto) {
      try {
        const resp = await fetch('/image.png');
        if (resp.ok) {
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((res, rej) => {
            reader.onloadend = () => res(reader.result as string);
            reader.onerror = () => rej(reader.error);
            reader.readAsDataURL(blob);
          });
          if (dataUrl) {
            await putToStore(db, 'photos', { fileName: 'image.png', dataUrl });
          }
        }
      } catch (fetchErr) {
        console.warn('Nepodařilo se přednačíst /image.png do IndexedDB:', fetchErr);
      }
    }
  } catch (err) {
    console.warn('ensureDemoPhotoFile warning:', err);
  }
}

export function getDefaultActionIcon(name: string): string {
  const n = (name || '').toLowerCase();
  if (n.includes('zal')) return '💧';
  if (n.includes('hnoj')) return '🌱';
  if (n.includes('pres')) return '🪴';
  if (n.includes('ros')) return '💨';
  if (n.includes('skud') || n.includes('kontr')) return '🔍';
  if (n.includes('otir') || n.includes('prach') || n.includes('cist')) return '🧽';
  if (n.includes('str')) return '✂️';
  if (n.includes('osetr') || n.includes('lecb')) return '🧪';
  if (n.includes('slun') || n.includes('svet')) return '☀️';
  if (n.includes('kvet')) return '🌸';
  return '⚡';
}

export function getDefaultIntervalDays(name: string): number {
  const n = (name || '').toLowerCase();
  if (n.includes('zal')) return 7;
  if (n.includes('hnoj')) return 14;
  if (n.includes('pres')) return 365;
  if (n.includes('ros')) return 2;
  if (n.includes('skud') || n.includes('kontr')) return 14;
  if (n.includes('otir') || n.includes('prach') || n.includes('cist')) return 21;
  if (n.includes('str')) return 60;
  return 7;
}

export function getDefaultSnoozeDays(name: string): number {
  const n = (name || '').toLowerCase();
  if (n.includes('ros')) return 1;
  if (n.includes('zal')) return 2;
  if (n.includes('hnoj')) return 3;
  if (n.includes('pres')) return 14;
  if (n.includes('str')) return 7;
  return 2;
}

export function isWateringAction(typ?: { typAkce?: string; isWatering?: boolean | null } | null): boolean {
  if (!typ) return false;
  if (typeof typ.isWatering === 'boolean') return typ.isWatering;
  return (typ.typAkce || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .includes('zal');
}

async function ensureTypyAkciDefaults(db: IDBDatabase): Promise<void> {
  try {
    const list = await getAllFromStore<TypAkce>(db, 'typyAkci');
    for (const item of list) {
      let needsUpdate = false;
      const updated = { ...item };
      if (!updated.ikona) {
        updated.ikona = getDefaultActionIcon(updated.typAkce);
        needsUpdate = true;
      }
      if (updated.intervalDny === undefined || updated.intervalDny === null) {
        updated.intervalDny = getDefaultIntervalDays(updated.typAkce);
        needsUpdate = true;
      }
      if (updated.odlozitDny === undefined || updated.odlozitDny === null) {
        updated.odlozitDny = getDefaultSnoozeDays(updated.typAkce);
        needsUpdate = true;
      }
      if (updated.isWatering === undefined || updated.isWatering === null) {
        updated.isWatering = isWateringAction(updated);
        needsUpdate = true;
      }
      if (needsUpdate) {
        await putToStore(db, 'typyAkci', updated);
      }
    }
  } catch (err) {
    console.warn('ensureTypyAkciDefaults warning:', err);
  }
}

const MAX_ACTIVITY_LOG_ENTRIES = 300;

async function pruneActivityLogIfNeeded(db: IDBDatabase): Promise<void> {
  try {
    const allLogs = await getAllFromStore<ActivityLog>(db, 'activityLog');
    if (allLogs.length > MAX_ACTIVITY_LOG_ENTRIES) {
      const toDeleteCount = allLogs.length - MAX_ACTIVITY_LOG_ENTRIES;
      const oldestLogs = allLogs.slice(0, toDeleteCount);
      for (const log of oldestLogs) {
        await deleteFromStore(db, 'activityLog', log.id);
      }
    }
  } catch (err) {
    console.warn('pruneActivityLogIfNeeded warning:', err);
  }
}

async function cleanupOrphanedPhotos(db: IDBDatabase): Promise<void> {
  try {
    const [photos, galerie, druhy] = await Promise.all([
      getAllFromStore<{ fileName: string; dataUrl: string }>(db, 'photos'),
      getAllFromStore<GalerieFotka>(db, 'galerieFotky'),
      getAllFromStore<Druh>(db, 'druhy'),
    ]);

    const usedFileNames = new Set<string>();
    usedFileNames.add('image.png');

    for (const g of galerie) {
      if (g.fotkaName) {
        usedFileNames.add(g.fotkaName);
        usedFileNames.add(g.fotkaName.replace(/^(\/?species\/|\/?fotky\/)/, ''));
      }
    }
    for (const d of druhy) {
      if (d.fotka1Name) {
        usedFileNames.add(d.fotka1Name);
        usedFileNames.add(d.fotka1Name.replace(/^(\/?species\/|\/?fotky\/)/, ''));
      }
      if (d.fotka2Name) {
        usedFileNames.add(d.fotka2Name);
        usedFileNames.add(d.fotka2Name.replace(/^(\/?species\/|\/?fotky\/)/, ''));
      }
    }

    for (const p of photos) {
      const clean = p.fileName.replace(/^(\/?species\/|\/?fotky\/)/, '');
      if (!usedFileNames.has(p.fileName) && !usedFileNames.has(clean)) {
        await deleteFromStore(db, 'photos', p.fileName);
      }
    }
  } catch (err) {
    console.warn('cleanupOrphanedPhotos warning:', err);
  }
}

async function deletePhotoIfOrphaned(db: IDBDatabase, fileName: string): Promise<void> {
  if (!fileName || fileName.startsWith('/') || fileName.startsWith('http') || fileName.startsWith('data:')) {
    return;
  }
  const cleanName = fileName.replace(/^(\/?species\/|\/?fotky\/)/, '');

  const [galerie, druhy] = await Promise.all([
    getAllFromStore<GalerieFotka>(db, 'galerieFotky'),
    getAllFromStore<Druh>(db, 'druhy'),
  ]);

  const usedInGalerie = galerie.some(
    (g) => g.fotkaName && g.fotkaName.replace(/^(\/?species\/|\/?fotky\/)/, '') === cleanName,
  );
  const usedInDruhy = druhy.some(
    (d) =>
      (d.fotka1Name && d.fotka1Name.replace(/^(\/?species\/|\/?fotky\/)/, '') === cleanName) ||
      (d.fotka2Name && d.fotka2Name.replace(/^(\/?species\/|\/?fotky\/)/, '') === cleanName),
  );

  if (!usedInGalerie && !usedInDruhy) {
    await deleteFromStore(db, 'photos', cleanName);
    if (fileName !== cleanName) {
      await deleteFromStore(db, 'photos', fileName);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kytickar-photo-deleted', { detail: cleanName }));
      if (fileName !== cleanName) {
        window.dispatchEvent(new CustomEvent('kytickar-photo-deleted', { detail: fileName }));
      }
    }
  }
}

function validateBackupData(data: any): void {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Neplatná data zálohy: soubor neobsahuje platný JSON objekt s daty.');
  }

  const hasKnownStore = ALL_DATA_STORES.some((name) => Array.isArray(data[name]));
  if (!hasKnownStore) {
    throw new Error('Neplatný formát zálohy: soubor neobsahuje žádné platné tabulky Kytičkáře (rostliny, druhy apod.).');
  }

  for (const name of ALL_DATA_STORES) {
    if (data[name] !== undefined && data[name] !== null && !Array.isArray(data[name])) {
      throw new Error(`Poškozená data zálohy: oddíl "${name}" musí být seznam (pole).`);
    }
  }

  if (Array.isArray(data.rostliny)) {
    for (let i = 0; i < data.rostliny.length; i++) {
      const item = data.rostliny[i];
      if (!item || typeof item !== 'object') {
        throw new Error(`Poškozená data zálohy: neplatná položka v tabulce rostliny (index ${i}).`);
      }
    }
  }
}

// -------------------------------------------------------------
// LOCAL DB API IMPLEMENTATION
// -------------------------------------------------------------
export const localDb = {
  async getRostliny(): Promise<Rostlina[]> {
    const db = await openDb();
    const [rawPlants, druhy, rody, media, umisteni, fotky] = await Promise.all([
      getAllFromStore<any>(db, 'rostliny'),
      getAllFromStore<Druh>(db, 'druhy'),
      getAllFromStore<Rod>(db, 'rody'),
      getAllFromStore<Medium>(db, 'media'),
      getAllFromStore<Umisteni>(db, 'umisteni'),
      getAllFromStore<GalerieFotka>(db, 'galerieFotky'),
    ]);

    const rodyMap = new Map(rody.map(r => [r.id, r]));
    const druhyMap = new Map(druhy.map(d => [d.id, { ...d, rod: d.rodId ? rodyMap.get(d.rodId) || null : null }]));
    const mediaMap = new Map(media.map(m => [m.id, m]));
    const umisteniMap = new Map(umisteni.map(u => [u.id, u]));

    const result: Rostlina[] = rawPlants.map((plant) => {
      const plantPhotos = fotky
        .filter(f => f.rostlinaId === plant.id)
        .sort((a, b) => new Date(b.datumPorizeni).getTime() - new Date(a.datumPorizeni).getTime());

      return {
        id: plant.id,
        vlastniJmeno: plant.vlastniJmeno,
        aktualniZdravi: plant.aktualniZdravi,
        datumPorizeni: plant.datumPorizeni || new Date().toISOString(),
        druh: druhyMap.get(plant.druhId) || { id: plant.druhId, nazev: 'Neznámý druh', popis: null, rodId: null, fotka1Name: null, fotka2Name: null },
        medium: plant.mediumId ? mediaMap.get(plant.mediumId) || null : null,
        umisteni: plant.umisteniId ? umisteniMap.get(plant.umisteniId) || null : null,
        galerieFotky: plantPhotos.slice(0, 1),
      };
    });

    return result.sort((a, b) => b.id - a.id);
  },

  async createRostlina(payload: any): Promise<Rostlina> {
    const db = await openDb();
    const newId = await addToStore(db, 'rostliny', {
      vlastniJmeno: payload.vlastniJmeno,
      druhId: Number(payload.druhId),
      mediumId: payload.mediumId ? Number(payload.mediumId) : null,
      umisteniId: payload.umisteniId ? Number(payload.umisteniId) : null,
      aktualniZdravi: payload.aktualniZdravi !== undefined ? Number(payload.aktualniZdravi) : 5,
      datumPorizeni: new Date().toISOString(),
    });

    const list = await this.getRostliny();
    notifyCareUpdated();
    return list.find(r => r.id === newId)!;
  },

  async updateRostlina(id: number, payload: any): Promise<Rostlina> {
    const db = await openDb();
    const existing = await getFromStore<any>(db, 'rostliny', id);
    if (!existing) throw new Error('Rostlina nenalezena');

    const updated = {
      ...existing,
      vlastniJmeno: payload.vlastniJmeno ?? existing.vlastniJmeno,
      druhId: payload.druhId ? Number(payload.druhId) : existing.druhId,
      mediumId: payload.mediumId !== undefined ? (payload.mediumId ? Number(payload.mediumId) : null) : existing.mediumId,
      umisteniId: payload.umisteniId !== undefined ? (payload.umisteniId ? Number(payload.umisteniId) : null) : existing.umisteniId,
      aktualniZdravi: payload.aktualniZdravi !== undefined ? Number(payload.aktualniZdravi) : existing.aktualniZdravi,
    };

    await putToStore(db, 'rostliny', updated);
    const list = await this.getRostliny();
    notifyCareUpdated();
    return list.find(r => r.id === id)!;
  },

  async deleteRostlina(id: number): Promise<null> {
    const db = await openDb();
    await deleteFromStore(db, 'rostliny', id);

    // 1. Smazat odložené akce této rostliny
    const odlozene = await getAllFromStore<any>(db, 'odlozeneAkce');
    for (const o of odlozene.filter(o => o.rostlinaId === id)) {
      await deleteFromStore(db, 'odlozeneAkce', o.id);
    }

    // 2. Smazat historii péče této rostliny
    const historie = await getAllFromStore<HistoriePece>(db, 'historiePece');
    for (const h of historie.filter(h => h.rostlinaId === id)) {
      await deleteFromStore(db, 'historiePece', h.id);
    }

    // 3. Smazat fotky z galerie a osiřelá binární data z 'photos'
    const fotky = await getAllFromStore<GalerieFotka>(db, 'galerieFotky');
    const plantPhotos = fotky.filter(f => f.rostlinaId === id);
    for (const f of plantPhotos) {
      await deleteFromStore(db, 'galerieFotky', f.id);
    }
    for (const f of plantPhotos) {
      if (f.fotkaName) {
        await deletePhotoIfOrphaned(db, f.fotkaName);
      }
    }

    notifyCareUpdated();
    return null;
  },

  async getDruhy(): Promise<Druh[]> {
    const db = await openDb();
    const [druhy, rody] = await Promise.all([
      getAllFromStore<Druh>(db, 'druhy'),
      getAllFromStore<Rod>(db, 'rody'),
    ]);
    const rodyMap = new Map(rody.map(r => [r.id, r]));
    return druhy
      .map(d => ({ ...d, rod: d.rodId ? rodyMap.get(d.rodId) || null : null }))
      .sort((a, b) => a.nazev.localeCompare(b.nazev));
  },

  async createDruh(payload: any): Promise<Druh> {
    const db = await openDb();
    const id = await addToStore(db, 'druhy', {
      nazev: String(payload.nazev),
      popis: payload.popis ? String(payload.popis) : null,
      rodId: payload.rodId ? Number(payload.rodId) : null,
      fotka1Name: payload.fotka1Name ? String(payload.fotka1Name) : null,
      fotka2Name: payload.fotka2Name ? String(payload.fotka2Name) : null,
    });
    const list = await this.getDruhy();
    return list.find(d => d.id === id)!;
  },

  async updateDruh(id: number, payload: any): Promise<Druh> {
    const db = await openDb();
    const existing = await getFromStore<any>(db, 'druhy', id);
    if (!existing) throw new Error('Druh nenalezen');

    const updated = {
      ...existing,
      nazev: payload.nazev ?? existing.nazev,
      popis: payload.popis !== undefined ? payload.popis : existing.popis,
      rodId: payload.rodId !== undefined ? (payload.rodId ? Number(payload.rodId) : null) : existing.rodId,
      fotka1Name: payload.fotka1Name !== undefined ? payload.fotka1Name : existing.fotka1Name,
      fotka2Name: payload.fotka2Name !== undefined ? payload.fotka2Name : existing.fotka2Name,
    };
    await putToStore(db, 'druhy', updated);
    const list = await this.getDruhy();
    return list.find(d => d.id === id)!;
  },

  async deleteDruh(id: number): Promise<null> {
    const db = await openDb();
    const plants = await getAllFromStore<any>(db, 'rostliny');
    const usedCount = plants.filter(p => p.druhId === id).length;
    if (usedCount > 0) {
      throw new Error(`Druh nelze smazat, protože je přiřazen k ${usedCount} ${usedCount === 1 ? 'rostlině' : usedCount < 5 ? 'rostlinám' : 'rostlinám'}. Nejprve u nich změňte druh.`);
    }
    await deleteFromStore(db, 'druhy', id);
    return null;
  },

  async getRody(): Promise<Rod[]> {
    const db = await openDb();
    const rody = await getAllFromStore<Rod>(db, 'rody');
    return rody.sort((a, b) => a.nazev.localeCompare(b.nazev));
  },

  async createRod(payload: any): Promise<Rod> {
    const db = await openDb();
    const id = await addToStore(db, 'rody', {
      nazev: String(payload.nazev),
      popis: payload.popis ? String(payload.popis) : null,
    });
    return (await getFromStore<Rod>(db, 'rody', id))!;
  },

  async updateRod(id: number, payload: any): Promise<Rod> {
    const db = await openDb();
    const existing = await getFromStore<Rod>(db, 'rody', id);
    if (!existing) throw new Error('Rod nenalezen');
    const updated = { ...existing, nazev: payload.nazev ?? existing.nazev, popis: payload.popis !== undefined ? payload.popis : existing.popis };
    await putToStore(db, 'rody', updated);
    return updated;
  },

  async deleteRod(id: number): Promise<null> {
    const db = await openDb();
    const druhy = await getAllFromStore<Druh>(db, 'druhy');
    const usedCount = druhy.filter(d => d.rodId === id).length;
    if (usedCount > 0) {
      throw new Error(`Rod nelze smazat, protože je přiřazen k ${usedCount} ${usedCount === 1 ? 'botanickému druhu' : usedCount < 5 ? 'botanickým druhům' : 'botanickým druhům'}. Nejprve u nich změňte rod.`);
    }
    await deleteFromStore(db, 'rody', id);
    return null;
  },

  async getMedia(): Promise<Medium[]> {
    const db = await openDb();
    const list = await getAllFromStore<Medium>(db, 'media');
    return list.sort((a, b) => a.nazev.localeCompare(b.nazev));
  },

  async createMedium(payload: any): Promise<Medium> {
    const db = await openDb();
    const id = await addToStore(db, 'media', {
      nazev: String(payload.nazev),
      popis: payload.popis ? String(payload.popis) : null,
    });
    return (await getFromStore<Medium>(db, 'media', id))!;
  },

  async updateMedium(id: number, payload: any): Promise<Medium> {
    const db = await openDb();
    const existing = await getFromStore<Medium>(db, 'media', id);
    if (!existing) throw new Error('Medium nenalezeno');
    const updated = { ...existing, nazev: payload.nazev ?? existing.nazev, popis: payload.popis !== undefined ? payload.popis : existing.popis };
    await putToStore(db, 'media', updated);
    return updated;
  },

  async deleteMedium(id: number): Promise<null> {
    const db = await openDb();
    const plants = await getAllFromStore<any>(db, 'rostliny');
    const usedCount = plants.filter(p => p.mediumId === id).length;
    if (usedCount > 0) {
      throw new Error(`Substrát nelze smazat, protože je použit u ${usedCount} ${usedCount === 1 ? 'rostliny' : usedCount < 5 ? 'rostlin' : 'rostlin'}. Nejprve u nich zvolte jiný substrát.`);
    }
    await deleteFromStore(db, 'media', id);
    return null;
  },

  async getUmisteni(): Promise<Umisteni[]> {
    const db = await openDb();
    const list = await getAllFromStore<Umisteni>(db, 'umisteni');
    return list.sort((a, b) => (a.parentId ?? 0) - (b.parentId ?? 0) || a.nazev.localeCompare(b.nazev));
  },

  async createUmisteni(payload: any): Promise<Umisteni> {
    const db = await openDb();
    const id = await addToStore(db, 'umisteni', {
      nazev: String(payload.nazev),
      parentId: payload.parentId ? Number(payload.parentId) : null,
    });
    return (await getFromStore<Umisteni>(db, 'umisteni', id))!;
  },

  async updateUmisteni(id: number, payload: any): Promise<Umisteni> {
    const db = await openDb();
    const existing = await getFromStore<Umisteni>(db, 'umisteni', id);
    if (!existing) throw new Error('Umisteni nenalezeno');
    const updated = {
      ...existing,
      nazev: payload.nazev ?? existing.nazev,
      parentId: payload.parentId !== undefined ? (payload.parentId ? Number(payload.parentId) : null) : existing.parentId,
    };
    await putToStore(db, 'umisteni', updated);
    return updated;
  },

  async deleteUmisteni(id: number): Promise<null> {
    const db = await openDb();
    const [plants, allUmisteni] = await Promise.all([
      getAllFromStore<any>(db, 'rostliny'),
      getAllFromStore<Umisteni>(db, 'umisteni'),
    ]);
    const plantsCount = plants.filter(p => p.umisteniId === id).length;
    const childrenCount = allUmisteni.filter(u => u.parentId === id).length;
    if (plantsCount > 0) {
      throw new Error(`Umístění nelze smazat, protože v něm máte ${plantsCount} ${plantsCount === 1 ? 'rostlinu' : plantsCount < 5 ? 'rostliny' : 'rostlin'}. Nejprve je přesuňte jinam.`);
    }
    if (childrenCount > 0) {
      throw new Error(`Umístění nelze smazat, protože obsahuje ${childrenCount} podřízených umístění. Nejprve je přesuňte nebo smažte.`);
    }
    await deleteFromStore(db, 'umisteni', id);
    return null;
  },

  async getTypyAkci(): Promise<TypAkce[]> {
    const db = await openDb();
    const list = await getAllFromStore<TypAkce>(db, 'typyAkci');
    return list.sort((a, b) => a.typAkce.localeCompare(b.typAkce));
  },

  async createTypAkce(payload: any): Promise<TypAkce> {
    const db = await openDb();
    const name = String(payload.typAkce || '').trim();
    const ikona = payload.ikona ? String(payload.ikona).trim() : getDefaultActionIcon(name);
    const intervalDny = payload.intervalDny !== undefined && payload.intervalDny !== null && payload.intervalDny !== ''
      ? Number(payload.intervalDny)
      : getDefaultIntervalDays(name);
    const odlozitDny = payload.odlozitDny !== undefined && payload.odlozitDny !== null && payload.odlozitDny !== ''
      ? Number(payload.odlozitDny)
      : getDefaultSnoozeDays(name);

    const isWatering = payload.isWatering !== undefined && payload.isWatering !== null
      ? Boolean(payload.isWatering)
      : isWateringAction({ typAkce: name });

    const id = await addToStore(db, 'typyAkci', {
      typAkce: name,
      ikona,
      intervalDny,
      odlozitDny,
      isWatering,
    });
    return (await getFromStore<TypAkce>(db, 'typyAkci', id))!;
  },

  async updateTypAkce(id: number, payload: any): Promise<TypAkce> {
    const db = await openDb();
    const existing = await getFromStore<TypAkce>(db, 'typyAkci', id);
    if (!existing) throw new Error('Typ akce nenalezen');
    const name = payload.typAkce !== undefined ? String(payload.typAkce).trim() : existing.typAkce;
    const ikona = payload.ikona !== undefined
      ? (payload.ikona ? String(payload.ikona).trim() : getDefaultActionIcon(name))
      : (existing.ikona || getDefaultActionIcon(name));
    const intervalDny = payload.intervalDny !== undefined
      ? (payload.intervalDny !== null && payload.intervalDny !== '' ? Number(payload.intervalDny) : null)
      : existing.intervalDny;
    const odlozitDny = payload.odlozitDny !== undefined
      ? (payload.odlozitDny !== null && payload.odlozitDny !== '' ? Number(payload.odlozitDny) : null)
      : existing.odlozitDny;
    const isWatering = payload.isWatering !== undefined && payload.isWatering !== null
      ? Boolean(payload.isWatering)
      : (existing.isWatering !== undefined && existing.isWatering !== null)
      ? existing.isWatering
      : isWateringAction({ typAkce: name });

    const updated = { ...existing, typAkce: name, ikona, intervalDny, odlozitDny, isWatering };
    await putToStore(db, 'typyAkci', updated);
    return updated;
  },

  async deleteTypAkce(id: number): Promise<null> {
    const db = await openDb();
    const historie = await getAllFromStore<HistoriePece>(db, 'historiePece');
    const usedCount = historie.filter(h => h.typAkceId === id).length;
    if (usedCount > 0) {
      throw new Error(`Typ péče nelze smazat, protože je zaznamenán v historii péče (${usedCount} ${usedCount === 1 ? 'záznam' : usedCount < 5 ? 'záznamy' : 'záznamů'}).`);
    }
    await deleteFromStore(db, 'typyAkci', id);
    return null;
  },

  async getGalerieFotky(rostlinaId: number): Promise<GalerieFotka[]> {
    const db = await openDb();
    const list = await getAllFromStore<GalerieFotka>(db, 'galerieFotky');
    return list
      .filter(f => f.rostlinaId === rostlinaId)
      .sort((a, b) => new Date(b.datumPorizeni).getTime() - new Date(a.datumPorizeni).getTime());
  },

  async createGalerieFotka(payload: any): Promise<GalerieFotka> {
    const db = await openDb();
    const id = await addToStore(db, 'galerieFotky', {
      rostlinaId: Number(payload.rostlinaId),
      fotkaName: String(payload.fotkaName),
      poznamka: payload.poznamka ? String(payload.poznamka) : null,
      datumPorizeni: payload.datumPorizeni || new Date().toISOString(),
    });
    return (await getFromStore<GalerieFotka>(db, 'galerieFotky', id))!;
  },

  async deleteGalerieFotka(id: number): Promise<null> {
    const db = await openDb();
    const existing = await getFromStore<GalerieFotka>(db, 'galerieFotky', id);
    await deleteFromStore(db, 'galerieFotky', id);
    if (existing?.fotkaName) {
      await deletePhotoIfOrphaned(db, existing.fotkaName);
    }
    return null;
  },

  async getHistoriePece(rostlinaId: number): Promise<HistoriePece[]> {
    const db = await openDb();
    const [list, typyAkci] = await Promise.all([
      getAllFromStore<HistoriePece>(db, 'historiePece'),
      getAllFromStore<TypAkce>(db, 'typyAkci'),
    ]);
    const typMap = new Map(typyAkci.map(t => [t.id, t]));

    return list
      .filter(h => h.rostlinaId === rostlinaId)
      .map(h => ({
        ...h,
        typAkce: typMap.get(h.typAkceId) || { id: h.typAkceId, typAkce: 'Akce' },
      }))
      .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
  },

  async createHistoriePece(payload: any): Promise<HistoriePece> {
    const db = await openDb();
    const id = await addToStore(db, 'historiePece', {
      rostlinaId: Number(payload.rostlinaId),
      typAkceId: Number(payload.typAkceId),
      datum: payload.datum ? new Date(payload.datum).toISOString() : new Date().toISOString(),
    });
    const typyAkci = await getAllFromStore<TypAkce>(db, 'typyAkci');
    const created = await getFromStore<HistoriePece>(db, 'historiePece', id);
    notifyCareUpdated();
    return {
      ...created!,
      typAkce: typyAkci.find(t => t.id === created!.typAkceId) || { id: created!.typAkceId, typAkce: 'Akce' },
    };
  },

  async deleteHistoriePece(id: number): Promise<null> {
    const db = await openDb();
    await deleteFromStore(db, 'historiePece', id);
    notifyCareUpdated();
    return null;
  },

  async getNejdelsiOdZaliti(): Promise<RostlinaOdZaliti[]> {
    const db = await openDb();
    const [rawPlants, druhy, rody, typyAkci, historie, odlozene] = await Promise.all([
      getAllFromStore<any>(db, 'rostliny'),
      getAllFromStore<Druh>(db, 'druhy'),
      getAllFromStore<Rod>(db, 'rody'),
      getAllFromStore<TypAkce>(db, 'typyAkci'),
      getAllFromStore<HistoriePece>(db, 'historiePece'),
      getAllFromStore<any>(db, 'odlozeneAkce'),
    ]);

    const wateringTypIds = typyAkci
      .filter(item => isWateringAction(item))
      .map(item => item.id);

    const now = new Date();
    const activeOdlozenePlantIds = new Set(
      odlozene
        .filter(o => wateringTypIds.includes(o.typAkceId) && new Date(o.datumPripomenuti) > now)
        .map(o => o.rostlinaId)
    );

    const rodyMap = new Map(rody.map(r => [r.id, r]));
    const druhyMap = new Map(druhy.map(d => [d.id, d]));

    const latestWateringByPlant = new Map<number, string>();
    for (const h of historie) {
      if (wateringTypIds.includes(h.typAkceId)) {
        const curr = latestWateringByPlant.get(h.rostlinaId);
        if (!curr || new Date(h.datum) > new Date(curr)) {
          latestWateringByPlant.set(h.rostlinaId, h.datum);
        }
      }
    }

    const payload: RostlinaOdZaliti[] = rawPlants
      .filter(p => p.aktualniZdravi > 0 && !activeOdlozenePlantIds.has(p.id))
      .map(p => {
        const d = druhyMap.get(p.druhId);
        const rod = d?.rodId ? rodyMap.get(d.rodId) : null;
        const lastWatering = latestWateringByPlant.get(p.id) || null;
        let days: number | null = null;
        if (lastWatering) {
          const lastCal = new Date(new Date(lastWatering).getFullYear(), new Date(lastWatering).getMonth(), new Date(lastWatering).getDate());
          const nowCal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          days = Math.max(0, Math.round((nowCal.getTime() - lastCal.getTime()) / (1000 * 60 * 60 * 24)));
        }

        return {
          id: p.id,
          vlastniJmeno: p.vlastniJmeno,
          aktualniZdravi: p.aktualniZdravi,
          druh: {
            id: d?.id || p.druhId,
            nazev: d?.nazev || 'Neznámý druh',
            rodNazev: rod?.nazev || null,
          },
          posledniZaliti: lastWatering,
          dnyOdPoslednihoZaliti: days,
        };
      })
      .filter(item => item.dnyOdPoslednihoZaliti === null || item.dnyOdPoslednihoZaliti > 0)
      .sort((a, b) => {
        if (a.dnyOdPoslednihoZaliti === null && b.dnyOdPoslednihoZaliti === null) return 0;
        if (a.dnyOdPoslednihoZaliti === null) return -1;
        if (b.dnyOdPoslednihoZaliti === null) return 1;
        return b.dnyOdPoslednihoZaliti - a.dnyOdPoslednihoZaliti;
      });

    return payload;
  },

  async odlozitZaliti(rostlinaId: number, dny?: number): Promise<any> {
    const db = await openDb();
    const typyAkci = await getAllFromStore<TypAkce>(db, 'typyAkci');
    const wateringTyp = typyAkci.find(item => item.isWatering) ||
      typyAkci.find(item => isWateringAction(item));
    if (!wateringTyp) throw new Error('Typ akce pro zalévání nenalezen');

    const snoozeDays = dny || wateringTyp.odlozitDny || 2;
    const now = new Date();
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + snoozeDays, now.getHours(), now.getMinutes());
    const datumPripomenuti = reminderDate.toISOString();

    const id = await addToStore(db, 'odlozeneAkce', {
      rostlinaId: Number(rostlinaId),
      typAkceId: wateringTyp.id,
      datum: now.toISOString(),
      datumPripomenuti,
    });

    notifyCareUpdated();
    return { id, rostlinaId, typAkceId: wateringTyp.id, datumPripomenuti, dny: snoozeDays };
  },

  async getAllCareRemindersData(): Promise<{
    rostliny: Rostlina[];
    typyAkci: TypAkce[];
    historie: HistoriePece[];
    odlozene: Array<{ id: number; rostlinaId: number; typAkceId: number; datum: string; datumPripomenuti: string }>;
  }> {
    const db = await openDb();
    const [rostliny, typyAkci, historie, odlozene] = await Promise.all([
      this.getRostliny(),
      getAllFromStore<TypAkce>(db, 'typyAkci'),
      getAllFromStore<HistoriePece>(db, 'historiePece'),
      getAllFromStore<any>(db, 'odlozeneAkce'),
    ]);
    return { rostliny, typyAkci, historie, odlozene };
  },

  async logActivity(payload: any): Promise<ActivityLog> {
    const db = await openDb();
    const entry: ActivityLog = {
      id: 0,
      eventType: String(payload.eventType || 'INFO'),
      section: String(payload.section || 'app'),
      label: payload.label ? String(payload.label) : null,
      entityId: payload.entityId ? Number(payload.entityId) : null,
      details: payload.details ? String(payload.details) : null,
      createdAt: new Date().toISOString(),
    };
    const id = await addToStore(db, 'activityLog', entry);
    await pruneActivityLogIfNeeded(db);
    return { ...entry, id };
  },

  async savePhoto(fileName: string, dataUrl: string): Promise<string> {
    const db = await openDb();
    await putToStore(db, 'photos', { fileName, dataUrl });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kytickar-photo-saved', { detail: { fileName, dataUrl } }));
    }
    return fileName;
  },

  async getPhoto(fileName: string): Promise<string | null> {
    const db = await openDb();
    const item = await getFromStore<{ fileName: string; dataUrl: string }>(db, 'photos', fileName);
    return item?.dataUrl || null;
  },

  async getDevOverview(): Promise<DevOverview> {
    const db = await openDb();
    const [media, druhy, umisteni, rostliny, typyAkci, activityLog, historiePece, odlozeneAkce, galerieFotky] =
      await Promise.all([
        getAllFromStore<Medium>(db, 'media'),
        getAllFromStore<Druh>(db, 'druhy'),
        getAllFromStore<Umisteni>(db, 'umisteni'),
        this.getRostliny(),
        getAllFromStore<TypAkce>(db, 'typyAkci'),
        getAllFromStore<ActivityLog>(db, 'activityLog'),
        getAllFromStore<HistoriePece>(db, 'historiePece'),
        getAllFromStore<any>(db, 'odlozeneAkce'),
        getAllFromStore<GalerieFotka>(db, 'galerieFotky'),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      counts: {
        media: media.length,
        druhy: druhy.length,
        umisteni: umisteni.length,
        rostliny: rostliny.length,
        typyAkci: typyAkci.length,
        activityLog: activityLog.length,
        historiePece: historiePece.length,
        odlozeneAkce: odlozeneAkce.length,
        galerieFotky: galerieFotky.length,
      },
      posledniRostliny: rostliny.slice(0, 5).map(r => ({
        id: r.id,
        vlastniJmeno: r.vlastniJmeno,
        aktualniZdravi: r.aktualniZdravi,
        druh: { nazev: r.druh.nazev },
      })),
      posledniHistorie: historiePece.slice(0, 8).map(h => ({
        id: h.id,
        datum: h.datum,
        rostlina: { vlastniJmeno: rostliny.find(r => r.id === h.rostlinaId)?.vlastniJmeno || 'Kytka' },
        typAkce: { typAkce: typyAkci.find(t => t.id === h.typAkceId)?.typAkce || 'Akce' },
      })),
      posledniMedia: media.slice(0, 8),
      posledniAktivity: activityLog.slice(0, 12).reverse(),
    };
  },

  async getDevTable(tableName: DevTableName): Promise<DevTableResponse> {
    const db = await openDb();
    const validStore = tableName as string;
    const rows = await getAllFromStore<any>(db, validStore);
    return {
      tableName,
      rowCount: rows.length,
      rows: rows.slice(0, 100),
    };
  },

  async exportAllData(): Promise<any> {
    const db = await openDb();
    const [media, rody, umisteni, typyAkci, druhy, rostliny, galerieFotky, historiePece, odlozeneAkce, activityLog] =
      await Promise.all([
        getAllFromStore(db, 'media'),
        getAllFromStore(db, 'rody'),
        getAllFromStore(db, 'umisteni'),
        getAllFromStore(db, 'typyAkci'),
        getAllFromStore(db, 'druhy'),
        getAllFromStore(db, 'rostliny'),
        getAllFromStore(db, 'galerieFotky'),
        getAllFromStore(db, 'historiePece'),
        getAllFromStore(db, 'odlozeneAkce'),
        getAllFromStore(db, 'activityLog'),
      ]);

    const recentActivityLog = activityLog.slice(-100);

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      appName: 'Kytickar',
      data: {
        media,
        rody,
        umisteni,
        typyAkci,
        druhy,
        rostliny,
        galerieFotky,
        historiePece,
        odlozeneAkce,
        activityLog: recentActivityLog,
      },
    };
  },

  async importAllData(payload: any): Promise<void> {
    const db = await openDb();
    const data =
      payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? payload.data
        : payload;

    // 1. Validace schématu PŘED jakýmkoliv mazáním databáze
    validateBackupData(data);

    // 2. Bezpečnostní snapshot současných dat pro případ selhání importu
    const currentSnapshot = await this.exportAllData();

    try {
      // 3. Vymazání úložišť
      await clearAllStores(db, true);

      // 4. Vložení tabulek ze zálohy
      await applyDataToStores(db, data);

      // 5. Zajištění základního souboru image.png
      await ensureDemoPhotoFile(db);

      // 6. Doplnění výchozích hodnot typů akcí
      await ensureTypyAkciDefaults(db);
    } catch (insertErr) {
      console.error('Chyba při vkládání importovaných dat, provádím rollback:', insertErr);
      try {
        await clearAllStores(db, true);
        await applyDataToStores(db, currentSnapshot.data);
        await ensureDemoPhotoFile(db);
        await ensureTypyAkciDefaults(db);
      } catch (rollbackErr) {
        console.error('Kritická chyba při rollbacku původních dat:', rollbackErr);
      }
      throw new Error(
        `Import se nezdařil: ${insertErr instanceof Error ? insertErr.message : 'Neznámá chyba'}. Původní data byla obnovena.`
      );
    }

    // 7. Vyvolání události pro pročištění paměťových keší
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kytickar-db-reset'));
    }

    const rostlinyCount = Array.isArray(data?.rostliny) ? data.rostliny.length : 0;
    const druhyCount = Array.isArray(data?.druhy) ? data.druhy.length : 0;

    await this.logActivity({
      eventType: 'IMPORT',
      section: 'system',
      label: 'Obnova ze zálohy',
      details: `Naimportována data (${rostlinyCount} rostlin, ${druhyCount} druhů)`,
    });
    notifyCareUpdated();
  },

  async resetToDefaultData(): Promise<void> {
    const db = await openDb();
    await clearAllStores(db, true);
    await applyDataToStores(db, (defaultData as any).data);
    await ensureDemoPhotoFile(db);
    await ensureTypyAkciDefaults(db);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kytickar-db-reset'));
    }

    await this.logActivity({
      eventType: 'RESET',
      section: 'system',
      label: 'Reset na výchozí data',
      details: 'Obnoven výchozí dataset Kytičkáře.',
    });
    notifyCareUpdated();
  },

  async clearAllData(clearPhotos = true): Promise<void> {
    const db = await openDb();
    await clearAllStores(db, clearPhotos);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kytickar-db-reset'));
    }
  },

  async getAllPhotos(): Promise<Array<{ fileName: string; dataUrl: string }>> {
    const db = await openDb();
    return await getAllFromStore<{ fileName: string; dataUrl: string }>(db, 'photos');
  },
};
