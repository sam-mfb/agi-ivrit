import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { loadVocabulary, updateVocabularyTranslatedSynonyms, updateVocabularyWordType, updateVocabularyNotes, resetVocabulary, markDirty } from './translationsSlice';
import type { TranslationVocabulary, WordType } from '@/types/translations';
import './VocabularyTable.css';

export function VocabularyTable() {
  const dispatch = useAppDispatch();
  const { data, loading, loaded, error } = useAppSelector((state) => state.translations.vocabulary);
  const [editingValues, setEditingValues] = useState<Record<number, string>>({});
  const [wordTypeFilter, setWordTypeFilter] = useState<WordType>('');

  useEffect(() => {
    if (!loaded && !loading) {
      dispatch(loadVocabulary());
    }
  }, [loaded, loading, dispatch]);

  const handleReset = () => {
    if (confirm('לאפס את כל תרגומי אוצר המילים לערכים המקוריים? לא ניתן לבטל פעולה זו.')) {
      dispatch(resetVocabulary());
      // Reload fresh data from server
      dispatch(loadVocabulary());
      // Clear local editing state
      setEditingValues({});
    }
  };

  const handleExport = () => {
    if (!data) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSynonymInputChange = (wordNumber: number, value: string) => {
    // Store raw value in local state for immediate UI update
    setEditingValues((prev) => ({ ...prev, [wordNumber]: value }));
    dispatch(markDirty());

    // If user types a comma, add the word to the array
    if (value.includes(',')) {
      const parts = value.split(',');
      const newWord = parts[0].trim();
      const remaining = parts.slice(1).join(',').trim();

      if (newWord) {
        // Get current vocab item
        const vocab = data?.vocabulary.find((v: TranslationVocabulary) => v.wordNumber === wordNumber);
        if (vocab) {
          // Add new word to existing synonyms
          const updatedSynonyms = [...vocab.translatedSynonyms, newWord];
          dispatch(
            updateVocabularyTranslatedSynonyms({
              wordNumber,
              translatedSynonyms: updatedSynonyms,
            })
          );
        }
      }

      // Keep remaining text in input
      setEditingValues((prev) => ({ ...prev, [wordNumber]: remaining }));
    }
  };

  const handleRemoveSynonym = (wordNumber: number, synonymIndex: number) => {
    const vocab = data?.vocabulary.find((v: TranslationVocabulary) => v.wordNumber === wordNumber);
    if (vocab) {
      const updatedSynonyms = vocab.translatedSynonyms.filter((_: string, idx: number) => idx !== synonymIndex);
      dispatch(markDirty());
      dispatch(
        updateVocabularyTranslatedSynonyms({
          wordNumber,
          translatedSynonyms: updatedSynonyms,
        })
      );
    }
  };

  const getCurrentInputValue = (wordNumber: number): string => {
    return editingValues[wordNumber] || '';
  };

  if (loading) {
    return <div className="loading">טוען אוצר מילים...</div>;
  }

  if (error) {
    return <div className="error">שגיאה: {error}</div>;
  }

  if (!data || !data.vocabulary.length) {
    return <div className="empty">לא נמצא אוצר מילים</div>;
  }

  const filteredVocabulary = wordTypeFilter
    ? data.vocabulary.filter((v: TranslationVocabulary) => v.wordType === wordTypeFilter)
    : data.vocabulary;

  return (
    <div className="table-container">
      <div className="table-header">
        <h2>אוצר מילים ({filteredVocabulary.length} / {data.vocabulary.length} קבוצות מילים)</h2>
        <div className="header-buttons">
          <select
            value={wordTypeFilter}
            onChange={(e) => setWordTypeFilter(e.target.value as WordType)}
            className="filter-select"
          >
            <option value="">הכל</option>
            <option value="noun">שם עצם</option>
            <option value="verb">פועל</option>
            <option value="other">אחר</option>
          </select>
          <button onClick={handleReset} className="reset-button">
            איפוס לברירת מחדל
          </button>
          <button onClick={handleExport} className="export-button">
            ייצוא vocabulary.json
          </button>
        </div>
      </div>

      <table className="translations-table">
        <thead>
          <tr>
            <th>מס׳ מילה</th>
            <th>מילה</th>
            <th>סוג</th>
            <th>מילים נרדפות מקוריות</th>
            <th>מילים נרדפות מתורגמות</th>
            <th>הערות</th>
          </tr>
        </thead>
        <tbody>
          {filteredVocabulary.map((vocab: TranslationVocabulary) => (
            <tr key={vocab.wordNumber}>
              <td className="word-number">{vocab.wordNumber}</td>
              <td className="word">{vocab.word}</td>
              <td className="word-type">
                <select
                  value={vocab.wordType || ''}
                  onChange={(e) => {
                    dispatch(markDirty());
                    dispatch(
                      updateVocabularyWordType({
                        wordNumber: vocab.wordNumber,
                        wordType: e.target.value as WordType,
                      })
                    );
                  }}
                >
                  <option value="">—</option>
                  <option value="noun">שם עצם</option>
                  <option value="verb">פועל</option>
                  <option value="other">אחר</option>
                </select>
              </td>
              <td className="original-synonyms">
                {vocab.originalSynonyms.length > 0 ? (
                  <div className="synonym-list">
                    {vocab.originalSynonyms.map((syn: string, idx: number) => (
                      <span key={idx} className="synonym-badge">
                        {syn}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="no-synonyms">—</span>
                )}
              </td>
              <td className="translated-synonyms">
                <div className="synonym-editor">
                  {vocab.translatedSynonyms.length > 0 && (
                    <div className="synonym-list">
                      {vocab.translatedSynonyms.map((syn: string, idx: number) => (
                        <span key={idx} className="synonym-badge editable">
                          {syn}
                          <button
                            className="remove-synonym"
                            onClick={() => handleRemoveSynonym(vocab.wordNumber, idx)}
                            title="הסר מילה נרדפת"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    value={getCurrentInputValue(vocab.wordNumber)}
                    onChange={(e) => handleSynonymInputChange(vocab.wordNumber, e.target.value)}
                    placeholder="הקלד מילה נרדפת ולחץ פסיק..."
                  />
                </div>
              </td>
              <td className="notes">
                <input
                  type="text"
                  value={vocab.notes}
                  onChange={(e) => {
                    dispatch(markDirty());
                    dispatch(
                      updateVocabularyNotes({
                        wordNumber: vocab.wordNumber,
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
