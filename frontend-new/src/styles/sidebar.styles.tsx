/**
 * Sidebar Styles
 * Theme-based styles for sidebar navigation using predefined theme variables
 *
 * This module provides utilities to apply theme-based styles to sidebar navigation
 * without hardcoding color values. It uses the theme's colorPrimaryBg and
 * colorPrimaryBgHover tokens for consistent theming across light and dark modes.
 */

import { useEffect } from 'react';
import { themeTokens } from '@ayphen-web/theme';

/**
 * Component that injects sidebar styles into the document
 * Uses theme tokens instead of hardcoded values
 */
export function SidebarStylesInjector() {
  useEffect(() => {
    // Check if styles are already injected
    if (document.getElementById('sidebar-theme-styles')) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = 'sidebar-theme-styles';
    styleElement.textContent = generateSidebarCSS();
    document.head.appendChild(styleElement);

    return () => {
      // Cleanup on unmount
      const existingStyle = document.getElementById('sidebar-theme-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return null;
}

/**
 * Generate CSS for sidebar using theme tokens
 * This replaces the hardcoded values in index.css
 */
export const generateSidebarCSS = () => {
  const lightTheme = themeTokens.styledComponentTokensLight;
  const darkTheme = themeTokens.styledComponentsTokensDark;

  return `
    /* Light mode sidebar active link - uses theme colorPrimaryBg */
    .sidebar-link-active {
      background-color: ${lightTheme.colorPrimaryBg} !important;
      color: ${lightTheme.colorPrimary} !important;
    }

    .sidebar-link-active:hover {
      background-color: ${lightTheme.colorPrimaryBgHover} !important;
    }

    /* Dark mode sidebar active link - uses theme colorPrimaryBg */
    .dark .sidebar-link-active {
      background-color: ${darkTheme.colorPrimaryBg} !important;
      color: ${lightTheme.colorPrimaryBg} !important;
    }

    .dark .sidebar-link-active:hover {
      background-color: ${darkTheme.colorPrimaryBgHover} !important;
    }
  `;
};

/**
 * Inline style object for sidebar active link
 * Can be used with style prop for direct application
 */
export const getSidebarActiveLinkStyle = (isDark: boolean = false) => {
  const theme = isDark
    ? themeTokens.styledComponentsTokensDark
    : themeTokens.styledComponentTokensLight;

  return {
    backgroundColor: theme.colorPrimaryBg,
    color: 'white',
  };
};

/**
 * Inline style object for sidebar active link hover state
 */
export const getSidebarActiveLinkHoverStyle = (isDark: boolean = false) => {
  const theme = isDark
    ? themeTokens.styledComponentsTokensDark
    : themeTokens.styledComponentTokensLight;

  return {
    backgroundColor: theme.colorPrimaryBgHover,
  };
};
