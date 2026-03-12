import { useState, useEffect, useRef, useCallback } from 'react';
import { DEFAULT_SETTINGS, INITIAL_DATA } from '../lib/constants';
import { migratePageIcons } from '../lib/migrate-icons';
import { applyTheme } from '../lib/theme';

export function useLocalStorage(isAuthenticated, isLoadingAuth) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [data, setData] = useState(INITIAL_DATA);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Debounce ref for saving
  const debouncedSaveRef = useRef(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('note-app-settings-v1');
    if (savedSettings) {
      try {
        setSettings(prev => ({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) }));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  // Load data from localStorage (used when not authenticated)
  const loadFromLocalStorage = useCallback(() => {
    const saved = localStorage.getItem('note-app-data-v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const migrated = migratePageIcons(parsed);
        setData(migrated);
        return migrated;
      } catch (e) {
        console.error('Error loading data from localStorage:', e);
      }
    }
    return null;
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('note-app-settings-v1', JSON.stringify(newSettings));
  }, []);

  // Debounced save to localStorage
  useEffect(() => {
    if (isLoadingAuth || !initialLoadComplete) return;

    // Clear existing timeout
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }

    // Debounce saves (500ms)
    debouncedSaveRef.current = setTimeout(() => {
      // Always save settings
      localStorage.setItem('note-app-settings-v1', JSON.stringify(settings));
      
      // Always save data to localStorage as backup (even when authenticated)
      // This provides immediate persistence and faster recovery on page refresh
      localStorage.setItem('note-app-data-v1', JSON.stringify(data));
    }, 500);

    return () => {
      if (debouncedSaveRef.current) {
        clearTimeout(debouncedSaveRef.current);
      }
    };
  }, [data, settings, isAuthenticated, isLoadingAuth, initialLoadComplete]);

  useEffect(() => { applyTheme(settings.theme) }, [settings.theme]);

  // Mark initial load complete after first render
  useEffect(() => {
    setInitialLoadComplete(true);
  }, []);

  return {
    settings,
    setSettings: saveSettings,
    data,
    setData,
    loadFromLocalStorage,
    initialLoadComplete
  };
}
