import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import BottomNavBar, { type NavTab } from '../components/BottomNavBar';
import KytkyPage from './KytkyPage';
import KatalogPage from './KatalogPage';
import PridatKytkuPage from './PridatKytkuPage';
import SettingsPage from './SettingsPage';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDruhyManager } from '../hooks/useDruhyManager';
import { useMediaManager } from '../hooks/useMediaManager';
import { useRodyManager } from '../hooks/useRodyManager';
import { useRostlinyManager } from '../hooks/useRostlinyManager';
import { useUmisteniManager } from '../hooks/useUmisteniManager';
import { useTypyAkciManager } from '../hooks/useTypyAkciManager';
import { logActivity } from '../api/activityApi';
import { notificationService } from '../services/notificationService';
import { localDb } from '../services/localDb';
import { setPhotoUrlCache } from '../api/http';

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('kytky');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCatalogEditing, setIsCatalogEditing] = useState(false);
  const [kytkyResetCounter, setKytkyResetCounter] = useState(0);
  const [catalogResetCounter, setCatalogResetCounter] = useState(0);
  const { rostliny, druhy, rody, media, umisteni, typyAkci, loading, error, reload } = useDashboardData();

  useEffect(() => {
    // 1. Přepočet a aktualizace systémových připomínek při spuštění aplikace
    notificationService.rescheduleAllReminders().catch(() => {});

    // 2. Reakce na klepnutí na notifikaci v liště telefonu (přepne do Moje kytky)
    if (Capacitor.isNativePlatform()) {
      const listenerPromise = LocalNotifications.addListener('localNotificationActionPerformed', () => {
        setActiveTab('kytky');
        setIsDetailOpen(false);
      });

      return () => {
        listenerPromise.then((handle) => handle.remove()).catch(() => {});
      };
    }

    // 3. Předehřátí mezipaměti fotografií z IndexedDB
    localDb.getAllPhotos().then((photos) => {
      for (const p of photos) {
        if (p.dataUrl) setPhotoUrlCache(p.fileName, p.dataUrl);
      }
    }).catch(() => {});
  }, []);

  const handleCancelDetail = () => {
    setKytkyResetCounter((c) => c + 1);
    setIsDetailOpen(false);
  };

  const handleCancelCatalogEdit = () => {
    setCatalogResetCounter((c) => c + 1);
    setIsCatalogEditing(false);
  };

  const handleTabChange = (nextTab: NavTab) => {
    if (nextTab === 'kytky') {
      if (activeTab === 'kytky' && isDetailOpen) {
        handleCancelDetail();
        return;
      }
      handleCancelDetail();
      setActiveTab('kytky');
    } else if (nextTab === 'katalog') {
      if (activeTab === 'katalog' && isCatalogEditing) {
        handleCancelCatalogEdit();
        return;
      }
      setActiveTab('katalog');
    } else {
      setActiveTab(nextTab);
    }
  };

  const druhyManager = useDruhyManager(reload);
  const mediaManager = useMediaManager(reload);
  const rodyManager = useRodyManager(reload);
  const umisteniManager = useUmisteniManager(reload);
  const typyAkciManager = useTypyAkciManager(reload);
  const rostlinyManager = useRostlinyManager(reload, () => {
    handleCancelDetail();
    setActiveTab('kytky');
  });

  useEffect(() => {
    const labels: Record<NavTab, string> = {
      kytky: 'Moje kytky',
      katalog: 'Katalog',
      pridat: 'Přidat kytku',
      nastaveni: 'Nastavení',
    };

    void logActivity({ eventType: 'tab_view', section: activeTab, label: labels[activeTab] }).catch(() => undefined);
  }, [activeTab]);

  return (
    <div className="mobile-app-container">
      {/* Mobile Top App Bar - skryta, kdyz je otevren detail kytky */}
      {(!isDetailOpen || activeTab !== 'kytky') && (
        <header className="mobile-top-bar">
          <div className="mobile-brand">
            <span className="brand-logo-icon">🌿</span>
            <span className="brand-title">Kytičkář</span>
          </div>
        </header>
      )}

      {/* Main scrollable content view */}
      <main className="mobile-main-content">
        {loading && rostliny.length === 0 && (
          <section className="mobile-feedback-card">
            <span className="feedback-spinner">⏳</span>
            <p>Načítám kytičky a data...</p>
          </section>
        )}

        {error && !loading && (
          <section className="mobile-feedback-card error-card">
            <span className="feedback-icon">⚠️</span>
            <p>Chyba při načítání: {error}</p>
            <button type="button" className="action-button secondary" onClick={() => reload(false)}>
              Zkusit znovu
            </button>
          </section>
        )}

        {(!loading || rostliny.length > 0) && !error && activeTab === 'kytky' && (
          <KytkyPage
            rostliny={rostliny}
            druhy={druhy}
            media={media}
            umisteni={umisteni}
            onReload={reload}
            onDetailOpenChange={setIsDetailOpen}
            resetTrigger={kytkyResetCounter}
          />
        )}

        {(!loading || rostliny.length > 0) && !error && activeTab === 'katalog' && (
          <KatalogPage
            druhy={druhy}
            media={media}
            rody={rody}
            umisteni={umisteni}
            typyAkci={typyAkci}
            rostliny={rostliny}
            onSelectDruhForAdd={(druhId) => {
              rostlinyManager.setNewPlant((prev) => ({ ...prev, druhId: String(druhId) }));
              setActiveTab('pridat');
            }}
            druhyManager={druhyManager}
            mediaManager={mediaManager}
            rodyManager={rodyManager}
            umisteniManager={umisteniManager}
            typyAkciManager={typyAkciManager}
            resetTrigger={catalogResetCounter}
            onEditingChange={setIsCatalogEditing}
          />
        )}

        {(!loading || rostliny.length > 0) && !error && activeTab === 'pridat' && (
          <section className="pridat-screen">
            <header className="mobile-page-header">
              <h2 className="mobile-page-title">Nová kytička</h2>
              <p className="mobile-page-subtitle">Zadejte název, druh, substrát a výchozí fotografii</p>
            </header>
            <PridatKytkuPage
              form={rostlinyManager.newPlant}
              setForm={rostlinyManager.setNewPlant}
              initialPhoto={rostlinyManager.initialPhoto}
              setInitialPhoto={rostlinyManager.setInitialPhoto}
              initialPhotoMessage={rostlinyManager.initialPhotoMessage}
              setInitialPhotoMessage={rostlinyManager.setInitialPhotoMessage}
              druhy={druhy}
              rody={rody}
              media={media}
              umisteni={umisteni}
              onSubmit={rostlinyManager.submitRostlina}
              message={rostlinyManager.plantMessage}
              showNewDruhForm={rostlinyManager.showNewDruhForm}
              setShowNewDruhForm={rostlinyManager.setShowNewDruhForm}
              newDruhNazev={rostlinyManager.newDruhNazev}
              setNewDruhNazev={rostlinyManager.setNewDruhNazev}
              newDruhPopis={rostlinyManager.newDruhPopis}
              setNewDruhPopis={rostlinyManager.setNewDruhPopis}
              newDruhMessage={rostlinyManager.newDruhMessage}
              newDruhRodId={rostlinyManager.newDruhRodId}
              setNewDruhRodId={rostlinyManager.setNewDruhRodId}
              showNewDruhRodForm={rostlinyManager.showNewDruhRodForm}
              setShowNewDruhRodForm={rostlinyManager.setShowNewDruhRodForm}
              newDruhRodNazev={rostlinyManager.newDruhRodNazev}
              setNewDruhRodNazev={rostlinyManager.setNewDruhRodNazev}
              newDruhRodPopis={rostlinyManager.newDruhRodPopis}
              setNewDruhRodPopis={rostlinyManager.setNewDruhRodPopis}
              newDruhRodMessage={rostlinyManager.newDruhRodMessage}
              createInlineDruh={rostlinyManager.createInlineDruh}
              createInlineDruhRod={rostlinyManager.createInlineDruhRod}
              showNewMediumForm={rostlinyManager.showNewMediumForm}
              setShowNewMediumForm={rostlinyManager.setShowNewMediumForm}
              newMediumNazev={rostlinyManager.newMediumNazev}
              setNewMediumNazev={rostlinyManager.setNewMediumNazev}
              newMediumPopis={rostlinyManager.newMediumPopis}
              setNewMediumPopis={rostlinyManager.setNewMediumPopis}
              newMediumMessage={rostlinyManager.newMediumMessage}
              createInlineMedium={rostlinyManager.createInlineMedium}
              showNewUmisteniForm={rostlinyManager.showNewUmisteniForm}
              setShowNewUmisteniForm={rostlinyManager.setShowNewUmisteniForm}
              newUmisteniNazev={rostlinyManager.newUmisteniNazev}
              setNewUmisteniNazev={rostlinyManager.setNewUmisteniNazev}
              newUmisteniMessage={rostlinyManager.newUmisteniMessage}
              createInlineUmisteni={rostlinyManager.createInlineUmisteni}
              onCancel={() => setActiveTab('kytky')}
            />
          </section>
        )}

        {(!loading || rostliny.length > 0) && !error && activeTab === 'nastaveni' && (
          <SettingsPage onDataReload={reload} />
        )}
      </main>

      {/* Fixed Mobile Bottom Navigation */}
      <BottomNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDetailOpen={isDetailOpen}
        onCancelDetail={handleCancelDetail}
        isCatalogEditing={isCatalogEditing}
        onCancelCatalogEdit={handleCancelCatalogEdit}
      />
    </div>
  );
}
