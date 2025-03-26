import { useState, useEffect } from 'react';
import { getItem, setItem } from './localStorage';

/**
 * Custom React hook that syncs state with localStorage
 * 
 * @param key The storage key to use (without prefix)
 * @param defaultValue Default value to use if nothing is in storage
 * @returns [state, setState] tuple similar to useState
 */
export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Create state with default value
  const [state, setState] = useState<T>(defaultValue);
  
  // On mount, load the value from localStorage
  useEffect(() => {
    const storedValue = getItem<T>(key, defaultValue);
    setState(storedValue);
  }, [key, defaultValue]);
  
  // Update localStorage and state when state changes
  const updateState = (value: T | ((val: T) => T)) => {
    setState(prev => {
      // Handle function updates (setState(prev => prev + 1))
      const newValue = value instanceof Function ? value(prev) : value;
      
      // Save to localStorage
      setItem(key, newValue);
      
      return newValue;
    });
  };
  
  return [state, updateState];
} 