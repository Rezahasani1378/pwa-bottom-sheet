import { createContext, useContext } from "react";
import type { RouteDefinition, StackEntry } from "../types";
import type { BackNavigationMediator } from "../lib/back-navigation-mediator";

interface SheetRouterContextValue {
  mediator: BackNavigationMediator;
  routes: Map<string, RouteDefinition>;
  stack: readonly StackEntry[];
}

const SheetRouterContext = createContext<SheetRouterContextValue | null>(null);

function useSheetRouterContext(): SheetRouterContextValue {
  const context = useContext(SheetRouterContext);
  if (!context) {
    throw new Error(
      "Sheet router hooks must be used within a <SheetRouter> provider.",
    );
  }
  return context;
}

export { SheetRouterContext, useSheetRouterContext };
export type { SheetRouterContextValue };
