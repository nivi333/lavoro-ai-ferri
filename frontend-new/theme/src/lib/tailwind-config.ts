/**
 * Tailwind Config Generator
 * Exports theme configuration for Tailwind CSS
 */

import { tailwindThemeTokens } from './tailwind-theme';

export const getTailwindConfig = () => ({
  colors: {
    primary: {
      DEFAULT: '#df005c',
      hover: '#eb2671',
      active: '#b80053',
      foreground: '#ffffff',
    },
    success: {
      DEFAULT: '#52c41a',
      hover: '#73d13d',
      active: '#389e0d',
      foreground: '#ffffff',
    },
    warning: {
      DEFAULT: '#faad14',
      hover: '#ffc53d',
      active: '#d48806',
      foreground: '#ffffff',
    },
    error: {
      DEFAULT: '#ff4d4f',
      hover: '#ff7875',
      active: '#d9363e',
      foreground: '#ffffff',
    },
    info: {
      DEFAULT: '#1677ff',
      hover: '#4096ff',
      active: '#0958d9',
      foreground: '#ffffff',
    },
  },
  fontFamily: {
    heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
    body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
  },
  fontSize: {
    xs: `${tailwindThemeTokens.fontSizeXS}px`,
    sm: `${tailwindThemeTokens.fontSizeSM}px`,
    base: `${tailwindThemeTokens.fontSize}px`,
    lg: `${tailwindThemeTokens.fontSizeLG}px`,
    xl: `${tailwindThemeTokens.fontSizeXL}px`,
    '2xl': '24px',
    '3xl': '30px',
    'heading-1': `${tailwindThemeTokens.fontSizeHeading1}px`,
    'heading-2': `${tailwindThemeTokens.fontSizeHeading2}px`,
    'heading-3': `${tailwindThemeTokens.fontSizeHeading3}px`,
    'heading-4': `${tailwindThemeTokens.fontSizeHeading4}px`,
    'heading-5': `${tailwindThemeTokens.fontSizeHeading5}px`,
  },
  spacing: {
    xxs: `${tailwindThemeTokens.sizeXXS}px`,
    xs: `${tailwindThemeTokens.sizeXS}px`,
    sm: `${tailwindThemeTokens.sizeSM}px`,
    md: `${tailwindThemeTokens.padding}px`,
    lg: `${tailwindThemeTokens.sizeLG}px`,
    xl: `${tailwindThemeTokens.sizeXL}px`,
    xxl: `${tailwindThemeTokens.sizeXXL}px`,
  },
  borderRadius: {
    xs: `${tailwindThemeTokens.borderRadiusXS}px`,
    sm: `${tailwindThemeTokens.borderRadiusSM}px`,
    base: `${tailwindThemeTokens.borderRadius}px`,
    md: `${tailwindThemeTokens.borderRadius}px`,
    lg: `${tailwindThemeTokens.borderRadiusLG}px`,
  },
  boxShadow: {
    base: tailwindThemeTokens.boxShadow,
    secondary: tailwindThemeTokens.boxShadowSecondary,
    primary: tailwindThemeTokens.boxShadowPrimary,
    'primary-hover': tailwindThemeTokens.boxShadowPrimaryHover,
  },
  screens: {
    xs: `${tailwindThemeTokens.screenXSMin}px`,
    sm: `${tailwindThemeTokens.screenSMMin}px`,
    md: `${tailwindThemeTokens.screenMDMin}px`,
    lg: `${tailwindThemeTokens.screenLGMin}px`,
    xl: `${tailwindThemeTokens.screenXLMin}px`,
    '2xl': `${tailwindThemeTokens.screenXXLMin}px`,
  },
  transitionTimingFunction: {
    'in-back': tailwindThemeTokens.motionEaseInBack,
    'in-out': tailwindThemeTokens.motionEaseInOut,
    'in-out-circ': tailwindThemeTokens.motionEaseInOutCirc,
    'in-quint': tailwindThemeTokens.motionEaseInQuint,
    out: tailwindThemeTokens.motionEaseOut,
    'out-back': tailwindThemeTokens.motionEaseOutBack,
    'out-circ': tailwindThemeTokens.motionEaseOutCirc,
    'out-quint': tailwindThemeTokens.motionEaseOutQuint,
  },
  transitionDuration: {
    fast: tailwindThemeTokens.motionDurationFast,
    mid: tailwindThemeTokens.motionDurationMid,
    slow: tailwindThemeTokens.motionDurationSlow,
  },
});

export default getTailwindConfig;
