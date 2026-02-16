import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { RouteDefinition, SheetRouteProps, StackEntry, StorageProvider } from "../types";
import { SheetStackManager } from "../lib/sheet-stack-manager";
import { HistoryManager } from "../lib/history-manager";
import { BackNavigationMediator } from "../lib/back-navigation-mediator";
import { createSessionStorageProvider } from "../lib/session-storage";
import { SheetRouterContext } from "../context/sheet-router-context";
import { SheetOutlet } from "./sheet-outlet";

interface SheetRouterProps {
  children: ReactNode;
  persist?: boolean;
  storageProvider?: StorageProvider;
}

const EMPTY_STACK: readonly StackEntry[] = [];

function isSheetRouteElement(
  child: ReactNode,
): child is React.ReactElement<SheetRouteProps> {
  return (
    isValidElement(child) &&
    typeof child.type === "function" &&
    "__isSheetRoute" in child.type
  );
}

function collectRoutes(children: ReactNode): Map<string, RouteDefinition> {
  const routes = new Map<string, RouteDefinition>();

  Children.forEach(children, (child) => {
    if (isSheetRouteElement(child)) {
      const { path, component, title, height } = child.props;
      routes.set(path, { path, component, title, height });
    }
  });

  return routes;
}

function collectBaseContent(children: ReactNode): ReactNode[] {
  const base: ReactNode[] = [];

  Children.forEach(children, (child) => {
    if (!isSheetRouteElement(child)) {
      base.push(child);
    }
  });

  return base;
}

function SheetRouter({ children, persist = true, storageProvider }: SheetRouterProps) {
  const mediator = useMemo(() => {
    const storage = persist
      ? (storageProvider ?? createSessionStorageProvider())
      : null;
    const stack = new SheetStackManager(storage);
    const history = new HistoryManager();
    return new BackNavigationMediator(stack, history);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      mediator.destroy();
    };
  }, [mediator]);

  const routes = useMemo(() => collectRoutes(children), [children]);
  const baseContent = useMemo(() => collectBaseContent(children), [children]);

  const stack: readonly StackEntry[] = useSyncExternalStore(
    (callback) => mediator.stack.subscribe(callback),
    () => mediator.stack.getSnapshot(),
    () => EMPTY_STACK,
  );

  const contextValue = useMemo(
    () => ({ mediator, routes, stack }),
    [mediator, routes, stack],
  );

  return (
    <SheetRouterContext.Provider value={contextValue}>
      {baseContent}
      <SheetOutlet />
    </SheetRouterContext.Provider>
  );
}

export { SheetRouter };
