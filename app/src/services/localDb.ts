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
      await seedDbIfNeeded(db);
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
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

// -------------------------------------------------------------
// SEED DATA
// -------------------------------------------------------------
async function seedDbIfNeeded(db: IDBDatabase): Promise<void> {
  const mediaCount = await new Promise<number>((res) => {
    const tx = db.transaction('media', 'readonly');
    const req = tx.objectStore('media').count();
    req.onsuccess = () => res(req.result);
    req.onerror = () => res(0);
  });

  if (mediaCount > 0) return;

  const defaultMedia = [
    { nazev: 'Zemina', popis: 'Univerzální substrát pro pokojovky' },
    { nazev: 'Voda', popis: 'Čistá voda pro hydroponii nebo zakořeňování' },
    { nazev: 'Perlit', popis: 'Anorganický materiál pro provzdušnění' },
    { nazev: 'Kůra', popis: 'Borovicová nebo modřínová kůra' },
    { nazev: 'Písek', popis: 'Křemičitý písek pro lepší drenáž' },
    { nazev: 'Keramzit', popis: 'Drenážní vrstva na dno květináče' },
    { nazev: 'Kokos', popis: 'Kokosové chipsy nebo vlákno' },
    { nazev: 'Rašeliník', popis: 'Sphagnum moss pro air-layering' },
  ];

  const defaultRody = [
    'Monstera', 'Ficus', 'Peperomia', 'Philodendron',
    'Alocasia', 'Syngonium', 'Epipremnum', 'Sansevieria',
    'Calathea', 'Anthurium', 'Hoya'
  ];

  const defaultTypyAkci = [
    'Zalévání', 'Hnojení', 'Přesazování', 'Rosení',
    'Kontrola škůdců', 'Otírání prachu', 'Stříhání'
  ];

  const defaultUmisteni = [
    'Obývák - okno jih',
    'Ložnice - police',
    'Pracovna - stůl',
    'Koupelna - parapet'
  ];

  for (const m of defaultMedia) await addToStore(db, 'media', m);
  for (const r of defaultRody) await addToStore(db, 'rody', { nazev: r, popis: null });
  for (const t of defaultTypyAkci) await addToStore(db, 'typyAkci', { typAkce: t });
  for (const u of defaultUmisteni) await addToStore(db, 'umisteni', { nazev: u, parentId: null });

  const rodyList = await getAllFromStore<Rod>(db, 'rody');
  const monsteraRod = rodyList.find(r => r.nazev === 'Monstera');
  const ficusRod = rodyList.find(r => r.nazev === 'Ficus');
  const philoRod = rodyList.find(r => r.nazev === 'Philodendron');
  const epipremnumRod = rodyList.find(r => r.nazev === 'Epipremnum');
  const sansevieriaRod = rodyList.find(r => r.nazev === 'Sansevieria');

  const defaultDruhy = [
    { nazev: 'Monstera deliciosa', popis: 'Velké dekorativní listy s perforací', rodId: monsteraRod?.id || null, fotka1Name: null, fotka2Name: null },
    { nazev: 'Monstera adansonii', popis: 'Rychle rostoucí popínavá monstera', rodId: monsteraRod?.id || null, fotka1Name: null, fotka2Name: null },
    { nazev: 'Ficus elastica', popis: 'Pryžovník, odolný a vhodný pro začátečníky', rodId: ficusRod?.id || null, fotka1Name: null, fotka2Name: null },
    { nazev: 'Philodendron hederaceum', popis: 'Popínavý filodendron se srdčitým listem', rodId: philoRod?.id || null, fotka1Name: null, fotka2Name: null },
    { nazev: 'Epipremnum aureum', popis: 'Pothos, nenáročná rostlina do bytu', rodId: epipremnumRod?.id || null, fotka1Name: null, fotka2Name: null },
    { nazev: 'Sansevieria trifasciata', popis: 'Tchýnin jazyk, snáší sušší podmínky', rodId: sansevieriaRod?.id || null, fotka1Name: null, fotka2Name: null },
  ];

  for (const d of defaultDruhy) await addToStore(db, 'druhy', d);

  const druhyList = await getAllFromStore<Druh>(db, 'druhy');
  const mediaList = await getAllFromStore<Medium>(db, 'media');
  const umisteniList = await getAllFromStore<Umisteni>(db, 'umisteni');

  const defaultRostliny = [
    { vlastniJmeno: 'Moni', druhId: druhyList.find(d => d.nazev.includes('deliciosa'))?.id || 1, mediumId: mediaList[0]?.id || 1, umisteniId: umisteniList[0]?.id || 1, aktualniZdravi: 5, datumPorizeni: new Date().toISOString() },
    { vlastniJmeno: 'Ada', druhId: druhyList.find(d => d.nazev.includes('adansonii'))?.id || 2, mediumId: mediaList[6]?.id || 1, umisteniId: umisteniList[2]?.id || 1, aktualniZdravi: 4, datumPorizeni: new Date().toISOString() },
    { vlastniJmeno: 'Fikusák', druhId: druhyList.find(d => d.nazev.includes('elastica'))?.id || 3, mediumId: mediaList[0]?.id || 1, umisteniId: umisteniList[1]?.id || 1, aktualniZdravi: 4, datumPorizeni: new Date().toISOString() },
    { vlastniJmeno: 'Philo', druhId: druhyList.find(d => d.nazev.includes('hederaceum'))?.id || 4, mediumId: mediaList[2]?.id || 1, umisteniId: umisteniList[3]?.id || 1, aktualniZdravi: 3, datumPorizeni: new Date().toISOString() },
    { vlastniJmeno: 'Pothos', druhId: druhyList.find(d => d.nazev.includes('aureum'))?.id || 5, mediumId: mediaList[1]?.id || 1, umisteniId: umisteniList[0]?.id || 1, aktualniZdravi: 5, datumPorizeni: new Date().toISOString() },
  ];

  for (const r of defaultRostliny) {
    const plantId = await addToStore(db, 'rostliny', r);
    // Vlozime par historii zalivky
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    await addToStore(db, 'historiePece', { rostlinaId: plantId, typAkceId: 1, datum: threeDaysAgo });
  }

  await addToStore(db, 'activityLog', {
    eventType: 'SEED',
    section: 'system',
    label: 'Inicializace databáze',
    entityId: null,
    details: 'Vložena výchozí data kytičkáře.',
    createdAt: new Date().toISOString(),
  });
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
    return list.find(r => r.id === id)!;
  },

  async deleteRostlina(id: number): Promise<null> {
    const db = await openDb();
    await deleteFromStore(db, 'rostliny', id);
    // Smazeme i asociovane zaznamy
    const fotky = await getAllFromStore<GalerieFotka>(db, 'galerieFotky');
    for (const f of fotky.filter(f => f.rostlinaId === id)) {
      await deleteFromStore(db, 'galerieFotky', f.id);
    }
    const historie = await getAllFromStore<HistoriePece>(db, 'historiePece');
    for (const h of historie.filter(h => h.rostlinaId === id)) {
      await deleteFromStore(db, 'historiePece', h.id);
    }
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
    if (plants.some(p => p.druhId === id)) {
      throw new Error('Druh nelze smazat. Je pouzit u existujicich rostlin.');
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
    if (druhy.some(d => d.rodId === id)) {
      throw new Error('Rod nelze smazat. Je pouzit u existujicich druhu.');
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
    if (plants.some(p => p.mediumId === id)) {
      throw new Error('Medium nelze smazat. Je pouzite u existujicich rostlin.');
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
    if (plants.some(p => p.umisteniId === id) || allUmisteni.some(u => u.parentId === id)) {
      throw new Error('Umisteni nelze smazat. Je pouzite nebo ma potomky.');
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
    const id = await addToStore(db, 'typyAkci', { typAkce: String(payload.typAkce) });
    return (await getFromStore<TypAkce>(db, 'typyAkci', id))!;
  },

  async updateTypAkce(id: number, payload: any): Promise<TypAkce> {
    const db = await openDb();
    const existing = await getFromStore<TypAkce>(db, 'typyAkci', id);
    if (!existing) throw new Error('Typ akce nenalezen');
    const updated = { ...existing, typAkce: String(payload.typAkce) };
    await putToStore(db, 'typyAkci', updated);
    return updated;
  },

  async deleteTypAkce(id: number): Promise<null> {
    const db = await openDb();
    const historie = await getAllFromStore<HistoriePece>(db, 'historiePece');
    if (historie.some(h => h.typAkceId === id)) {
      throw new Error('Typ akce nelze smazat. Je pouzit v historii pece.');
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
    await deleteFromStore(db, 'galerieFotky', id);
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
    return {
      ...created!,
      typAkce: typyAkci.find(t => t.id === created!.typAkceId) || { id: created!.typAkceId, typAkce: 'Akce' },
    };
  },

  async deleteHistoriePece(id: number): Promise<null> {
    const db = await openDb();
    await deleteFromStore(db, 'historiePece', id);
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
      .filter(item => item.typAkce.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('zal'))
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
        const days = lastWatering
          ? Math.floor((now.getTime() - new Date(lastWatering).getTime()) / (1000 * 60 * 60 * 24))
          : null;

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
      .sort((a, b) => {
        if (a.dnyOdPoslednihoZaliti === null && b.dnyOdPoslednihoZaliti === null) return 0;
        if (a.dnyOdPoslednihoZaliti === null) return -1;
        if (b.dnyOdPoslednihoZaliti === null) return 1;
        return b.dnyOdPoslednihoZaliti - a.dnyOdPoslednihoZaliti;
      });

    return payload;
  },

  async odlozitZaliti(rostlinaId: number, dny: number): Promise<any> {
    const db = await openDb();
    const typyAkci = await getAllFromStore<TypAkce>(db, 'typyAkci');
    const wateringTyp = typyAkci.find(item =>
      item.typAkce.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes('zal')
    );
    if (!wateringTyp) throw new Error('Typ akce pro zalévání nenalezen');

    const now = new Date();
    const datumPripomenuti = new Date(now.getTime() + (dny || 2) * 24 * 60 * 60 * 1000).toISOString();

    const id = await addToStore(db, 'odlozeneAkce', {
      rostlinaId: Number(rostlinaId),
      typAkceId: wateringTyp.id,
      datum: now.toISOString(),
      datumPripomenuti,
    });

    return { id, rostlinaId, typAkceId: wateringTyp.id, datumPripomenuti };
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
    return { ...entry, id };
  },

  async savePhoto(fileName: string, dataUrl: string): Promise<string> {
    const db = await openDb();
    await putToStore(db, 'photos', { fileName, dataUrl });
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
};
