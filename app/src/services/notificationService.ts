import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { localDb } from './localDb';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // e.g. "09:00"
  lastScheduledAt: string | null;
}

const SETTINGS_STORAGE_KEY = 'kytickar_notification_settings';
const CARE_CHANNEL_ID = 'kytickar-care';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  time: '09:00',
  lastScheduledAt: null,
};

export const notificationService = {
  getSettings(): NotificationSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('Chyba při čtení nastavení notifikací:', err);
    }
    return DEFAULT_SETTINGS;
  },

  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Chyba při ukládání nastavení notifikací:', err);
    }
    await this.rescheduleAllReminders();
  },

  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await LocalNotifications.checkPermissions();
        if (res.display === 'granted') return 'granted';
        if (res.display === 'denied') return 'denied';
        return 'prompt';
      } catch (err) {
        console.warn('checkPermissions error:', err);
        return 'prompt';
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return 'granted';
      if (Notification.permission === 'denied') return 'denied';
      return 'prompt';
    }

    return 'denied';
  },

  async requestPermission(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await LocalNotifications.requestPermissions();
        const granted = res.display === 'granted';
        if (granted) {
          await this.ensureChannel();
        }
        return granted;
      } catch (err) {
        console.error('requestPermissions error:', err);
        return false;
      }
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        return res === 'granted';
      } catch (err) {
        console.error('Web Notification.requestPermission error:', err);
        return false;
      }
    }

    return false;
  },

  async ensureChannel(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: CARE_CHANNEL_ID,
        name: 'Péče o kytičky',
        description: 'Upozornění na zálivku, hnojení a další péči',
        importance: 4, // High importance (zvuk + banner)
        vibration: true,
        visibility: 1,
      });
    } catch (err) {
      console.warn('ensureChannel error:', err);
    }
  },

  async sendTestNotification(): Promise<void> {
    const perm = await this.checkPermission();
    if (perm !== 'granted') {
      const ok = await this.requestPermission();
      if (!ok) {
        throw new Error('Notifikace nejsou v zařízení povoleny.');
      }
    }

    await this.ensureChannel();

    if (Capacitor.isNativePlatform()) {
      const scheduleTime = new Date(Date.now() + 2000); // za 2 sekundy
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 99999,
            title: '🌿 Kytičkář: Zkouška oznámení',
            body: 'Notifikace a připomínky fungují správně! Kytičkář vás včas upozorní na péči o rostliny.',
            schedule: {
              at: scheduleTime,
              allowWhileIdle: true,
            },
            channelId: CARE_CHANNEL_ID,
          },
        ],
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('🌿 Kytičkář: Zkouška oznámení', {
        body: 'Notifikace a připomínky fungují správně! Kytičkář vás včas upozorní na péči o rostliny.',
        icon: '/image.png',
      });
    }
  },

  async cancelAllReminders(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.cancelAll();
      } catch (err) {
        console.warn('cancelAll error:', err);
      }
    }
  },

  async rescheduleAllReminders(): Promise<{ scheduledCount: number; nextReminderDate: string | null }> {
    const settings = this.getSettings();

    // 1. Pokud jsou notifikace vypnuty, zrušíme všechny naplánované
    if (!settings.enabled) {
      await this.cancelAllReminders();
      return { scheduledCount: 0, nextReminderDate: null };
    }

    // 2. Ověříme oprávnění
    const perm = await this.checkPermission();
    if (perm !== 'granted') {
      await this.cancelAllReminders();
      return { scheduledCount: 0, nextReminderDate: null };
    }

    await this.ensureChannel();

    // 3. Získáme data o kytkách a péči
    const careData = await localDb.getAllCareRemindersData();
    const { rostliny, typyAkci, historie, odlozene } = careData;

    if (rostliny.length === 0) {
      await this.cancelAllReminders();
      return { scheduledCount: 0, nextReminderDate: null };
    }

    // 4. Parsování času notifikace (např. "09:00")
    const [hoursStr, minutesStr] = settings.time.split(':');
    const reminderHours = parseInt(hoursStr || '9', 10);
    const reminderMinutes = parseInt(minutesStr || '0', 10);

    // 5. Analýza úkonů pro každou rostlinu
    // Spočítáme pro každou rostlinu a typ akce přesné datum, kdy je úkon splatný (dueDate)
    type DueTask = {
      plantName: string;
      actionName: string;
      actionIcon: string;
      dueDate: Date;
    };

    const dueTasks: DueTask[] = [];
    const now = new Date();

    for (const plant of rostliny) {
      for (const typ of typyAkci) {
        const intervalDny = typ.intervalDny || 7;

        // Poslední provedení této akce
        const plantHistory = historie
          .filter((h) => h.rostlinaId === plant.id && h.typAkceId === typ.id)
          .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

        const lastDate = plantHistory.length > 0
          ? new Date(plantHistory[0].datum)
          : new Date(plant.datumPorizeni || now.toISOString());

        // Kontrola aktivního odložení (snooze)
        const activeSnooze = odlozene.find(
          (o) => o.rostlinaId === plant.id && o.typAkceId === typ.id && new Date(o.datumPripomenuti) > lastDate
        );

        let dueDate: Date;
        if (activeSnooze) {
          dueDate = new Date(activeSnooze.datumPripomenuti);
        } else {
          dueDate = new Date(lastDate.getTime() + intervalDny * 24 * 60 * 60 * 1000);
        }

        dueTasks.push({
          plantName: plant.vlastniJmeno,
          actionName: typ.typAkce,
          actionIcon: typ.ikona || '🌱',
          dueDate,
        });
      }
    }

    // 6. Seskupení úkolů do příštích 14 dnů (den 0 = dnes, den 1 = zítra, ...)
    const notificationsToSchedule: any[] = [];
    let firstReminderDate: string | null = null;

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
      const targetDay = new Date(startOfToday.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const targetDayStart = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 0, 0, 0);
      const targetDayEnd = new Date(targetDay.getFullYear(), targetDay.getMonth(), targetDay.getDate(), 23, 59, 59);

      // Přesný čas odeslání notifikace v daný den
      const scheduledDateTime = new Date(
        targetDay.getFullYear(),
        targetDay.getMonth(),
        targetDay.getDate(),
        reminderHours,
        reminderMinutes,
        0
      );

      // Pokud je to dnešek a zvolený čas už dnes uplynul, dnešní notifikaci nepřidáváme
      if (dayOffset === 0 && scheduledDateTime.getTime() <= now.getTime()) {
        continue;
      }

      // Úkoly, které jsou splatné v tento den (nebo pro den 0 i dříve nezpracované z minulosti)
      const tasksForDay = dueTasks.filter((t) => {
        if (dayOffset === 0) {
          return t.dueDate <= targetDayEnd;
        }
        return t.dueDate >= targetDayStart && t.dueDate <= targetDayEnd;
      });

      if (tasksForDay.length > 0) {
        let title = '🌿 Kytičkář – Čas na péči';
        let body = '';

        if (tasksForDay.length === 1) {
          const t = tasksForDay[0];
          title = `${t.actionIcon} ${t.plantName}`;
          body = `Je čas na ${t.actionName.toLowerCase()}!`;
        } else if (tasksForDay.length <= 3) {
          const summary = tasksForDay.map((t) => `${t.plantName} (${t.actionName.toLowerCase()})`).join(', ');
          body = `Dnes potřebují péči: ${summary}`;
        } else {
          const wateringCount = tasksForDay.filter((t) => t.actionName.toLowerCase().includes('zal')).length;
          const otherCount = tasksForDay.length - wateringCount;
          if (wateringCount > 0 && otherCount > 0) {
            body = `Dnes potřebuje zalít ${wateringCount} ${wateringCount === 1 ? 'kytička' : wateringCount < 5 ? 'kytičky' : 'kytiček'} a dalších ${otherCount} úkonů péče.`;
          } else {
            body = `Dnes čeká péče celkem ${tasksForDay.length} ${tasksForDay.length < 5 ? 'kytičky' : 'kytiček'}.`;
          }
        }

        if (!firstReminderDate) {
          firstReminderDate = scheduledDateTime.toLocaleString('cs-CZ', {
            weekday: 'short',
            day: 'numeric',
            month: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        notificationsToSchedule.push({
          id: 1000 + dayOffset,
          title,
          body,
          schedule: {
            at: scheduledDateTime,
            allowWhileIdle: true,
          },
          channelId: CARE_CHANNEL_ID,
        });
      }
    }

    // 7. Zrušení starých a uložení nových do Android AlarmManageru
    await this.cancelAllReminders();

    if (Capacitor.isNativePlatform() && notificationsToSchedule.length > 0) {
      try {
        await LocalNotifications.schedule({
          notifications: notificationsToSchedule,
        });
      } catch (err) {
        console.error('LocalNotifications.schedule error:', err);
      }
    }

    // 8. Aktualizace času posledního přepočtu
    settings.lastScheduledAt = new Date().toISOString();
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignorovat
    }

    return {
      scheduledCount: notificationsToSchedule.length,
      nextReminderDate: firstReminderDate,
    };
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('kytickar-care-updated', () => {
    notificationService.rescheduleAllReminders().catch(() => {});
  });
}
