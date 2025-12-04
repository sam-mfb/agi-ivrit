import { configureStore } from '@reduxjs/toolkit';
import translationsReducer from '@/features/translations/translationsSlice';
import { localStorageMiddleware, loadStateFromLocalStorage } from './localStorageMiddleware';

// Load persisted state from localStorage
const preloadedState = loadStateFromLocalStorage();

export const store = configureStore({
  reducer: {
    translations: translationsReducer,
  },
  ...(preloadedState && { preloadedState }),
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
