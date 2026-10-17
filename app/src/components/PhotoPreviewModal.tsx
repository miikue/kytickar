import { useEffect } from 'react';
import { getFileUrl } from '../api/http';
import type { GalerieFotka } from '../types/app';
import { useBackButton } from '../hooks/useBackButton';

type Props = {
  photo: GalerieFotka | null;
  onClose: () => void;
  onDelete: () => Promise<void>;
};

export default function PhotoPreviewModal({ photo, onClose, onDelete }: Props) {
  useBackButton('photo-preview-modal', 100, photo !== null, () => {
    onClose();
    return true;
  });

  useEffect(() => {
    if (!photo) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo, onClose]);

  if (!photo) return null;

  return (
    <div className="photo-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="photo-modal-backdrop"
        onClick={onClose}
        aria-label="Zavřít detail fotky"
      />
      <div className="photo-modal-panel">
        <img
          src={getFileUrl(photo.fotkaName)}
          alt={photo.poznamka || 'Zvětšená fotka'}
          className="photo-modal-image"
        />
        <div className="photo-modal-meta">
          <p>Datum pořízení: {new Date(photo.datumPorizeni).toLocaleDateString('cs-CZ')}</p>
          {photo.poznamka && <p>Poznámka: {photo.poznamka}</p>}
        </div>
        <div className="photo-modal-actions form-actions">
          <button
            type="button"
            className="icon-button modal-icon-button danger"
            onClick={onDelete}
            title="Smazat fotku"
            aria-label="Smazat fotku"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h2v9H7V9Zm4 0h2v9h-2V9Zm4 0h2v9h-2V9Z" fill="currentColor" />
            </svg>
          </button>
          <a
            className="icon-button modal-icon-button"
            href={getFileUrl(photo.fotkaName)}
            download={photo.fotkaName}
            target="_blank"
            rel="noreferrer"
            title="Stáhnout fotku"
            aria-label="Stáhnout fotku"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3v10.17l3.59-3.58L17 11l-5 5-5-5 1.41-1.41L11 13.17V3Zm-7 14h14v3H5Z" fill="currentColor" />
            </svg>
          </a>
          <button type="button" className="button secondary" onClick={onClose}>
            Zavřít
          </button>
        </div>
      </div>
    </div>
  );
}
