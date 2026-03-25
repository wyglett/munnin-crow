/**
 * useAppearance
 * Manages theme (dark | light) preference only.
 * Layout is always v2 (forced).
 * Persisted in localStorage. Applied as data attributes on <html>.
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "munnin_appearance";

const defaults = { tema: "dark", layout: "v2" };

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw), layout: "v2" };
    
    // Use default appearance set by admin if available
    const defaultApp = localStorage.getItem("default_appearance");
    if (defaultApp) return { ...defaults, ...JSON.parse(defaultApp), layout: "v2" };
    
    return { ...defaults };
  } catch { return { ...defaults }; }
}

function apply(prefs) {
  document.documentElement.setAttribute("data-tema", prefs.tema);
  document.documentElement.setAttribute("data-layout", "v2");
}

export function useAppearance() {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    apply(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tema: prefs.tema }));
  }, [prefs]);

  // Apply on first render
  useEffect(() => { apply(load()); }, []);

  const setTema = (tema) => setPrefs(p => ({ ...p, tema }));

  return { prefs, setTema };
}

// Standalone reader (no re-render) for Layout
export function getAppearance() {
  return load();
}