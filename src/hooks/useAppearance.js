/**
 * useAppearance
 * Manages theme (edgy | light) and layout (default | v2) preferences.
 * Persisted in localStorage. Applied as data attributes on <html>.
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "munnin_appearance";

const defaults = { tema: "dark", layout: "v2" };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
    
    // Use default appearance set by admin if available
    const defaultApp = localStorage.getItem("default_appearance");
    if (defaultApp) return { ...defaults, ...JSON.parse(defaultApp) };
    
    return { ...defaults };
  } catch { return { ...defaults }; }
}

function apply(prefs) {
  document.documentElement.setAttribute("data-tema", prefs.tema);
  document.documentElement.setAttribute("data-layout", prefs.layout);
}

export function useAppearance() {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    apply(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  // Apply on first render
  useEffect(() => { apply(load()); }, []);

  const setTema = (tema) => setPrefs(p => ({ ...p, tema }));
  const setLayout = (layout) => setPrefs(p => ({ ...p, layout }));

  return { prefs, setTema, setLayout };
}

// Standalone reader (no re-render) for Layout
export function getAppearance() {
  return load();
}