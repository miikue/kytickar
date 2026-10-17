import { useEffect, useState } from 'react';
import { pickPhoto } from '../services/cameraService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (file: File) => void;
  title?: string;
  subtitle?: string;
};

export default function PhotoSourceModal({
  isOpen,
  onClose,
  onPhotoSelected,
  title = 'Přidat fotografii',
  subtitle = 'Vyberte způsob pořízení snímku',
}: Props) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSelect(source: 'camera' | 'photos') {
    try {
      setLoading(true);
      const file = await pickPhoto(source);
      if (file) {
        onPhotoSelected(file);
        onClose();
      }
    } catch (err) {
      console.error('Chyba při výběru fotografie:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="photo-source-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="photo-source-modal-title">
      <div className="photo-source-modal-backdrop" onClick={onClose} />
      <div className="photo-source-modal-content">
        <div className="photo-source-modal-handle" />
        
        <div className="photo-source-modal-header">
          <h3 id="photo-source-modal-title" className="photo-source-modal-title">{title}</h3>
          <p className="photo-source-modal-subtitle">{subtitle}</p>
        </div>

        {loading ? (
          <div className="photo-source-loading">
            <span className="photo-source-spinner" />
            <span>Otevírám...</span>
          </div>
        ) : (
          <div className="photo-source-options">
            <button
              type="button"
              className="photo-source-btn camera-btn"
              onClick={() => handleSelect('camera')}
              disabled={loading}
            >
              <div className="photo-source-icon-wrap camera-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <div className="photo-source-btn-text">
                <strong className="photo-source-btn-title">Vyfotit fotoaparátem</strong>
                <span className="photo-source-btn-desc">Pořídit novou fotku přímo v aplikaci</span>
              </div>
              <span className="photo-source-arrow">›</span>
            </button>

            <button
              type="button"
              className="photo-source-btn gallery-btn"
              onClick={() => handleSelect('photos')}
              disabled={loading}
            >
              <div className="photo-source-icon-wrap gallery-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div className="photo-source-btn-text">
                <strong className="photo-source-btn-title">Vybrat z galerie</strong>
                <span className="photo-source-btn-desc">Vybrat existující fotku z paměti telefonu</span>
              </div>
              <span className="photo-source-arrow">›</span>
            </button>
          </div>
        )}

        <button
          type="button"
          className="photo-source-cancel-btn"
          onClick={onClose}
          disabled={loading}
        >
          Zrušit
        </button>
      </div>
    </div>
  );
}
