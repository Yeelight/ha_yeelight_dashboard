import type { CSSResultGroup } from "lit";

import { dashboardCardBaseStyles } from "./styles-base";
import { dashboardCardContentStyles } from "./styles-content";
import { dashboardCardControlStyles } from "./styles-controls";

export const dashboardCardStyles: CSSResultGroup = [
  dashboardCardBaseStyles,
  dashboardCardContentStyles,
  dashboardCardControlStyles
];
