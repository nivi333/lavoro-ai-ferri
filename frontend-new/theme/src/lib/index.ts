import { ThemeConfig } from 'antd';
import { extraColorTokensLight, lightColorTokens } from './color-tokens/light';
import { darkColorTokens, extraColorTokensDark } from './color-tokens/dark';

const motionToken = {
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

const fontTokens = {
  ///fonts
  // fontFamily: 'Roboto Flex',
  // fontFamilyCode:
  //   "'SFMono-Regular ', Consolas, 'Liberation Mono ', Menlo, Courier, monospace",

  /// Sizes
  fontSize: 13,
  fontSizeSM: 12,
  fontSizeLG: 16,
  fontSizeXL: 20,
  fontSizeHeading1: 38,
  fontSizeHeading2: 30,
  fontSizeHeading3: 24,
  fontSizeHeading4: 22,
  fontSizeHeading5: 16,
  // Add-on
  fontSizeXS: 10,

  /// Line height of text
  lineHeight: 1.5714285714285714,
  lineHeightSM: 1.6666666666666667,
  lineHeightLG: 1.5,
  lineHeightHeading1: 1.2105263157894737,
  lineHeightHeading2: 1.2666666666666666,
  lineHeightHeading3: 1.3333333333333333,
  lineHeightHeading4: 1.4,
  lineHeightHeading5: 1.5,

  /// Font Weights
  fontWeightThin: 100,
  fontWeightExtraLight: 200,
  fontWeightLight: 300,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightSemibold: 600,
  fontWeightBold: 700,
  fontWeightExtraBold: 800,
  fontWeightMax: 900,

  fontStyleNormal: 'normal',
};

const sizing = {
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

const screenSizing = {
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

const marginAndPadding = {
  ///Margin
  marginXXS: 4,
  marginXS: 8,
  marginSM: 12,
  margin: 16,
  marginMD: 20,
  marginLG: 24,
  marginXL: 32,
  marginXXL: 48,
  //Add-on
  marginZero: 0,

  ///Padding
  paddingXXS: 4,
  paddingXS: 8,
  paddingSM: 12,
  padding: 16,
  paddingMD: 20,
  paddingLG: 24,
  paddingXL: 32,
  //Add-on
  paddingZero: 0,
};

const borderRadius = {
  borderRadiusXS: 2,
  borderRadiusSM: 4,
  borderRadius: 6,
  borderRadiusLG: 8,
  //Add-on
  borderRadiusZero: 0,
};

const borderWidth = {
  borderWidthZero: 0,
  borderWidthMild: 0.5,
  borderWidthThin: 1,
  borderWidthLight: 1.5,
  borderWidthMedium: 3,
  borderWidthBold: 4,
};

const controlToken = {
  controlHeight: 32,
  controlHeightLG: 40,
  controlHeightSM: 24,
  controlHeightXS: 16,
  controlItemBgActiveDisabled: 'rgba(0, 0, 0, 0.15)',
  controlItemBgActiveHover: '#bae0ff',
  controlItemBgHover: 'rgba(0, 0, 0, 0.04)',
  controlOutline: 'rgba(5, 145, 255, 0.1)',
  controlOutlineWidth: 2,
  controlPaddingHorizontal: 12,
  controlPaddingHorizontalSM: 8,
  controlInteractiveSize: 16,
};

const lineToken = {
  lineType: 'solid',
  lineWidth: 1,
  lineWidthFocus: 4,
};

const linkToken = {
  linkDecoration: 'none',
  linkFocusDecoration: 'none',
  linkHoverDecoration: 'none',
};

const shadowToken = {
  boxShadow:
    '\n      0 6px 16px 0 rgba(0, 0, 0, 0.08),\n      0 3px 6px -4px rgba(0, 0, 0, 0.12),\n      0 9px 28px 8px rgba(0, 0, 0, 0.05)\n    ',
  boxShadowSecondary:
    '\n      0 6px 16px 0 rgba(0, 0, 0, 0.08),\n      0 3px 6px -4px rgba(0, 0, 0, 0.12),\n      0 9px 28px 8px rgba(0, 0, 0, 0.05)\n    ',
};

const antThemeTokenLight = {
  wireframe: true,
  opacityLoading: 0.65,
  opacityImage: 1,
  sizePopupArrow: 16,
  zIndexBase: 0,
  zIndexPopupBase: 1000,
  ...lightColorTokens,
  ...fontTokens,
  ...marginAndPadding,
  ...borderRadius,
  ...borderWidth,
  ...shadowToken,
  ...screenSizing,
  ...sizing,
  ...motionToken,
  ...controlToken,
  ...lineToken,
  ...linkToken,
};

const styledComponentTokensLight = {
  ...antThemeTokenLight,
  ...extraColorTokensLight,
};

const antThemeConfigLight: ThemeConfig = {
  token: antThemeTokenLight,
  components: {
    Dropdown: {
      algorithm: true,
    },
    Layout: {
      bodyBg: '#ffffff',
      // lightSiderBg: '#ffffff',
      siderBg: '#ffffff',
      triggerBg: '#ffffff',
      triggerColor: '#df005c',
      headerHeight: 60,
    },
    Tabs: {
      horizontalMargin: '0 0 4px 0',
      lineType: undefined,
    },
    Table: {
      headerBg: '#ffffff',
    },
    Select: {
      selectorBg: '#f3f3f5',
      activeBorderColor: '#00000040',
      controlOutline: '#00000026',
      colorPrimary: '#00000005',
      colorPrimaryHover: '#00000005',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    Input: {
      colorBgContainer: '#f3f3f5',
      activeBorderColor: '#00000040',
      controlOutline: '#00000026',
      colorPrimary: '#00000005',
      colorPrimaryHover: '#00000005',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    InputNumber: {
      colorBgContainer: '#f3f3f5',
      activeBorderColor: '#00000040',
      controlOutline: '#00000026',
      colorPrimary: '#00000005',
      colorPrimaryHover: '#00000005',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    DatePicker: {
      colorBgContainer: '#f3f3f5',
      activeBorderColor: '#00000040',
      controlOutline: '#00000026',
      colorPrimary: '#00000005',
      colorPrimaryHover: '#00000005',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    Drawer: {
      paddingSM: 0,
    },
    Typography: {
      titleMarginBottom: 0,
      titleMarginTop: 0,
    },
    Checkbox: {
      colorBorder: '#C4C4C4',
    },
    Notification: {
      fontSizeLG: 14,
    },
  },
};

// For Styled Components
const antThemeTokenDark = {
  wireframe: false,
  opacityLoading: 0.8,
  opacityImage: 1,
  sizePopupArrow: 16,
  zIndexBase: 0,
  zIndexPopupBase: 1000,
  ...darkColorTokens,

  ...fontTokens,
  ...marginAndPadding,
  ...borderRadius,
  ...borderWidth,
  ...shadowToken,
  ...screenSizing,
  ...sizing,
  ...motionToken,
  ...controlToken,
  ...lineToken,
  ...linkToken,
};

const styledComponentsTokensDark = {
  ...antThemeTokenDark,
  ...extraColorTokensDark,
};

const antThemeConfigDark: ThemeConfig = {
  token: antThemeTokenDark,
  components: {
    Dropdown: {
      algorithm: true,
    },
    Layout: {
      bodyBg: '#141414',
      lightSiderBg: '#181818ff',
      siderBg: '#181818ff',
      triggerBg: '#181818ff',
      triggerColor: '#ffffff',
      headerHeight: 60,
    },
    Tabs: {
      horizontalMargin: '0 0 4px 0',
      lineType: undefined,
    },
    Table: {
      headerBg: '#141414',
    },
    Select: {
      selectorBg: '#1e1e1e',
      activeBorderColor: '#595959',
      controlOutline: '#434343',
      colorPrimary: '#595959',
      colorPrimaryHover: '#737373',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    Input: {
      colorBgContainer: '#1e1e1e',
      activeBorderColor: '#595959',
      controlOutline: '#434343',
      colorPrimary: '#595959',
      colorPrimaryHover: '#737373',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    InputNumber: {
      colorBgContainer: '#1e1e1e',
      activeBorderColor: '#595959',
      controlOutline: '#434343',
      colorPrimary: '#595959',
      colorPrimaryHover: '#737373',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    DatePicker: {
      colorBgContainer: '#1e1e1e',
      activeBorderColor: '#595959',
      controlOutline: '#434343',
      colorPrimary: '#595959',
      colorPrimaryHover: '#737373',
      lineWidth: 1,
      lineWidthFocus: 1,
    },
    Drawer: {
      paddingSM: 0,
    },
    Typography: {
      titleMarginBottom: 0,
      titleMarginTop: 0,
    },
    Checkbox: {
      colorBorder: '#505050',
    },
    Notification: {
      fontSizeLG: 14,
    },
  },
};

export type ThemeTokenType = typeof styledComponentTokensLight;

export const themeTokens = {
  antThemeConfigDark,
  antThemeTokenDark,
  antThemeTokenLight,
  styledComponentsTokensDark,
  styledComponentTokensLight,
  antThemeConfigLight,
};
