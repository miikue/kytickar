export type NavTab = 'kytky' | 'katalog' | 'pridat' | 'nastaveni';

type Props = {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDetailOpen?: boolean;
  onCancelDetail?: () => void;
  isCatalogEditing?: boolean;
  onCancelCatalogEdit?: () => void;
};

export default function BottomNavBar({
  activeTab,
  onTabChange,
  isDetailOpen = false,
  onCancelDetail,
  isCatalogEditing = false,
  onCancelCatalogEdit,
}: Props) {
  const isKytkyInDetail = activeTab === 'kytky' && isDetailOpen;
  const isKatalogInEdit = activeTab === 'katalog' && isCatalogEditing;

  return (
    <nav className="bottom-nav" aria-label="Hlavní navigace">
      {/* 1. Moje kytky / Zavřít detail */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'kytky' ? 'active' : ''} ${isKytkyInDetail ? 'cancel-mode' : ''}`}
        onClick={() => {
          if (isKytkyInDetail && onCancelDetail) {
            onCancelDetail();
          } else {
            onTabChange('kytky');
          }
        }}
        aria-label={isKytkyInDetail ? 'Zavřít detail' : 'Moje kytky'}
      >
        <span className="bottom-nav-icon">
          {isKytkyInDetail ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22v-9" />
              <path d="M12 13a5 5 0 0 0 5-5c0-4-5-6-5-6s-5 2-5 6a5 5 0 0 0 5 5z" fill={activeTab === 'kytky' ? 'currentColor' : 'none'} />
              <path d="M12 17c-2 0-4-1-4-3" />
              <path d="M12 15c2 0 4-1 4-3" />
            </svg>
          )}
        </span>
        <span className="bottom-nav-label">
          {isKytkyInDetail ? 'Zavřít' : 'Moje kytky'}
        </span>
      </button>

      {/* 2. Katalog / Zavřít editor */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'katalog' ? 'active' : ''} ${isKatalogInEdit ? 'cancel-mode' : ''}`}
        onClick={() => {
          if (isKatalogInEdit && onCancelCatalogEdit) {
            onCancelCatalogEdit();
          } else {
            onTabChange('katalog');
          }
        }}
        aria-label={isKatalogInEdit ? 'Zavřít editor' : 'Katalog'}
      >
        <span className="bottom-nav-icon">
          {isKatalogInEdit ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill={activeTab === 'katalog' ? 'currentColor' : 'none'} />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill={activeTab === 'katalog' ? 'currentColor' : 'none'} />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
            </svg>
          )}
        </span>
        <span className="bottom-nav-label">
          {isKatalogInEdit ? 'Zavřít' : 'Katalog'}
        </span>
      </button>

      {/* 3. Přidat kytku */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'pridat' ? 'active' : ''}`}
        onClick={() => onTabChange('pridat')}
        aria-label="Přidat"
      >
        <span className="bottom-nav-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" fill={activeTab === 'pridat' ? 'currentColor' : 'none'} />
            <line x1="12" y1="8" x2="12" y2="16" stroke={activeTab === 'pridat' ? '#ffffff' : 'currentColor'} />
            <line x1="8" y1="12" x2="16" y2="12" stroke={activeTab === 'pridat' ? '#ffffff' : 'currentColor'} />
          </svg>
        </span>
        <span className="bottom-nav-label">Přidat</span>
      </button>

      {/* 4. Nastavení */}
      <button
        type="button"
        className={`bottom-nav-item ${activeTab === 'nastaveni' ? 'active' : ''}`}
        onClick={() => onTabChange('nastaveni')}
        aria-label="Nastavení"
      >
        <span className="bottom-nav-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill={activeTab === 'nastaveni' ? 'currentColor' : 'none'} />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </span>
        <span className="bottom-nav-label">Nastavení</span>
      </button>
    </nav>
  );
}
