import { getFileUrl } from '../api/http';
import { isWateringAction } from '../services/localDb';
import type { Rostlina, RostlinaOdZaliti, TypAkce } from '../types/app';

type Props = {
  rostliny: Rostlina[];
  nejdelsiOdZaliti: RostlinaOdZaliti[];
  typyAkci: TypAkce[];
  activeStoryPlant: RostlinaOdZaliti | null;
  setActiveStoryPlant: (plant: RostlinaOdZaliti | null) => void;
  storyActionFeedback: string | null;
  setStoryActionFeedback: (feedback: string | null) => void;
  storyActionLoading: boolean;
  onQuickWater: (rostlinaId: number, vlastniJmeno: string) => Promise<void>;
  onQuickPostpone: (rostlinaId: number, vlastniJmeno: string) => Promise<void>;
  onOpenDetail: (rostlinaId: number) => void;
};

export default function PlantStories({
  rostliny,
  nejdelsiOdZaliti,
  typyAkci,
  activeStoryPlant,
  setActiveStoryPlant,
  storyActionFeedback,
  setStoryActionFeedback,
  storyActionLoading,
  onQuickWater,
  onQuickPostpone,
  onOpenDetail,
}: Props) {
  if (rostliny.length === 0) {
    return null;
  }

  const waterType = typyAkci.find((t) => t.isWatering) || typyAkci.find((t) => isWateringAction(t));
  const urgentThreshold = waterType?.intervalDny || 4;

  return (
    <>
      {nejdelsiOdZaliti.length > 0 ? (
        <section className="plant-stories-section">
          <div className="section-title-row">
            <span className="section-title-label">⚡ Potřebují péči</span>
            <span className="section-title-count">{nejdelsiOdZaliti.length}</span>
          </div>

          <div className="plant-stories-scroll">
            {nejdelsiOdZaliti.map((item) => {
              const overviewPlant = rostliny.find((rostlina) => rostlina.id === item.id) || null;
              const thumb = overviewPlant?.galerieFotky?.[0] || null;
              const isUrgent = item.dnyOdPoslednihoZaliti === null || item.dnyOdPoslednihoZaliti >= urgentThreshold;

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  className={`story-circle-item ${isUrgent ? 'story-urgent' : ''}`}
                  onClick={() => {
                    setStoryActionFeedback(null);
                    setActiveStoryPlant(item);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setStoryActionFeedback(null);
                      setActiveStoryPlant(item);
                    }
                  }}
                  title={`${item.vlastniJmeno} - klikněte pro rychlé akce`}
                >
                  <div className="story-ring">
                    <div className="story-avatar-wrap">
                      {thumb ? (
                        <img src={getFileUrl(thumb.fotkaName)} alt={item.vlastniJmeno} className="story-avatar-img" />
                      ) : (
                        <span className="story-avatar-emoji">🌱</span>
                      )}
                    </div>
                    <span className="story-badge">💧</span>
                  </div>
                  <span className="story-name">{item.vlastniJmeno}</span>
                  <span className="story-days">
                    {item.dnyOdPoslednihoZaliti === null ? 'Nezalito' : `${item.dnyOdPoslednihoZaliti} d`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="plant-stories-section">
          <div className="all-watered-banner">
            <div className="all-watered-icon-wrap">
              <span className="all-watered-icon">🌿</span>
            </div>
            <div className="all-watered-content">
              <strong>Všechny kytičky mají péči!</strong>
              <span>Žádná rostlina momentálně nepotřebuje zálivku.</span>
            </div>
            <span className="all-watered-check">✅</span>
          </div>
        </section>
      )}

      {/* QUICK STORY ACTION MODAL / SHEET */}
      {activeStoryPlant && (
        <div className="story-modal" role="dialog" aria-modal="true">
          <div
            className="story-modal-backdrop"
            onClick={() => {
              setActiveStoryPlant(null);
              setStoryActionFeedback(null);
            }}
          />
          <div className="story-modal-card">
            <button
              type="button"
              className="story-modal-close"
              onClick={() => {
                setActiveStoryPlant(null);
                setStoryActionFeedback(null);
              }}
              aria-label="Zavřít"
            >
              ✕
            </button>

            {(() => {
              const fullPlant = rostliny.find((r) => r.id === activeStoryPlant.id);
              const thumb = fullPlant?.galerieFotky?.[0];
              return (
                <>
                  <div className="story-modal-hero">
                    {thumb ? (
                      <img
                        src={getFileUrl(thumb.fotkaName)}
                        alt={activeStoryPlant.vlastniJmeno}
                        className="story-modal-image"
                      />
                    ) : (
                      <div className="story-modal-placeholder">🌿</div>
                    )}
                    <div className="story-modal-badge">
                      {activeStoryPlant.dnyOdPoslednihoZaliti === null
                        ? 'Zatím bez zálivky'
                        : `Nezalito ${activeStoryPlant.dnyOdPoslednihoZaliti} dní`}
                    </div>
                  </div>

                  <div className="story-modal-info">
                    <h3 className="story-modal-title">{activeStoryPlant.vlastniJmeno}</h3>
                    <p className="story-modal-species">
                      {activeStoryPlant.druh.nazev}
                      {activeStoryPlant.druh.rodNazev ? ` • ${activeStoryPlant.druh.rodNazev}` : ''}
                    </p>
                    {fullPlant?.umisteni && (
                      <span className="story-modal-location">📍 {fullPlant.umisteni.nazev}</span>
                    )}
                  </div>

                  {storyActionFeedback && (
                    <div className="story-modal-feedback">{storyActionFeedback}</div>
                  )}

                  <div className="story-modal-actions">
                    <button
                      type="button"
                      className="story-action-btn primary"
                      disabled={storyActionLoading}
                      onClick={() => onQuickWater(activeStoryPlant.id, activeStoryPlant.vlastniJmeno)}
                    >
                      💧 Zalít nyní
                    </button>
                    <button
                      type="button"
                      className="story-action-btn secondary"
                      disabled={storyActionLoading}
                      onClick={() => onQuickPostpone(activeStoryPlant.id, activeStoryPlant.vlastniJmeno)}
                    >
                      ⏳ Odložit o 2 dny
                    </button>
                    <button
                      type="button"
                      className="story-action-btn ghost"
                      onClick={() => {
                        const id = activeStoryPlant.id;
                        setActiveStoryPlant(null);
                        onOpenDetail(id);
                      }}
                    >
                      🔍 Otevřít celou kartu
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
