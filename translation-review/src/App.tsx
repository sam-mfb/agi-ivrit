import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { MessagesTable } from '@/features/translations/MessagesTable';
import { ObjectsTable } from '@/features/translations/ObjectsTable';
import { VocabularyTable } from '@/features/translations/VocabularyTable';
import { ViewsTable } from '@/features/translations/ViewsTable';
import './App.css';

// Use VITE_BASE env var if set, otherwise default to /agi-ivrit
const basename = (import.meta.env.VITE_BASE || '/agi-ivrit').replace(/\/$/, '');

function App() {
  return (
    <BrowserRouter basename={basename}>
      <div className="app">
        <header className="app-header">
          <h1>בדיקת תרגום</h1>
          <nav className="tab-navigation">
            <NavLink to="/messages" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
              הודעות
            </NavLink>
            <NavLink to="/objects" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
              פריטים
            </NavLink>
            <NavLink to="/vocabulary" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
              אוצר מילים
            </NavLink>
            <NavLink to="/views" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
              תיאורים
            </NavLink>
          </nav>
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
    </BrowserRouter>
  );
}

export default App;
