import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  MessagesFile,
  ObjectsFile,
  VocabularyFile,
  ViewsFile,
  TranslationMessage,
  TranslationObject,
  TranslationVocabulary,
  TranslationView,
  WordType,
} from '@/types/translations';
import { fetchMessages, fetchObjects, fetchVocabulary, fetchViews } from './translationsAPI';

interface DataState<T> {
  data: T | null;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

interface TranslationsState {
  messages: DataState<MessagesFile>;
  objects: DataState<ObjectsFile>;
  vocabulary: DataState<VocabularyFile>;
  views: DataState<ViewsFile>;
}

const initialDataState = {
  data: null,
  loading: false,
  loaded: false,
  error: null,
};

const initialState: TranslationsState = {
  messages: { ...initialDataState },
  objects: { ...initialDataState },
  vocabulary: { ...initialDataState },
  views: { ...initialDataState },
};

// Async thunks
export const loadMessages = createAsyncThunk('translations/loadMessages', async () => {
  return await fetchMessages();
});

export const loadObjects = createAsyncThunk('translations/loadObjects', async () => {
  return await fetchObjects();
});

export const loadVocabulary = createAsyncThunk('translations/loadVocabulary', async () => {
  return await fetchVocabulary();
});

export const loadViews = createAsyncThunk('translations/loadViews', async () => {
  return await fetchViews();
});

const translationsSlice = createSlice({
  name: 'translations',
  initialState,
  reducers: {
    // Message reducers
    updateMessageTranslation: (
      state,
      action: PayloadAction<{ logicFile: string; messageNumber: number; translation: string }>
    ) => {
      if (!state.messages.data) return;
      const message = state.messages.data.messages.find(
        (m: TranslationMessage) => m.logicFile === action.payload.logicFile && m.messageNumber === action.payload.messageNumber
      );
      if (message) {
        message.translation = action.payload.translation;
      }
    },
    updateMessageNotes: (
      state,
      action: PayloadAction<{ logicFile: string; messageNumber: number; notes: string }>
    ) => {
      if (!state.messages.data) return;
      const message = state.messages.data.messages.find(
        (m: TranslationMessage) => m.logicFile === action.payload.logicFile && m.messageNumber === action.payload.messageNumber
      );
      if (message) {
        message.notes = action.payload.notes;
      }
    },

    // Object reducers
    updateObjectTranslation: (state, action: PayloadAction<{ index: number; translation: string }>) => {
      if (!state.objects.data) return;
      const object = state.objects.data.objects.find((o: TranslationObject) => o.index === action.payload.index);
      if (object) {
        object.translation = action.payload.translation;
      }
    },
    updateObjectNotes: (state, action: PayloadAction<{ index: number; notes: string }>) => {
      if (!state.objects.data) return;
      const object = state.objects.data.objects.find((o: TranslationObject) => o.index === action.payload.index);
      if (object) {
        object.notes = action.payload.notes;
      }
    },

    // Vocabulary reducers
    updateVocabularyTranslatedSynonyms: (
      state,
      action: PayloadAction<{ wordNumber: number; translatedSynonyms: string[] }>
    ) => {
      if (!state.vocabulary.data) return;
      const word = state.vocabulary.data.vocabulary.find((v: TranslationVocabulary) => v.wordNumber === action.payload.wordNumber);
      if (word) {
        word.translatedSynonyms = action.payload.translatedSynonyms;
      }
    },
    updateVocabularyWordType: (
      state,
      action: PayloadAction<{ wordNumber: number; wordType: WordType }>
    ) => {
      if (!state.vocabulary.data) return;
      const word = state.vocabulary.data.vocabulary.find((v: TranslationVocabulary) => v.wordNumber === action.payload.wordNumber);
      if (word) {
        word.wordType = action.payload.wordType;
      }
    },
    updateVocabularyNotes: (state, action: PayloadAction<{ wordNumber: number; notes: string }>) => {
      if (!state.vocabulary.data) return;
      const word = state.vocabulary.data.vocabulary.find((v: TranslationVocabulary) => v.wordNumber === action.payload.wordNumber);
      if (word) {
        word.notes = action.payload.notes;
      }
    },

    // View reducers
    updateViewTranslation: (state, action: PayloadAction<{ viewNumber: number; translation: string }>) => {
      if (!state.views.data) return;
      const view = state.views.data.views.find((v: TranslationView) => v.viewNumber === action.payload.viewNumber);
      if (view) {
        view.translation = action.payload.translation;
      }
    },
    updateViewNotes: (state, action: PayloadAction<{ viewNumber: number; notes: string }>) => {
      if (!state.views.data) return;
      const view = state.views.data.views.find((v: TranslationView) => v.viewNumber === action.payload.viewNumber);
      if (view) {
        view.notes = action.payload.notes;
      }
    },

    // Reset reducers
    resetMessages: (state) => {
      state.messages = { ...initialDataState };
    },
    resetObjects: (state) => {
      state.objects = { ...initialDataState };
    },
    resetVocabulary: (state) => {
      state.vocabulary = { ...initialDataState };
    },
    resetViews: (state) => {
      state.views = { ...initialDataState };
    },
    resetAll: (state) => {
      state.messages = { ...initialDataState };
      state.objects = { ...initialDataState };
      state.vocabulary = { ...initialDataState };
      state.views = { ...initialDataState };
    },
  },
  extraReducers: (builder) => {
    // Messages
    builder
      .addCase(loadMessages.pending, (state) => {
        state.messages.loading = true;
        state.messages.error = null;
      })
      .addCase(loadMessages.fulfilled, (state, action) => {
        state.messages.loading = false;
        state.messages.loaded = true;
        state.messages.data = action.payload;
      })
      .addCase(loadMessages.rejected, (state, action) => {
        state.messages.loading = false;
        state.messages.error = action.error.message || 'Failed to load messages';
      });

    // Objects
    builder
      .addCase(loadObjects.pending, (state) => {
        state.objects.loading = true;
        state.objects.error = null;
      })
      .addCase(loadObjects.fulfilled, (state, action) => {
        state.objects.loading = false;
        state.objects.loaded = true;
        state.objects.data = action.payload;
      })
      .addCase(loadObjects.rejected, (state, action) => {
        state.objects.loading = false;
        state.objects.error = action.error.message || 'Failed to load objects';
      });

    // Vocabulary
    builder
      .addCase(loadVocabulary.pending, (state) => {
        state.vocabulary.loading = true;
        state.vocabulary.error = null;
      })
      .addCase(loadVocabulary.fulfilled, (state, action) => {
        state.vocabulary.loading = false;
        state.vocabulary.loaded = true;
        state.vocabulary.data = action.payload;
      })
      .addCase(loadVocabulary.rejected, (state, action) => {
        state.vocabulary.loading = false;
        state.vocabulary.error = action.error.message || 'Failed to load vocabulary';
      });

    // Views
    builder
      .addCase(loadViews.pending, (state) => {
        state.views.loading = true;
        state.views.error = null;
      })
      .addCase(loadViews.fulfilled, (state, action) => {
        state.views.loading = false;
        state.views.loaded = true;
        state.views.data = action.payload;
      })
      .addCase(loadViews.rejected, (state, action) => {
        state.views.loading = false;
        state.views.error = action.error.message || 'Failed to load views';
      });
  },
});

export const {
  updateMessageTranslation,
  updateMessageNotes,
  updateObjectTranslation,
  updateObjectNotes,
  updateVocabularyTranslatedSynonyms,
  updateVocabularyWordType,
  updateVocabularyNotes,
  updateViewTranslation,
  updateViewNotes,
  resetMessages,
  resetObjects,
  resetVocabulary,
  resetViews,
  resetAll,
} = translationsSlice.actions;

export default translationsSlice.reducer;
