import type { Middleware } from '@reduxjs/toolkit';

const BASE_PATH = import.meta.env.BASE_URL || '/';
const STORAGE_KEY = `translation-review-state-${BASE_PATH.replace(/\//g, '')}`;
let saveTimeout: NodeJS.Timeout | null = null;

// Actions that should trigger persistence
const PERSIST_ACTIONS = [
  'translations/updateMessageTranslation',
  'translations/updateMessageNotes',
  'translations/updateObjectTranslation',
  'translations/updateObjectNotes',
  'translations/updateVocabularyTranslatedSynonyms',
  'translations/updateVocabularyWordType',
  'translations/updateVocabularyNotes',
  'translations/updateViewTranslation',
  'translations/updateViewNotes',
  'translations/loadMessages/fulfilled',
  'translations/loadObjects/fulfilled',
  'translations/loadVocabulary/fulfilled',
  'translations/loadViews/fulfilled',
  'translations/resetMessages',
  'translations/resetObjects',
  'translations/resetVocabulary',
  'translations/resetViews',
];

function shouldPersist(actionType: string): boolean {
  return PERSIST_ACTIONS.includes(actionType);
}

/**
 * Redux middleware that persists translation state to localStorage
 *
 * - Debounces saves to avoid excessive localStorage writes
 * - Only persists data and loaded flags, not loading/error states
 * - Handles localStorage errors gracefully
 */
export const localStorageMiddleware: Middleware = (store) => (next) => (action: any) => {
  const result = next(action);

  // Only persist after relevant actions
  if (action.type && shouldPersist(action.type)) {
    // Debounce saves (300ms)
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
      try {
        const state = store.getState();

        // Only persist data and loaded flags
        const stateToPersist = {
          messages: {
            data: state.translations.messages.data,
            loaded: state.translations.messages.loaded,
          },
          objects: {
            data: state.translations.objects.data,
            loaded: state.translations.objects.loaded,
          },
          vocabulary: {
            data: state.translations.vocabulary.data,
            loaded: state.translations.vocabulary.loaded,
          },
          views: {
            data: state.translations.views.data,
            loaded: state.translations.views.loaded,
          },
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
      } catch (error) {
        // localStorage quota exceeded or other error
        console.error('Failed to save state to localStorage:', error);
      }
    }, 300);
  }

  return result;
};

/**
 * Load persisted state from localStorage
 *
 * Returns preloaded state for Redux store, or undefined if no saved state exists
 */
export function loadStateFromLocalStorage(): any {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return undefined;
    }

    const parsed = JSON.parse(serialized);

    // Reconstruct full state with loading/error fields
    return {
      translations: {
        messages: {
          data: parsed.messages?.data || null,
          loading: false,
          loaded: parsed.messages?.loaded || false,
          error: null,
        },
        objects: {
          data: parsed.objects?.data || null,
          loading: false,
          loaded: parsed.objects?.loaded || false,
          error: null,
        },
        vocabulary: {
          data: parsed.vocabulary?.data || null,
          loading: false,
          loaded: parsed.vocabulary?.loaded || false,
          error: null,
        },
        views: {
          data: parsed.views?.data || null,
          loading: false,
          loaded: parsed.views?.loaded || false,
          error: null,
        },
      },
    };
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return undefined;
  }
}

/**
 * Clear persisted state from localStorage
 *
 * Useful for debugging or user-requested reset
 */
export function clearPersistedState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}
