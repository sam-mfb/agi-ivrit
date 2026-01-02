import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loadViews, updateViewTranslation, updateViewNotes, resetViews, markDirty } from './translationsSlice';
import type { TranslationView } from '@/types/translations';
import './ViewsTable.css';

export function ViewsTable() {
  const dispatch = useAppDispatch();
  const { data, loading, loaded, error } = useAppSelector((state) => state.translations.views);

  useEffect(() => {
    if (!loaded && !loading) {
      dispatch(loadViews());
    }
  }, [loaded, loading, dispatch]);

  const handleReset = () => {
    if (confirm('לאפס את כל תרגומי התיאורים לערכים המקוריים? לא ניתן לבטל פעולה זו.')) {
      dispatch(resetViews());
      // Reload fresh data from server
      dispatch(loadViews());
    }
  };

  const handleExport = () => {
    if (!data) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'views.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading">טוען תיאורים...</div>;
  }

  if (error) {
    return <div className="error">שגיאה: {error}</div>;
  }

  if (!data || !data.views.length) {
    return <div className="empty">לא נמצאו תיאורים</div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>תיאורי תצוגות ({data.views.length})</h2>
        <div className="header-buttons">
          <button onClick={handleReset} className="reset-button">
            איפוס לברירת מחדל
          </button>
          <button onClick={handleExport} className="export-button">
            ייצוא views.json
          </button>
        </div>
      </div>

      <table className="translations-table">
        <thead>
          <tr>
            <th>מספר תצוגה</th>
            <th>מקור</th>
            <th>תרגום</th>
            <th>הערות</th>
          </tr>
        </thead>
        <tbody>
          {data.views.map((view: TranslationView) => (
            <tr key={view.viewNumber}>
              <td className="view-number">{view.viewNumber}</td>
              <td className="original view-description">{view.original}</td>
              <td className="translation">
                <textarea
                  value={view.translation}
                  onChange={(e) => {
                    dispatch(markDirty());
                    dispatch(
                      updateViewTranslation({
                        viewNumber: view.viewNumber,
                        translation: e.target.value,
                      })
                    );
                  }}
                  placeholder="הזן תרגום..."
                  rows={3}
                />
              </td>
              <td className="notes">
                <input
                  type="text"
                  value={view.notes}
                  onChange={(e) => {
                    dispatch(markDirty());
                    dispatch(
                      updateViewNotes({
                        viewNumber: view.viewNumber,
                        notes: e.target.value,
                      })
                    );
                  }}
                  placeholder="הערות..."
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
