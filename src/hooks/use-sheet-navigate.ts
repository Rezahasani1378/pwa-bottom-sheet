import { useCallback, useMemo } from "react";
import type { SheetNavigator } from "../types";
import { useSheetRouterContext } from "../context/sheet-router-context";

function useSheetNavigate(): SheetNavigator {
  const { mediator } = useSheetRouterContext();

  const open = useCallback(
    (path: string, params?: Record<string, unknown>) => {
      mediator.open(path, params);
    },
    [mediator],
  );

  const back = useCallback(() => {
    mediator.back();
  }, [mediator]);

  const backAll = useCallback(() => {
    mediator.backAll();
  }, [mediator]);

  const isOpen = useCallback(
    (path: string) => mediator.isOpen(path),
    [mediator],
  );

  return useMemo(
    () => ({ open, back, backAll, isOpen }),
    [open, back, backAll, isOpen],
  );
}

export { useSheetNavigate };
