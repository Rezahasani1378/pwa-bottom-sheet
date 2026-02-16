import { createContext, useContext } from "react";

interface SheetParamsContextValue {
  path: string;
  params: Record<string, unknown>;
}

const SheetParamsContext = createContext<SheetParamsContextValue | null>(null);

function useSheetParamsContext(): SheetParamsContextValue {
  const context = useContext(SheetParamsContext);
  if (!context) {
    throw new Error(
      "useSheetParams must be used inside a sheet rendered by <SheetRouter>.",
    );
  }
  return context;
}

export { SheetParamsContext, useSheetParamsContext };
export type { SheetParamsContextValue };
