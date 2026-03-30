import { create } from "zustand";

const THEME_KEY = "localtube_theme";
const VIEW_KEY = "localtube_view";

function readTheme() {
  if (typeof localStorage === "undefined") return "dark";
  return localStorage.getItem(THEME_KEY) || "dark";
}

function readView() {
  if (typeof localStorage === "undefined") return "grid";
  return localStorage.getItem(VIEW_KEY) || "grid";
}

export const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  libraryView: readView(),
  theme: readTheme(),

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setLibraryView: (v) => {
    localStorage.setItem(VIEW_KEY, v);
    set({ libraryView: v });
  },

  setTheme: (t) => {
    localStorage.setItem(THEME_KEY, t);
    set({ theme: t });
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (t === "light") {
      root.classList.add("light");
    } else {
      root.classList.add("dark");
    }
  },

  applyThemeClass: () => {
    const t = readTheme();
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (t === "light") root.classList.add("light");
    else root.classList.add("dark");
  },
}));
