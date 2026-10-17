import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Převede Base64 Data URL na standardní File objekt
 */
export function dataUrlToFile(dataUrl: string, fileName?: string): File {
  const parts = dataUrl.split(',');
  const mime = parts[0]?.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(parts[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const ext = mime.split('/')[1] || 'jpg';
  const name = fileName || `foto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  return new File([u8arr], name, { type: mime });
}

/**
 * Získá fotografii buď z nativního fotoaparátu, nebo z galerie zařízení.
 * Podporuje jak nativní Capacitor běh (Android/iOS), tak webový fallback.
 */
export async function pickPhoto(source: 'camera' | 'photos'): Promise<File | null> {
  // 1. Zkusit nativní Capacitor Camera
  if (Capacitor.isNativePlatform()) {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        correctOrientation: true,
        width: 1440,
      });

      if (image.dataUrl) {
        const ext = image.format || 'jpg';
        const fileName = `foto_${Date.now()}.${ext}`;
        return dataUrlToFile(image.dataUrl, fileName);
      }
      return null;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      // Uživatel akci zrušil (stiskl zpět v kameře/galerii)
      if (
        msg.includes('cancelled') ||
        msg.includes('canceled') ||
        msg.includes('user denied') ||
        msg.includes('no image picked') ||
        msg.includes('closed')
      ) {
        return null;
      }
      console.warn('Chyba nativní kamery, zkouším fallback:', err);
    }
  }

  // 2. Webový / desktopový fallback přes HTML input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') {
      input.capture = 'environment';
    }

    let isResolved = false;

    input.onchange = (e) => {
      isResolved = true;
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        resolve(target.files[0]);
      } else {
        resolve(null);
      }
    };

    // Detekce zrušení dialogu na novějších prohlížečích
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!isResolved) {
            resolve(null);
          }
        }, 500);
      },
      { once: true }
    );

    input.click();
  });
}
