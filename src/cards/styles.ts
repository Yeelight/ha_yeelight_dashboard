import type { CSSResultGroup } from "lit";

import { dashboardCardBaseStyles } from "./styles-base";
import { dashboardCardContentStyles } from "./styles-content";
import { dashboardCardControlStyles } from "./styles-controls";
import { dashboardCardComfortStyles } from "./styles-comfort";
import { dashboardCardOperationsStyles } from "./styles-operations";
import { dashboardCardProductStyles } from "./styles-product";
import { dashboardCardProductPolishStyles } from "./styles-product-polish";
import { dashboardCardUtilityStyles } from "./styles-utility";

export const dashboardCardStyles: CSSResultGroup = [
  dashboardCardBaseStyles,
  dashboardCardContentStyles,
  dashboardCardComfortStyles,
  dashboardCardOperationsStyles,
  dashboardCardUtilityStyles,
  dashboardCardProductStyles,
  dashboardCardProductPolishStyles,
  dashboardCardControlStyles
];
