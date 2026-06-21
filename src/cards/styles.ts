import type { CSSResultGroup } from "lit";

import { dashboardCardBaseStyles } from "./styles-base";
import { dashboardCardContentStyles } from "./styles-content";
import { dashboardCardControlStyles } from "./styles-controls";
import { dashboardCardProductStyles } from "./styles-product";

export const dashboardCardStyles: CSSResultGroup = [
  dashboardCardBaseStyles,
  dashboardCardContentStyles,
  dashboardCardProductStyles,
  dashboardCardControlStyles
];
