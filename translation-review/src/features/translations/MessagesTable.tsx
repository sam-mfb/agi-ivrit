import { useEffect, useState, useMemo, useRef } from 'react';
import { List, type ListImperativeAPI } from 'react-window';
import { useAppDispatch, useAppSelector, useIsMobile } from '@/app/hooks';
import { loadMessages, resetMessages } from './translationsSlice';
import { MessageRow, type MessageRowExtraProps } from './MessageRow';
import type { TranslationMessage } from '@/types/translations';
import './MessagesTable.css';

const DESKTOP_ROW_HEIGHT = 120;
const MOBILE_ROW_HEIGHT = 440;
const OVERSCAN_COUNT = 5;
const DEFAULT_LIST_HEIGHT = 600;

export function MessagesTable() {
  const dispatch = useAppDispatch();
  const { data, loading, loaded, error } = useAppSelector((state) => state.translations.messages);
  const isMobile = useIsMobile();
  const rowHeight = isMobile ? MOBILE_ROW_HEIGHT : DESKTOP_ROW_HEIGHT;
  const [logicFileFilter, setLogicFileFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const listRef = useRef<ListImperativeAPI | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [listHeight, setListHeight] = useState(DEFAULT_LIST_HEIGHT);

  useEffect(() => {
    if (!loaded && !loading) {
      dispatch(loadMessages());
    }
  }, [loaded, loading, dispatch]);

  // Get unique logic files for the filter dropdown
  const logicFiles = useMemo((): string[] => {
    if (!data) return [];
    const files = new Set<string>(data.messages.map((m: TranslationMessage) => m.logicFile));
    return Array.from(files).sort();
  }, [data]);

  // Filter messages by logic file and search query
  const filteredMessages = useMemo(() => {
    if (!data) return [];
    let messages = data.messages;

    // Filter by logic file
    if (logicFileFilter) {
      messages = messages.filter((m: TranslationMessage) => m.logicFile === logicFileFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      messages = messages.filter((m: TranslationMessage) =>
        m.original.toLowerCase().includes(query) ||
        m.translation.toLowerCase().includes(query) ||
        m.notes.toLowerCase().includes(query)
      );
    }

    return messages;
  }, [data, logicFileFilter, searchQuery]);

  // Reset scroll position on filter change (only if there are results)
  useEffect(() => {
    if (listRef.current && filteredMessages.length > 0) {
      listRef.current.scrollToRow({ index: 0 });
    }
  }, [logicFileFilter, searchQuery, filteredMessages.length]);

  // Measure container height
  useEffect(() => {
    if (!containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        // Subtract header height (approximately 120px for header + table header)
        const containerHeight = containerRef.current.clientHeight;
        const headerHeight = 120;
        setListHeight(Math.max(containerHeight - headerHeight, 400));
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleReset = () => {
    if (confirm('לאפס את כל תרגומי ההודעות לערכים המקוריים? לא ניתן לבטל פעולה זו.')) {
      dispatch(resetMessages());
      // Reload fresh data from server
      dispatch(loadMessages());
    }
  };

  const handleExport = () => {
    if (!data) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messages.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading">טוען הודעות...</div>;
  }

  if (error) {
    return <div className="error">שגיאה: {error}</div>;
  }

  if (!data || !data.messages.length) {
    return <div className="empty">לא נמצאו הודעות</div>;
  }

  return (
    <div className="table-container" ref={containerRef}>
      <div className="table-header">
        <h2>
          הודעות ({filteredMessages.length}
          {(logicFileFilter || searchQuery) && ` מתוך ${data.messages.length}`})
        </h2>
        <div className="header-controls">
          <div className="search-group">
            <label htmlFor="message-search">חיפוש:</label>
            <input
              id="message-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש בהודעות..."
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="clear-search"
                aria-label="נקה חיפוש"
              >
                ✕
              </button>
            )}
          </div>
          <div className="filter-group">
            <label htmlFor="logic-file-filter">קובץ לוגיקה:</label>
            <select
              id="logic-file-filter"
              value={logicFileFilter}
              onChange={(e) => setLogicFileFilter(e.target.value)}
            >
              <option value="">הכל</option>
              {logicFiles.map((file: string) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>
          <div className="header-buttons">
            <button onClick={handleReset} className="reset-button">
              איפוס לברירת מחדל
            </button>
            <button onClick={handleExport} className="export-button">
              ייצוא messages.json
            </button>
          </div>
        </div>
      </div>

      {/* Virtual Table Header */}
      <div className="virtual-table-header">
        <div className="header-cell">קובץ לוגיקה</div>
        <div className="header-cell">מס׳ הודעה</div>
        <div className="header-cell">מקור</div>
        <div className="header-cell">תרגום</div>
        <div className="header-cell">הערות</div>
        <div className="header-cell">משתנים</div>
      </div>

      {/* Virtual List */}
      <List<MessageRowExtraProps>
        listRef={listRef}
        rowCount={filteredMessages.length}
        rowHeight={rowHeight}
        rowComponent={MessageRow}
        rowProps={{ messages: filteredMessages, searchQuery }}
        overscanCount={OVERSCAN_COUNT}
        className="virtual-list"
        style={{ height: listHeight }}
      />
    </div>
  );
}
