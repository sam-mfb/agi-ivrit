import { memo, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { updateMessageTranslation, updateMessageNotes } from './translationsSlice';
import type { TranslationMessage } from '@/types/translations';
import type { RowComponentProps } from 'react-window';

// Extra props passed via rowProps
export interface MessageRowExtraProps {
  messages: TranslationMessage[];
  searchQuery: string;
}

// Full props including what react-window provides
type MessageRowProps = RowComponentProps<MessageRowExtraProps>;

// Escape special regex characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight matching text
function highlightText(text: string, query: string): ReactNode {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
}

export const MessageRow = memo(function MessageRow({
  ariaAttributes,
  index,
  style,
  messages,
  searchQuery,
}: MessageRowProps) {
  const dispatch = useAppDispatch();
  const message = messages[index];

  // Local state for immediate UI response
  const [localTranslation, setLocalTranslation] = useState(message?.translation ?? '');
  const [localNotes, setLocalNotes] = useState(message?.notes ?? '');

  // Sync local state when message prop changes (e.g., after reset)
  useEffect(() => {
    if (message) {
      setLocalTranslation(message.translation);
      setLocalNotes(message.notes);
    }
  }, [message?.translation, message?.notes]);

  // Dispatch to Redux on blur (not on every keystroke)
  const handleTranslationBlur = useCallback(() => {
    if (message && localTranslation !== message.translation) {
      dispatch(
        updateMessageTranslation({
          logicFile: message.logicFile,
          messageNumber: message.messageNumber,
          translation: localTranslation,
        })
      );
    }
  }, [dispatch, message, localTranslation]);

  const handleNotesBlur = useCallback(() => {
    if (message && localNotes !== message.notes) {
      dispatch(
        updateMessageNotes({
          logicFile: message.logicFile,
          messageNumber: message.messageNumber,
          notes: localNotes,
        })
      );
    }
  }, [dispatch, message, localNotes]);

  if (!message) return <div style={style} />;

  return (
    <div {...ariaAttributes} style={style} className="virtual-row">
      <div className="cell logic-file">{message.logicFile}</div>
      <div className="cell message-number">{message.messageNumber}</div>
      <div className="cell original">{highlightText(message.original, searchQuery)}</div>
      <div className="cell translation">
        <textarea
          value={localTranslation}
          onChange={(e) => setLocalTranslation(e.target.value)}
          onBlur={handleTranslationBlur}
          placeholder="הזן תרגום..."
        />
      </div>
      <div className="cell notes">
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="הערות..."
        />
      </div>
      <div className="cell placeholders">
        {message.placeholders.length > 0 ? (
          <div className="placeholder-badges">
            {message.placeholders.map((placeholder: string) => (
              <span key={placeholder} className="badge">
                {placeholder}
              </span>
            ))}
          </div>
        ) : (
          <span className="no-placeholders">—</span>
        )}
      </div>
    </div>
  );
});
