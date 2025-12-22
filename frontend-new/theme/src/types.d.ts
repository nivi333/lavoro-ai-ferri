/* eslint-disable @typescript-eslint/no-empty-object-type */
import { ThemeTokenType } from "./lib/index";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends ThemeTokenType {}
}
