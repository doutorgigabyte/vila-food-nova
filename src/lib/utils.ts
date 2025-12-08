import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a UUID v4 compatible string.
 * Uses crypto.randomUUID() if available, otherwise falls back to a manual implementation.
 */
export function generateUUID(): string {
  // Try to use native crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to manual implementation
    }
  }

  // Fallback: manual UUID v4 generation
  // Generate random hex values
  const getRandomHex = (size: number): string => {
    const bytes = new Uint8Array(size);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
    } else {
      // Fallback for very old browsers
      for (let i = 0; i < size; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const hex = getRandomHex(16);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16), // Version 4
    ((parseInt(hex[12], 16) & 0x3) | 0x8).toString(16) + hex.slice(14, 16), // Variant bits
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Safe localStorage wrapper that handles cases where localStorage is not available
 * (SSR, private browsing mode, etc.)
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      window.localStorage.clear();
      return true;
    } catch (e) {
      console.warn('localStorage.clear failed:', e);
      return false;
    }
  },
  
  key: (index: number): string | null => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      return window.localStorage.key(index);
    } catch (e) {
      console.warn('localStorage.key failed:', e);
      return null;
    }
  },
  
  get length(): number {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return 0;
      }
      return window.localStorage.length;
    } catch (e) {
      return 0;
    }
  }
};

/**
 * Safe sessionStorage wrapper that handles cases where sessionStorage is not available
 * (SSR, private browsing mode, etc.)
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return null;
      }
      return window.sessionStorage.getItem(key);
    } catch (e) {
      console.warn('sessionStorage.getItem failed:', e);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return false;
      }
      window.sessionStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('sessionStorage.setItem failed:', e);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return false;
      }
      window.sessionStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('sessionStorage.removeItem failed:', e);
      return false;
    }
  },
  
  clear: (): boolean => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return false;
      }
      window.sessionStorage.clear();
      return true;
    } catch (e) {
      console.warn('sessionStorage.clear failed:', e);
      return false;
    }
  },
  
  key: (index: number): string | null => {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return null;
      }
      return window.sessionStorage.key(index);
    } catch (e) {
      console.warn('sessionStorage.key failed:', e);
      return null;
    }
  },
  
  get length(): number {
    try {
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return 0;
      }
      return window.sessionStorage.length;
    } catch (e) {
      return 0;
    }
  }
};