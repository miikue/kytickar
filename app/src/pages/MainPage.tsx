import { useState } from 'react';
import TopNavButton from '../components/TopNavButton';
import KytkyPage from './KytkyPage.tsx';
import DruhyPage from './DruhyPage.tsx';
import MediaPage from './MediaPage.tsx';
import RodyPage from './RodyPage.tsx';
import PridatKytkuPage from './PridatKytkuPage.tsx';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDruhyManager } from '../hooks/useDruhyManager';
import { useMediaManager } from '../hooks/useMediaManager';
import { useRodyManager } from '../hooks/useRodyManager';
import { useRostlinyManager } from '../hooks/useRostlinyManager';
import type { TabKey } from '../types/app';

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('kytky');
  const { rostliny, druhy, rody, media, umisteni, loading, error, reload } = useDashboardData();

  const druhyManager = useDruhyManager(reload);
  const mediaManager = useMediaManager(reload);
  const rodyManager = useRodyManager(reload);
  const rostlinyManager = useRostlinyManager(reload, () => setActiveTab('kytky'));

  return (
    <main className="shell">
      <header className="top-row" aria-label="Hlavni navigace">
        <section className="tabs" aria-label="Hlavni zalozky">
          <button type="button" className={`tab-button ${activeTab === 'kytky' ? 'active' : ''}`} onClick={() => setActiveTab('kytky')}>
            Kytky
          </button>
          <button type="button" className={`tab-button ${activeTab === 'druhy' ? 'active' : ''}`} onClick={() => setActiveTab('druhy')}>
            Druhy
          </button>
          <button type="button" className={`tab-button ${activeTab === 'media' ? 'active' : ''}`} onClick={() => setActiveTab('media')}>
            Media
          </button>
          <button type="button" className={`tab-button ${activeTab === 'rody' ? 'active' : ''}`} onClick={() => setActiveTab('rody')}>
            Rody
          </button>
          <button type="button" className={`tab-button ${activeTab === 'pridat' ? 'active' : ''}`} onClick={() => setActiveTab('pridat')}>
            Pridat kytku
          </button>
        </section>
        <TopNavButton />
      </header>

      <section className="workspace-head">
        <p className="eyebrow">Kytickar</p>
        <h1>Sprava rostlin</h1>
        <p className="lead">Prepinani mezi seznamem kytek, editaci druhu a pridavanim nove rostliny.</p>
      </section>

      {loading && <section className="panel-single">Nacitam data...</section>}
      {error && !loading && <section className="panel-single error-box">Chyba: {error}</section>}

      {!loading && !error && activeTab === 'kytky' && <KytkyPage rostliny={rostliny} druhy={druhy} media={media} umisteni={umisteni} onReload={reload} />}

      {!loading && !error && activeTab === 'druhy' && (
        <DruhyPage
          druhy={druhy}
          editingDruhId={druhyManager.editingDruhId}
          setEditingDruhId={druhyManager.setEditingDruhId}
          druhForm={druhyManager.druhForm}
          setDruhForm={druhyManager.setDruhForm}
          uploadingDruhPhotos={druhyManager.uploadingDruhPhotos}
          setUploadingDruhPhotos={druhyManager.setUploadingDruhPhotos}
          uploadedDruhPhotoNames={druhyManager.uploadedDruhPhotoNames}
          setUploadedDruhPhotoNames={druhyManager.setUploadedDruhPhotoNames}
          rody={rody}
          submitDruh={druhyManager.submitDruh}
          removeDruh={druhyManager.removeDruh}
          druhMessage={druhyManager.druhMessage}
        />
      )}

      {!loading && !error && activeTab === 'media' && (
        <MediaPage
          media={media}
          editingMediaId={mediaManager.editingMediaId}
          setEditingMediaId={mediaManager.setEditingMediaId}
          mediaNazev={mediaManager.mediaNazev}
          setMediaNazev={mediaManager.setMediaNazev}
          mediaPopis={mediaManager.mediaPopis}
          setMediaPopis={mediaManager.setMediaPopis}
          submitMedia={mediaManager.submitMedia}
          removeMedia={mediaManager.removeMedia}
          mediaMessage={mediaManager.mediaMessage}
          setMediaMessage={mediaManager.setMediaMessage}
        />
      )}

      {!loading && !error && activeTab === 'rody' && (
        <RodyPage
          rody={rody}
          editingRodId={rodyManager.editingRodId}
          setEditingRodId={rodyManager.setEditingRodId}
          rodNazev={rodyManager.rodNazev}
          setRodNazev={rodyManager.setRodNazev}
          rodPopis={rodyManager.rodPopis}
          setRodPopis={rodyManager.setRodPopis}
          submitRod={rodyManager.submitRod}
          removeRod={rodyManager.removeRod}
          rodMessage={rodyManager.rodMessage}
          setRodMessage={rodyManager.setRodMessage}
        />
      )}

      {!loading && !error && activeTab === 'pridat' && (
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
        />
      )}
    </main>
  );
}
