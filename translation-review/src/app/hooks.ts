import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
