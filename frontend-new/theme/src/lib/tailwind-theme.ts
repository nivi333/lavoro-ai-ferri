/**
 * Tailwind Theme Configuration
 * Extracted from Ant Design theme tokens for use with Tailwind CSS
 */

// Font Tokens
export const fontTokens = {
  fontSize: 13,
  fontSizeSM: 12,
  fontSizeLG: 16,
  fontSizeXL: 20,
  fontSizeHeading1: 38,
  fontSizeHeading2: 30,
  fontSizeHeading3: 24,
  fontSizeHeading4: 22,
  fontSizeHeading5: 16,
  fontSizeXS: 10,

  lineHeight: 1.5714285714285714,
  lineHeightSM: 1.6666666666666667,
  lineHeightLG: 1.5,
  lineHeightHeading1: 1.2105263157894737,
  lineHeightHeading2: 1.2666666666666666,
  lineHeightHeading3: 1.3333333333333333,
  lineHeightHeading4: 1.4,
  lineHeightHeading5: 1.5,

  fontWeightThin: 100,
  fontWeightExtraLight: 200,
  fontWeightLight: 300,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,
  fontWeightMax: 900,
};

// Sizing Tokens
export const sizing = {
  sizeStep: 4,
  sizeUnit: 4,
  size: 14,
  sizeLG: 24,
  sizeMD: 20,
  sizeMS: 16,
  sizeSM: 12,
  sizeXL: 32,
  sizeXS: 8,
  sizeXXL: 48,
  sizeXXS: 4,
};

// Screen Sizing (Breakpoints)
export const screenSizing = {
  screenMD: 768,
  screenMDMax: 991,
  screenMDMin: 768,
  screenSM: 576,
  screenSMMax: 767,
  screenSMMin: 576,
  screenXL: 1200,
  screenXLMax: 1599,
  screenXLMin: 1200,
  screenXS: 480,
  screenXSMax: 575,
  screenXSMin: 480,
  screenXXL: 1600,
  screenXXLMin: 1600,
  screenLG: 992,
  screenLGMax: 1199,
  screenLGMin: 992,
};

// Margin and Padding
export const marginAndPadding = {
  marginXXS: 4,
  marginXS: 8,
  marginSM: 12,
  margin: 16,
  marginMD: 20,
  marginLG: 24,
  marginXL: 32,
  marginXXL: 48,
  marginZero: 0,

  paddingXXS: 4,
  paddingXS: 8,
  paddingSM: 12,
  padding: 16,
  paddingMD: 20,
  paddingLG: 24,
  paddingXL: 32,
  paddingZero: 0,
};

// Border Radius
export const borderRadius = {
  borderRadiusXS: 2,
  borderRadiusSM: 4,
  borderRadius: 6,
  borderRadiusLG: 8,
  borderRadiusZero: 0,
};

// Border Width
export const borderWidth = {
  borderWidthZero: 0,
  borderWidthMild: 0.5,
  borderWidthThin: 1,
  borderWidthLight: 1.5,
  borderWidthMedium: 3,
  borderWidthBold: 4,
};

// Shadow Tokens
export const shadowToken = {
  boxShadow:
    '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  boxShadowSecondary:
    '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
  boxShadowPrimary: '0 4px 6px -1px rgba(223, 0, 92, 0.3)',
  boxShadowPrimaryHover: '0 6px 8px -1px rgba(223, 0, 92, 0.4)',
};

// Motion/Animation Tokens
export const motionToken = {
  motion: true,
  motionBase: 0,
  motionEaseInBack: 'cubic-bezier(0.71, -0.46, 0.88, 0.6)',
  motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
  motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  motionEaseOutBack: 'cubic-bezier(0.12, 0.4, 0.29, 1.46)',
  motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
  motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  motionUnit: 0.1,
  motionDurationFast: '0.1s',
  motionDurationMid: '0.2s',
  motionDurationSlow: '0.3s',
};

// Control Tokens
export const controlToken = {
  controlHeight: 32,
  controlHeightLG: 40,
  controlHeightSM: 24,
  controlHeightXS: 16,
  controlPaddingHorizontal: 12,
  controlPaddingHorizontalSM: 8,
  controlInteractiveSize: 16,
};

// Export all tokens
export const tailwindThemeTokens = {
  ...fontTokens,
  ...sizing,
  ...screenSizing,
  ...marginAndPadding,
  ...borderRadius,
  ...borderWidth,
  ...shadowToken,
  ...motionToken,
  ...controlToken,
};

export type TailwindThemeTokens = typeof tailwindThemeTokens;
