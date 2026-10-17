import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export type BackHandler = () => boolean | void;

interface HandlerEntry {
  id: string;
  priority: number;
  handler: BackHandler;
}

class BackButtonService {
  private handlers: HandlerEntry[] = [];
  private isInitialized = false;
  private lastBackPressTime = 0;
  private exitToastListeners: Array<(show: boolean) => void> = [];
  private exitToastTimer: any = null;

  init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Android hardware back button via @capacitor/app
    if (Capacitor.isNativePlatform()) {
      App.addListener('backButton', () => {
        void this.handleBack();
      }).catch((err) => {
        console.warn('Nepodařilo se připojit posluchač @capacitor/app backButton:', err);
      });
    }

    // 2. Web browser back button (popstate) fallback
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        void this.handleBack();
      });
    }
  }

  register(id: string, priority: number, handler: BackHandler): () => void {
    this.handlers = this.handlers.filter((h) => h.id !== id);
    this.handlers.push({ id, priority, handler });
    // Řazení sestupně podle priority – vyšší priorita se vykoná dříve
    this.handlers.sort((a, b) => b.priority - a.priority);

    return () => {
      this.unregister(id);
    };
  }

  unregister(id: string): void {
    this.handlers = this.handlers.filter((h) => h.id !== id);
  }

  onExitToastChange(listener: (show: boolean) => void): () => void {
    this.exitToastListeners.push(listener);
    return () => {
      this.exitToastListeners = this.exitToastListeners.filter((l) => l !== listener);
    };
  }

  private notifyExitToast(show: boolean): void {
    for (const listener of this.exitToastListeners) {
      try {
        listener(show);
      } catch (_) {}
    }
  }

  async handleBack(): Promise<boolean> {
    // 1. Projít registrované handlery od nejvyšší priority po nejnižší
    const activeHandlers = [...this.handlers];
    for (const entry of activeHandlers) {
      try {
        const result = entry.handler();
        // Pokud handler nevrátil explicitně false, považujeme událost za obslouženou
        if (result !== false) {
          if (this.exitToastTimer) {
            clearTimeout(this.exitToastTimer);
            this.exitToastTimer = null;
            this.notifyExitToast(false);
          }
          return true;
        }
      } catch (err) {
        console.error(`Chyba v obsluze tlačítka Zpět (${entry.id}):`, err);
      }
    }

    // 2. Žádný handler nezasáhl – uživatel je na hlavní obrazovce aplikace
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      // Dvojité stisknutí během 2 vteřin -> ukončit aplikaci
      if (this.exitToastTimer) {
        clearTimeout(this.exitToastTimer);
        this.exitToastTimer = null;
      }
      this.notifyExitToast(false);

      if (Capacitor.isNativePlatform()) {
        try {
          await App.exitApp();
        } catch (_) {}
      }
      return true;
    }

    // První stisknutí na kořenové obrazovce -> zobrazit informační toast
    this.lastBackPressTime = now;
    this.notifyExitToast(true);

    if (this.exitToastTimer) {
      clearTimeout(this.exitToastTimer);
    }
    this.exitToastTimer = setTimeout(() => {
      this.notifyExitToast(false);
      this.exitToastTimer = null;
    }, 2000);

    return true;
  }
}

export const backButtonService = new BackButtonService();
