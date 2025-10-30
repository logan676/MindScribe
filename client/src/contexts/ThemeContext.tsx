import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type ThemeType = "blue" | "purple" | "green" | "rose" | "amber";

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes = {
  blue: {
    name: "Ocean Blue",
    description: "Classic blue theme with professional look",
    primary: "blue",
    colors: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
  },
  purple: {
    name: "Royal Purple",
    description: "Elegant purple theme for a sophisticated feel",
    primary: "purple",
    colors: {
      50: "#faf5ff",
      100: "#f3e8ff",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7e22ce",
    },
  },
  green: {
    name: "Forest Green",
    description: "Calming green theme inspired by nature",
    primary: "green",
    colors: {
      50: "#f0fdf4",
      100: "#dcfce7",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
    },
  },
  rose: {
    name: "Warm Rose",
    description: "Gentle rose theme with a modern touch",
    primary: "rose",
    colors: {
      50: "#fff1f2",
      100: "#ffe4e6",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
    },
  },
  amber: {
    name: "Golden Amber",
    description: "Warm amber theme for an energetic vibe",
    primary: "amber",
    colors: {
      50: "#fffbeb",
      100: "#fef3c7",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
    },
  },
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem("mindscribe-theme");
    return (saved as ThemeType) || "blue";
  });

  useEffect(() => {
    localStorage.setItem("mindscribe-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
