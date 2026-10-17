import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { localDb, isWateringAction } from './localDb';
import { backupService } from './backupService';

export interface NotificationSettings {
  enabled: boolean;
  time: string; // e.g. "09:00"
  lastScheduledAt: string | null;
}

const SETTINGS_STORAGE_KEY = 'kytickar_notification_settings';
const CARE_CHANNEL_ID = 'kytickar-care';
const BACKUP_CHANNEL_ID = 'kytickar-backup';
const BACKUP_NOTIFICATION_ID = 8888;

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

      await LocalNotifications.createChannel({
        id: BACKUP_CHANNEL_ID,
        name: 'Připomínka zálohování',
        description: 'Upozornění na pravidelnou dvouměsíční zálohu rostlin a fotografií',
        importance: 3, // Default importance
        vibration: true,
        visibility: 1,
      });

      // Registrace akčních tlačítek přímo v notifikaci
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'CARE_SINGLE_WATER',
            actions: [
              { id: 'water', title: '💧 Zalito' },
              { id: 'snooze', title: '⏰ Odložit (2 dny)' },
            ],
          },
          {
            id: 'CARE_MULTIPLE',
            actions: [
              { id: 'snooze_all', title: '⏰ Odložit vše (2 dny)' },
            ],
          },
        ],
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
        icon: '/favicon.png',
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

    // Filtrujeme pouze živé rostliny
    const activePlants = rostliny.filter((p) => (p.aktualniZdravi ?? 1) > 0);

    if (activePlants.length === 0) {
      await this.cancelAllReminders();
      return { scheduledCount: 0, nextReminderDate: null };
    }

    // Identifikujeme typy akcí pro zalévání (notifikace se zaměřují výhradně na zalévání)
    const wateringTypes = typyAkci.filter((t) => t.isWatering || isWateringAction(t));
    const wateringTypeIds = new Set(wateringTypes.map((t) => t.id));
    const primaryWateringType = wateringTypes[0];

    if (!primaryWateringType) {
      await this.cancelAllReminders();
      return { scheduledCount: 0, nextReminderDate: null };
    }

    // 4. Parsování času notifikace (např. "09:00")
    const [hoursStr, minutesStr] = settings.time.split(':');
    const reminderHours = parseInt(hoursStr || '9', 10);
    const reminderMinutes = parseInt(minutesStr || '0', 10);

    // 5. Analýza termínů zálivky pro každou živou rostlinu
    type PlantWateringTask = {
      plantId: number;
      plantName: string;
      dueDate: Date;
    };

    const dueTasks: PlantWateringTask[] = [];
    const now = new Date();

    for (const plant of activePlants) {
      const intervalDny = primaryWateringType.intervalDny || 7;

      // Poslední provedení zálivky
      const plantHistory = historie
        .filter((h) => h.rostlinaId === plant.id && wateringTypeIds.has(h.typAkceId))
        .sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());

      const lastDate = plantHistory.length > 0
        ? new Date(plantHistory[0].datum)
        : new Date(plant.datumPorizeni || now.toISOString());

      // Kontrola aktivního odložení (snooze)
      const activeSnooze = odlozene.find(
        (o) => o.rostlinaId === plant.id && wateringTypeIds.has(o.typAkceId) && new Date(o.datumPripomenuti) > lastDate
      );

      let dueDate: Date;
      if (activeSnooze) {
        dueDate = new Date(activeSnooze.datumPripomenuti);
      } else {
        dueDate = new Date(
          lastDate.getFullYear(),
          lastDate.getMonth(),
          lastDate.getDate() + intervalDny,
          reminderHours,
          reminderMinutes,
          0,
          0
        );
      }

      dueTasks.push({
        plantId: plant.id,
        plantName: plant.vlastniJmeno,
        dueDate,
      });
    }

    // 6. Seskupení úkolů do příštích 30 kalendářních dnů
    // - Pro každý den zjišťujeme, které rostliny mají termín zálivky
    // - Opakování po termínu je omezeno na max. 2 dny (starší resty z minulých měsíců nespamují!)
    // - Notifikace počítá a uvádí unikátní rostliny, nikoliv úkoly
    const maxOverdueDays = 2;
    const notificationsToSchedule: any[] = [];
    let firstReminderDate: string | null = null;

    for (let dayOffset = 0; dayOffset <= 30; dayOffset++) {
      const targetDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 0, 0, 0, 0);
      const targetDayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, 23, 59, 59, 999);

      // Přesný čas odeslání notifikace v daný den (např. 09:00 ráno)
      const scheduledDateTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + dayOffset,
        reminderHours,
        reminderMinutes,
        0,
        0
      );

      // Pokud je to dnešek a zvolený čas už dnes uplynul, dnešní notifikaci nepřidáváme
      if (dayOffset === 0 && scheduledDateTime.getTime() <= now.getTime()) {
        continue;
      }

      // Hranice pro prošlé zálivky (maximálně 2 dny před začátkem cílového dne)
      const overdueCutoff = new Date(
        targetDayStart.getFullYear(),
        targetDayStart.getMonth(),
        targetDayStart.getDate() - maxOverdueDays,
        0,
        0,
        0,
        0
      );

      // Rostliny, které mají splatnost v daný den nebo max. 2 dny po termínu
      const plantsForDay = dueTasks.filter(
        (t) => t.dueDate >= overdueCutoff && t.dueDate <= targetDayEnd
      );

      if (plantsForDay.length > 0) {
        // Deduplikace na unikátní rostliny
        const uniquePlantsMap = new Map<number, string>();
        for (const t of plantsForDay) {
          uniquePlantsMap.set(t.plantId, t.plantName);
        }

        const plantIds = Array.from(uniquePlantsMap.keys());
        const plantNames = Array.from(uniquePlantsMap.values());
        const plantCount = plantIds.length;

        let title = '🌿 Kytičkář – Čas na zálivku';
        let body = '';
        let actionTypeId: string | undefined;
        const extra: any = { dayOffset, isWatering: true };

        if (plantCount === 1) {
          title = `💧 ${plantNames[0]}`;
          body = 'Je čas na zálivku!';
          extra.plantId = plantIds[0];
          actionTypeId = 'CARE_SINGLE_WATER';
        } else if (plantCount <= 3) {
          body = `Dnes potřebují zalít: ${plantNames.join(', ')}`;
          actionTypeId = 'CARE_MULTIPLE';
          extra.plantIds = plantIds;
        } else {
          body = `Dnes čeká zálivka celkem ${plantCount} ${plantCount < 5 ? 'kytičky' : 'kytiček'}.`;
          actionTypeId = 'CARE_MULTIPLE';
          extra.plantIds = plantIds;
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
          actionTypeId,
          extra,
          schedule: {
            at: scheduledDateTime,
            allowWhileIdle: true,
          },
          channelId: CARE_CHANNEL_ID,
        });
      }
    }

    // 6b. Připomínka pravidelné dvouměsíční zálohy (ID: 8888)
    if (rostliny.length > 0) {
      const backupStatus = backupService.getBackupStatus();
      let scheduledBackupAt: Date;
      if (backupStatus.isDue) {
        // Pokud uplynulo 60 dní nebo záloha nikdy neproběhla, naplánovat na nejbližších 10:00 dopoledne
        const candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0);
        if (candidate.getTime() <= now.getTime()) {
          scheduledBackupAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0, 0, 0);
        } else {
          scheduledBackupAt = candidate;
        }
      } else {
        scheduledBackupAt = backupStatus.nextBackupDate;
      }

      notificationsToSchedule.push({
        id: BACKUP_NOTIFICATION_ID,
        title: '📦 Kytičkář – Čas na zálohu',
        body: 'Od poslední zálohy uplynuly 2 měsíce. Nezapomeňte si v Nastavení stáhnout aktuální ZIP balíček!',
        schedule: {
          at: scheduledBackupAt,
          allowWhileIdle: true,
        },
        channelId: BACKUP_CHANNEL_ID,
      });
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
  window.addEventListener('kytickar-backup-completed', () => {
    notificationService.rescheduleAllReminders().catch(() => {});
  });
}
