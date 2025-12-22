// <--------------- REM -------------->
export const toRem = (value: number) => {
  return value + 'rem';
};

// <--------------- Pixels -------------->
export const toPx = (value: number) => {
  return value + 'px';
};

// <-------- Px to Rem conversion --------->

export const pxToRem = (value: number) => {
  return value / 16 + 'rem';
};

export interface CommonStyledProps {
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
