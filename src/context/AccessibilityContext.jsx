import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'laborTracker.accessibility.v1';
const defaults = { textSize: 'standard', contrast: 'standard', reduceMotion: false };
const AccessibilityContext = createContext(null);

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return {
      textSize: ['standard', 'large', 'largest'].includes(saved?.textSize) ? saved.textSize : defaults.textSize,
      contrast: ['standard', 'high'].includes(saved?.contrast) ? saved.contrast : defaults.contrast,
      reduceMotion: Boolean(saved?.reduceMotion),
    };
  } catch { return defaults; }
}

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(readPreferences);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = settings.textSize;
    root.dataset.contrast = settings.contrast;
    root.dataset.reduceMotion = String(settings.reduceMotion);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Preferences remain active for this session. */ }
  }, [settings]);
  const updateSetting = (key, value) => setSettings(previous => ({ ...previous, [key]: value }));
  return <AccessibilityContext.Provider value={{ settings, updateSetting }}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
}
