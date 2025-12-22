import { createContext, useContext, useState, ReactNode } from "react";
import { ThemeConfig } from "antd";
import { themeTokens, ThemeTokenType } from ".";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  antTheme: ThemeConfig;
  styledTheme: ThemeTokenType;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider(props: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Retrieve the theme preference from local storage
    const savedTheme = localStorage.getItem("isDarkMode");
    return savedTheme ? JSON.parse(savedTheme) : false; // Default to light mode
  });

  const toggleTheme = () => {
    setIsDarkMode((prevMode: boolean) => {
      const newMode = !prevMode;
      localStorage.setItem("isDarkMode", JSON.stringify(newMode)); // Save preference
      return newMode;
    });
  };

  const antTheme = isDarkMode
    ? themeTokens.antThemeConfigDark
    : themeTokens.antThemeConfigLight;

  const styledTheme = isDarkMode
    ? themeTokens.styledComponentsTokensDark
    : themeTokens.styledComponentTokensLight;

  return (
    <ThemeContext.Provider
      value={{ isDarkMode, toggleTheme, antTheme, styledTheme }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
}

export const useGlobalTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
