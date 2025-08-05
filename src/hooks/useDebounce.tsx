import { useCallback, useRef } from 'react';
import debounce from 'lodash.debounce';

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T => {
  const debouncedCallback = useRef(
    debounce(callback, delay)
  ).current;

  return useCallback(debouncedCallback, [debouncedCallback]) as T;
};