/**
 * MindVault localStorage utility
 * Provides helper functions for reading/writing/clearing browser storage
 * Includes prefixing to prevent conflicts with other apps and fallbacks for when localStorage isn't available
 */

// Prefix for all storage keys to avoid conflicts with other applications
const PREFIX = 'mindvault_';

/**
 * Check if localStorage is available in the current environment
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = `${PREFIX}test`;
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage is not available:', error);
    return false;
  }
};

/**
 * Get an item from localStorage with the mindvault prefix
 * @param key The storage key (without prefix)
 * @param defaultValue Default value to return if the key doesn't exist or localStorage is unavailable
 * @returns The stored value or defaultValue if not found
 */
export const getItem = <T>(key: string, defaultValue: T): T => {
  if (!isLocalStorageAvailable()) {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(`${PREFIX}${key}`);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.warn(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Set an item in localStorage with the mindvault prefix
 * @param key The storage key (without prefix)
 * @param value The value to store
 * @returns true if successful, false otherwise
 */
export const setItem = <T>(key: string, value: T): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
    return false;
  }
};

/**
 * Remove an item from localStorage
 * @param key The storage key (without prefix)
 * @returns true if successful, false otherwise
 */
export const removeItem = (key: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(`${PREFIX}${key}`);
    return true;
  } catch (error) {
    console.warn(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all MindVault related items from localStorage
 * Only removes items with the MindVault prefix
 * @returns true if successful, false otherwise
 */
export const clearAll = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    // Only remove items with our prefix
    Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.warn('Error clearing MindVault localStorage items:', error);
    return false;
  }
};

/**
 * Gets all keys currently stored in localStorage for MindVault
 * @returns Array of keys without the prefix
 */
export const getAllKeys = (): string[] => {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(PREFIX))
      .map(key => key.substring(PREFIX.length));
  } catch (error) {
    console.warn('Error getting MindVault localStorage keys:', error);
    return [];
  }
}; 