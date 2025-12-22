/**
 * CSS Variables Generator for Tailwind Theme
 * Converts theme tokens to CSS custom properties
 */

import { tailwindThemeTokens } from './tailwind-theme';

export function generateCSSVariables() {
  return `
    /* Spacing Variables */
    --padding-xxs: ${tailwindThemeTokens.paddingXXS}px;
    --padding-xs: ${tailwindThemeTokens.paddingXS}px;
    --padding-sm: ${tailwindThemeTokens.paddingSM}px;
    --padding: ${tailwindThemeTokens.padding}px;
    --padding-md: ${tailwindThemeTokens.paddingMD}px;
    --padding-lg: ${tailwindThemeTokens.paddingLG}px;
    --padding-xl: ${tailwindThemeTokens.paddingXL}px;

    --margin-xxs: ${tailwindThemeTokens.marginXXS}px;
    --margin-xs: ${tailwindThemeTokens.marginXS}px;
    --margin-sm: ${tailwindThemeTokens.marginSM}px;
    --margin: ${tailwindThemeTokens.margin}px;
    --margin-md: ${tailwindThemeTokens.marginMD}px;
    --margin-lg: ${tailwindThemeTokens.marginLG}px;
    --margin-xl: ${tailwindThemeTokens.marginXL}px;
    --margin-xxl: ${tailwindThemeTokens.marginXXL}px;

    /* Font Size Variables */
    --font-size-xs: ${tailwindThemeTokens.fontSizeXS}px;
    --font-size-sm: ${tailwindThemeTokens.fontSizeSM}px;
    --font-size-base: ${tailwindThemeTokens.fontSize}px;
    --font-size-lg: ${tailwindThemeTokens.fontSizeLG}px;
    --font-size-xl: ${tailwindThemeTokens.fontSizeXL}px;
    --font-size-heading-1: ${tailwindThemeTokens.fontSizeHeading1}px;
    --font-size-heading-2: ${tailwindThemeTokens.fontSizeHeading2}px;
    --font-size-heading-3: ${tailwindThemeTokens.fontSizeHeading3}px;
    --font-size-heading-4: ${tailwindThemeTokens.fontSizeHeading4}px;
    --font-size-heading-5: ${tailwindThemeTokens.fontSizeHeading5}px;

    /* Border Radius Variables */
    --border-radius-xs: ${tailwindThemeTokens.borderRadiusXS}px;
    --border-radius-sm: ${tailwindThemeTokens.borderRadiusSM}px;
    --border-radius-base: ${tailwindThemeTokens.borderRadius}px;
    --border-radius-lg: ${tailwindThemeTokens.borderRadiusLG}px;

    /* Box Shadow Variables */
    --box-shadow: ${tailwindThemeTokens.boxShadow};
    --box-shadow-secondary: ${tailwindThemeTokens.boxShadowSecondary};
    --box-shadow-primary: ${tailwindThemeTokens.boxShadowPrimary};
    --box-shadow-primary-hover: ${tailwindThemeTokens.boxShadowPrimaryHover};

    /* Control Heights */
    --control-height: ${tailwindThemeTokens.controlHeight}px;
    --control-height-lg: ${tailwindThemeTokens.controlHeightLG}px;
    --control-height-sm: ${tailwindThemeTokens.controlHeightSM}px;
    --control-height-xs: ${tailwindThemeTokens.controlHeightXS}px;
  `;
}

export const cssVariables = generateCSSVariables();
