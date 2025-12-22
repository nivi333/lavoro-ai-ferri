// Export Tailwind-compatible theme
export { tailwindThemeTokens, type TailwindThemeTokens } from './lib/tailwind-theme';
export { getTailwindConfig } from './lib/tailwind-config';
export { cssVariables, generateCSSVariables } from './lib/css-variables';

// Export theme provider for React components
export { ThemeProvider, useGlobalTheme } from './lib/theme-provider';

// Re-export original theme tokens for backward compatibility (if needed)
export { themeTokens } from './lib/index';
