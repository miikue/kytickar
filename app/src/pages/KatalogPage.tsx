import { useEffect, useState } from 'react';
import DruhyPage from './DruhyPage';
import MediaPage from './MediaPage';
import RodyPage from './RodyPage';
import UmisteniPage from './UmisteniPage';
import TypyAkciPage from './TypyAkciPage';
import type { Druh, Medium, Rod, TypAkce, Umisteni } from '../types/app';
import type { useDruhyManager } from '../hooks/useDruhyManager';
import type { useMediaManager } from '../hooks/useMediaManager';
import type { useRodyManager } from '../hooks/useRodyManager';
import type { useUmisteniManager } from '../hooks/useUmisteniManager';
import type { useTypyAkciManager } from '../hooks/useTypyAkciManager';

type KatalogSubTab = 'druhy' | 'rody' | 'media' | 'umisteni' | 'akce';

type Props = {
  druhy: Druh[];
  media: Medium[];
  rody: Rod[];
  umisteni: Umisteni[];
  typyAkci: TypAkce[];
  druhyManager: ReturnType<typeof useDruhyManager>;
  mediaManager: ReturnType<typeof useMediaManager>;
  rodyManager: ReturnType<typeof useRodyManager>;
  umisteniManager: ReturnType<typeof useUmisteniManager>;
  typyAkciManager: ReturnType<typeof useTypyAkciManager>;
  resetTrigger?: number;
  onEditingChange?: (isEditing: boolean) => void;
};

export default function KatalogPage({
  druhy,
  media,
  rody,
  umisteni,
  typyAkci,
  druhyManager,
  mediaManager,
  rodyManager,
  umisteniManager,
  typyAkciManager,
  resetTrigger,
  onEditingChange,
}: Props) {
  const [subTab, setSubTab] = useState<KatalogSubTab>('druhy');

  const isEditing = Boolean(
    druhyManager.editingDruhId !== null ||
    rodyManager.editingRodId !== null ||
    mediaManager.editingMediaId !== null ||
    umisteniManager.editingUmisteniId !== null ||
    typyAkciManager.editingTypAkceId !== null
  );

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    if (resetTrigger) {
      druhyManager.setEditingDruhId(null);
      rodyManager.setEditingRodId(null);
      mediaManager.setEditingMediaId(null);
      umisteniManager.setEditingUmisteniId(null);
      typyAkciManager.setEditingTypAkceId(null);
    }
  }, [resetTrigger]);

  const tabs: Array<{ id: KatalogSubTab; label: string; count: number; icon: string }> = [
    { id: 'druhy', label: 'Druhy', count: druhy.length, icon: '🌿' },
    { id: 'rody', label: 'Rody', count: rody.length, icon: '🌱' },
    { id: 'media', label: 'Substráty', count: media.length, icon: '🪴' },
    { id: 'umisteni', label: 'Umístění', count: umisteni.length, icon: '📍' },
    { id: 'akce', label: 'Typy péče', count: typyAkci.length, icon: '💧' },
  ];

  return (
    <section className="catalog-screen">
      <header className="mobile-page-header">
        <h2 className="mobile-page-title">Katalog & Parametry</h2>
        <p className="mobile-page-subtitle">Kategorizace, substráty, umístění a péče</p>
      </header>

      <div className="catalog-tab-strip" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={subTab === tab.id}
            className={`catalog-tab-btn ${subTab === tab.id ? 'active' : ''}`}
            onClick={() => setSubTab(tab.id)}
          >
            <span className="catalog-tab-btn-icon">{tab.icon}</span>
            <span className="catalog-tab-btn-label">{tab.label}</span>
            <span className="catalog-tab-btn-badge">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="catalog-tab-content">
        {subTab === 'druhy' && (
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
            setDruhMessage={druhyManager.setDruhMessage}
          />
        )}

        {subTab === 'rody' && (
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

        {subTab === 'media' && (
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

        {subTab === 'umisteni' && (
          <UmisteniPage
            umisteni={umisteni}
            editingUmisteniId={umisteniManager.editingUmisteniId}
            setEditingUmisteniId={umisteniManager.setEditingUmisteniId}
            umisteniForm={umisteniManager.umisteniForm}
            setUmisteniForm={umisteniManager.setUmisteniForm}
            submitUmisteni={umisteniManager.submitUmisteni}
            removeUmisteni={umisteniManager.removeUmisteni}
            umisteniMessage={umisteniManager.umisteniMessage}
            setUmisteniMessage={umisteniManager.setUmisteniMessage}
          />
        )}

        {subTab === 'akce' && (
          <TypyAkciPage
            typyAkci={typyAkci}
            editingTypAkceId={typyAkciManager.editingTypAkceId}
            setEditingTypAkceId={typyAkciManager.setEditingTypAkceId}
            typAkceNazev={typyAkciManager.typAkceNazev}
            setTypAkceNazev={typyAkciManager.setTypAkceNazev}
            typAkceIkona={typyAkciManager.typAkceIkona}
            setTypAkceIkona={typyAkciManager.setTypAkceIkona}
            typAkceInterval={typyAkciManager.typAkceInterval}
            setTypAkceInterval={typyAkciManager.setTypAkceInterval}
            typAkceOdlozit={typyAkciManager.typAkceOdlozit}
            setTypAkceOdlozit={typyAkciManager.setTypAkceOdlozit}
            submitTypAkce={typyAkciManager.submitTypAkce}
            removeTypAkce={typyAkciManager.removeTypAkce}
            typAkceMessage={typyAkciManager.typAkceMessage}
            setTypAkceMessage={typyAkciManager.setTypAkceMessage}
          />
        )}
      </div>
    </section>
  );
}
