import JSZip from 'jszip';
import { localDb } from './localDb';

export type StorageStats = {
  rostlinyCount: number;
  druhyCount: number;
  mediaCount: number;
  umisteniCount: number;
  historieCount: number;
  photosCount: number;
  userPhotosCount: number;
  catalogPhotosCount: number;
  approximateSizeKb: number;
};

export type BackupStatus = {
  lastBackupDate: Date | null;
  daysSinceLastBackup: number | null;
  isDue: boolean;
  nextBackupDate: Date;
};

export const BACKUP_INTERVAL_DAYS = 60; // Upozornění každé 2 měsíce
const LAST_BACKUP_STORAGE_KEY = 'kytickar_last_backup_timestamp';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

const MAX_BACKUP_FILE_SIZE = 150 * 1024 * 1024; // 150 MB

async function saveBlobWithPicker(blob: Blob, filename: string, mimeType: string): Promise<void> {
  // 1. Android Native File Bridge (Capacitor) - vyvolá nativní systémový dialog "Uložit do..."
  if (typeof window !== 'undefined' && (window as any).AndroidFileSaver) {
    const saver = (window as any).AndroidFileSaver;

    // Pokud AndroidFileSaver podporuje streamování po částech (zápis bez rizika OOM)
    if (typeof saver.startSave === 'function' && typeof saver.writeChunk === 'function' && typeof saver.finishSave === 'function') {
      return new Promise<void>((resolve, reject) => {
        let isDone = false;

        const cleanup = () => {
          isDone = true;
          window.removeEventListener('android-save-ready', onSaveReady);
          window.removeEventListener('android-file-saved', onSaved);
        };

        const onSaved = (e: any) => {
          cleanup();
          if (e.detail?.cancelled) {
            reject(new Error('Ukládání souboru bylo zrušeno.'));
          } else if (e.detail?.success) {
            resolve();
          } else {
            reject(new Error('Chyba při zápisu souboru do zařízení.'));
          }
        };

        const onSaveReady = async (e: any) => {
          if (isDone) return;
          if (!e.detail?.ready) {
            cleanup();
            reject(new Error(e.detail?.cancelled ? 'Ukládání souboru bylo zrušeno.' : 'Nepodařilo se otevřít cílový soubor.'));
            return;
          }

          try {
            const CHUNK_SIZE = 512 * 1024; // 512 KB
            let offset = 0;
            while (offset < blob.size) {
              const slice = blob.slice(offset, offset + CHUNK_SIZE);
              const arrayBuf = await slice.arrayBuffer();
              const bytes = new Uint8Array(arrayBuf);
              let binary = '';
              const len = bytes.byteLength;
              for (let i = 0; i < len; i += 8192) {
                binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, Math.min(i + 8192, len))));
              }
              const chunkBase64 = btoa(binary);
              const ok = saver.writeChunk(chunkBase64);
              if (!ok) {
                throw new Error('Chyba při zápisu části souboru do zařízení.');
              }
              offset += CHUNK_SIZE;
            }
            saver.finishSave(true);
          } catch (err: any) {
            cleanup();
            try {
              saver.finishSave(false);
            } catch (_) {}
            reject(err);
          }
        };

        window.addEventListener('android-save-ready', onSaveReady);
        window.addEventListener('android-file-saved', onSaved);

        try {
          saver.startSave(filename, mimeType);
        } catch (err) {
          cleanup();
          reject(err);
        }
      });
    }

    // Fallback: přímé uložení celého base64 v jedné zprávě
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64Data = dataUrl ? dataUrl.split('base64,')[1] : null;
        if (!base64Data) {
          reject(new Error('Chyba při přípravě souboru.'));
          return;
        }

        const onSaved = (e: any) => {
          window.removeEventListener('android-file-saved', onSaved);
          if (e.detail?.cancelled) {
            reject(new Error('Ukládání souboru bylo zrušeno.'));
          } else if (e.detail?.success) {
            resolve();
          } else {
            reject(new Error('Chyba při zápisu souboru do zařízení.'));
          }
        };

        window.addEventListener('android-file-saved', onSaved);
        try {
          saver.saveFile(filename, mimeType, base64Data);
        } catch (err) {
          window.removeEventListener('android-file-saved', onSaved);
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  // 2. Web File System Access API (Desktop prohlížeče) - vyvolá dialog "Uložit jako..."
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const ext = filename.endsWith('.zip') ? '.zip' : '.json';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: 'Záložní soubor Kytičkář',
            accept: {
              [mimeType]: [ext],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Ukládání souboru bylo zrušeno.');
      }
      // Při selhání přejít na fallback níže
    }
  }

  // 3. Fallback: klasický browser download
  downloadBlob(blob, filename);
}

function formatDateForFilename(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}_${hh}${mm}`;
}

export const backupService = {
  async exportZipBackup(): Promise<{ filename: string; sizeKb: number }> {
    const zip = new JSZip();

    // 1. Export database JSON
    const dbPayload = await localDb.exportAllData();
    const dbJsonString = JSON.stringify(dbPayload, null, 2);
    zip.file('db.json', dbJsonString);

    // 2. Export photos into 'fotky/' folder
    const photosFolder = zip.folder('fotky');
    const photos = await localDb.getAllPhotos();

    for (const photo of photos) {
      if (photo.dataUrl && photo.dataUrl.includes('base64,')) {
        const base64Data = photo.dataUrl.split('base64,')[1];
        if (base64Data && photosFolder) {
          photosFolder.file(photo.fileName, base64Data, { base64: true });
        }
      }
    }

    // 3. Generate and download ZIP
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const filename = `kytickar_zaloha_${formatDateForFilename()}.zip`;
    await saveBlobWithPicker(blob, filename, 'application/zip');
    this.recordBackupCompleted();

    return {
      filename,
      sizeKb: Math.round(blob.size / 1024),
    };
  },

  async exportJsonBackup(): Promise<{ filename: string; sizeKb: number }> {
    const dbPayload = await localDb.exportAllData();
    const jsonString = JSON.stringify(dbPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const filename = `kytickar_db_${formatDateForFilename()}.json`;
    await saveBlobWithPicker(blob, filename, 'application/json');
    this.recordBackupCompleted();

    return {
      filename,
      sizeKb: Math.round(blob.size / 1024),
    };
  },

  getLastBackupDate(): Date | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(LAST_BACKUP_STORAGE_KEY);
      if (!raw) return null;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  },

  recordBackupCompleted(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(LAST_BACKUP_STORAGE_KEY, new Date().toISOString());
      } catch (err) {
        console.warn('Chyba při ukládání času zálohy:', err);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kytickar-backup-completed'));
      }
    }
  },

  getBackupStatus(): BackupStatus {
    const lastDate = this.getLastBackupDate();
    const now = new Date();
    if (!lastDate) {
      return {
        lastBackupDate: null,
        daysSinceLastBackup: null,
        isDue: true,
        nextBackupDate: now,
      };
    }

    const diffMs = now.getTime() - lastDate.getTime();
    const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const nextDate = new Date(
      lastDate.getFullYear(),
      lastDate.getMonth(),
      lastDate.getDate() + BACKUP_INTERVAL_DAYS,
      10,
      0,
      0
    );

    return {
      lastBackupDate: lastDate,
      daysSinceLastBackup: days,
      isDue: days >= BACKUP_INTERVAL_DAYS,
      nextBackupDate: nextDate,
    };
  },

  async importZipBackup(file: File): Promise<{ plantsImported: number; photosImported: number }> {
    if (file.size > MAX_BACKUP_FILE_SIZE) {
      throw new Error(
        `Soubor je příliš velký (${Math.round(file.size / (1024 * 1024))} MB). Maximální povolená velikost zálohy je 150 MB.`
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Vyhledání db.json v kořenovém adresáři ZIP archivu (ne zanořených náhodných JSONů)
    let dbFile = zip.file('db.json') || zip.file('DB.JSON') || zip.file('Db.json');
    if (!dbFile) {
      const rootJsonEntries = Object.keys(zip.files).filter((p) => {
        const isFile = !zip.files[p].dir;
        const isRoot = !p.includes('/');
        const isJson = p.toLowerCase().endsWith('.json');
        return isFile && isRoot && isJson;
      });

      if (rootJsonEntries.length > 0) {
        const dbCandidate = rootJsonEntries.find((p) => p.toLowerCase().endsWith('db.json')) || rootJsonEntries[0];
        dbFile = zip.file(dbCandidate);
      }
    }

    if (!dbFile) {
      throw new Error('V kořenovém adresáři ZIP archivu nebyl nalezen soubor db.json ani žádná platná JSON databáze.');
    }

    const dbText = await dbFile.async('string');
    const parsedData = JSON.parse(dbText);
    await localDb.importAllData(parsedData);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kytickar-db-reset'));
    }

    // 2. Import photos from 'fotky/' or any image file in archive
    let photosImported = 0;
    const photoFiles = Object.keys(zip.files).filter((path) => {
      const lower = path.toLowerCase();
      return (
        !zip.files[path].dir &&
        (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'))
      );
    });

    for (const filePath of photoFiles) {
      const fileEntry = zip.file(filePath);
      if (!fileEntry) continue;

      const base64 = await fileEntry.async('base64');
      const filename = filePath.split('/').pop() || filePath;
      const lower = filename.toLowerCase();
      let mime = 'image/jpeg';
      if (lower.endsWith('.png')) mime = 'image/png';
      else if (lower.endsWith('.webp')) mime = 'image/webp';

      const dataUrl = `data:${mime};base64,${base64}`;

      await localDb.savePhoto(filename, dataUrl);
      photosImported++;
    }

    const plantsCount = parsedData?.data?.rostliny?.length ?? parsedData?.rostliny?.length ?? 0;
    return {
      plantsImported: plantsCount,
      photosImported,
    };
  },

  async importJsonBackup(file: File): Promise<{ plantsImported: number }> {
    if (file.size > MAX_BACKUP_FILE_SIZE) {
      throw new Error(
        `Soubor je příliš velký (${Math.round(file.size / (1024 * 1024))} MB). Maximální povolená velikost je 150 MB.`
      );
    }
    const text = await file.text();
    const parsed = JSON.parse(text);
    await localDb.importAllData(parsed);
    const plantsCount = parsed?.data?.rostliny?.length ?? parsed?.rostliny?.length ?? 0;
    return { plantsImported: plantsCount };
  },

  async resetToDefault(): Promise<void> {
    await localDb.resetToDefaultData();
  },

  async getStorageStats(): Promise<StorageStats> {
    const data = await localDb.exportAllData();
    const photos = await localDb.getAllPhotos();

    const d = data.data || {};
    let photosSize = 0;
    for (const p of photos) {
      photosSize += p.dataUrl ? p.dataUrl.length : 0;
    }
    const jsonSize = JSON.stringify(data).length;
    const approxTotalBytes = photosSize + jsonSize;

    // Počítat unikátní fotografie v IndexedDB a referencích rozdělené na druhy vs uživatelské
    const catalogPhotoNames = new Set<string>();
    for (const dr of (d.druhy || [])) {
      if (dr.fotka1Name) catalogPhotoNames.add(dr.fotka1Name.replace(/^(\/?species\/|\/?fotky\/)/, ''));
      if (dr.fotka2Name) catalogPhotoNames.add(dr.fotka2Name.replace(/^(\/?species\/|\/?fotky\/)/, ''));
    }

    const userPhotoNames = new Set<string>();
    for (const g of (d.galerieFotky || [])) {
      if (g.fotkaName) userPhotoNames.add(g.fotkaName.replace(/^(\/?species\/|\/?fotky\/)/, ''));
    }

    for (const p of photos) {
      const clean = (p.fileName || '').replace(/^(\/?species\/|\/?fotky\/)/, '');
      if (clean && !catalogPhotoNames.has(clean)) {
        userPhotoNames.add(clean);
      }
    }

    const totalUniqueCount = Math.max(photos.length, catalogPhotoNames.size + userPhotoNames.size);

    return {
      rostlinyCount: d.rostliny?.length || 0,
      druhyCount: d.druhy?.length || 0,
      mediaCount: d.media?.length || 0,
      umisteniCount: d.umisteni?.length || 0,
      historieCount: d.historiePece?.length || 0,
      photosCount: totalUniqueCount,
      userPhotosCount: userPhotoNames.size,
      catalogPhotosCount: catalogPhotoNames.size,
      approximateSizeKb: Math.max(1, Math.round(approxTotalBytes / 1024)),
    };
  },
};
