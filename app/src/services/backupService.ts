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

async function saveBlobWithPicker(blob: Blob, filename: string, mimeType: string): Promise<void> {
  // 1. Android Native File Bridge (Capacitor) - vyvolá nativní systémový dialog "Uložit do..."
  if (typeof window !== 'undefined' && (window as any).AndroidFileSaver) {
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
          (window as any).AndroidFileSaver.saveFile(filename, mimeType, base64Data);
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

    return {
      filename,
      sizeKb: Math.round(blob.size / 1024),
    };
  },

  async importZipBackup(file: File): Promise<{ plantsImported: number; photosImported: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Locate db.json
    let dbFile = zip.file('db.json');
    if (!dbFile) {
      // Look for any file ending with db.json or .json in root
      const jsonEntries = Object.keys(zip.files).filter((p) => p.endsWith('db.json') || p.endsWith('.json'));
      if (jsonEntries.length > 0) {
        dbFile = zip.file(jsonEntries[0]);
      }
    }

    if (!dbFile) {
      throw new Error('V ZIP archivu nebyl nalezen soubor db.json');
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
