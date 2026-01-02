import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAppDispatch, useIsMobile } from '@/app/hooks';
import { resetAll, loadMessages, loadObjects, loadVocabulary, loadViews } from '@/features/translations/translationsSlice';
import { MessagesTable } from '@/features/translations/MessagesTable';
import { ObjectsTable } from '@/features/translations/ObjectsTable';
import { VocabularyTable } from '@/features/translations/VocabularyTable';
import { ViewsTable } from '@/features/translations/ViewsTable';
import { SaveStatusIndicator } from '@/components/SaveStatusIndicator';
import './App.css';

// Use VITE_BASE env var if set, otherwise default to /agi-ivrit
const basename = (import.meta.env.VITE_BASE || '/agi-ivrit').replace(/\/$/, '');

function AppContent() {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleResetAll = () => {
    if (confirm('לאפס את כל התרגומים לערכים המקוריים? לא ניתן לבטל פעולה זו.')) {
      dispatch(resetAll());
      dispatch(loadMessages());
      dispatch(loadObjects());
      dispatch(loadVocabulary());
      dispatch(loadViews());
    }
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>בדיקת תרגום</h1>
        {isMobile && (
          <>
            <SaveStatusIndicator />
            <div className="mobile-header-controls">
              <button onClick={handleResetAll} className="reset-all-button">
                איפוס הכל
              </button>
              <button
                className={`hamburger-button ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="תפריט"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </>
        )}
        <nav className={`tab-navigation ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/messages" className={({ isActive }) => (isActive ? 'tab active' : 'tab')} onClick={handleNavClick}>
            הודעות
          </NavLink>
          <NavLink to="/objects" className={({ isActive }) => (isActive ? 'tab active' : 'tab')} onClick={handleNavClick}>
            פריטים
          </NavLink>
          <NavLink to="/vocabulary" className={({ isActive }) => (isActive ? 'tab active' : 'tab')} onClick={handleNavClick}>
            אוצר מילים
          </NavLink>
          <NavLink to="/views" className={({ isActive }) => (isActive ? 'tab active' : 'tab')} onClick={handleNavClick}>
            תיאורים
          </NavLink>
        </nav>
        {!isMobile && (
          <>
            <SaveStatusIndicator />
            <button onClick={handleResetAll} className="reset-all-button">
              איפוס הכל
            </button>
          </>
        )}
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/messages" replace />} />
          <Route path="/messages" element={<MessagesTable />} />
          <Route path="/objects" element={<ObjectsTable />} />
          <Route path="/vocabulary" element={<VocabularyTable />} />
          <Route path="/views" element={<ViewsTable />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter basename={basename}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
