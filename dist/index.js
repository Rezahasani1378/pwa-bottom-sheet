import { createContext, useMemo, useEffect, useSyncExternalStore, useCallback, Children, createElement, useContext, isValidElement } from 'react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/lib/sheet-stack-manager.ts
var SheetStackManager = class {
  constructor(storage) {
    __publicField(this, "stack", []);
    __publicField(this, "listeners", /* @__PURE__ */ new Set());
    __publicField(this, "snapshot", []);
    __publicField(this, "storage");
    this.storage = storage;
    if (this.storage) {
      const restored = this.storage.load();
      if (restored.length > 0) {
        this.stack = restored.map((entry) => ({ ...entry }));
        this.updateSnapshot();
      }
    }
  }
  push(entry) {
    this.stack.push(entry);
    this.persist();
    this.updateSnapshot();
    this.notify();
  }
  pop() {
    const entry = this.stack.pop();
    if (entry) {
      this.persist();
      this.updateSnapshot();
      this.notify();
    }
    return entry;
  }
  popAll() {
    if (this.stack.length === 0) {
      return;
    }
    this.stack.length = 0;
    this.persist();
    this.updateSnapshot();
    this.notify();
  }
  peek() {
    return this.stack[this.stack.length - 1];
  }
  getSnapshot() {
    return this.snapshot;
  }
  get size() {
    return this.stack.length;
  }
  get isEmpty() {
    return this.stack.length === 0;
  }
  hasPath(path) {
    return this.stack.some((entry) => entry.path === path);
  }
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  persist() {
    this.storage?.save(this.stack);
  }
  updateSnapshot() {
    this.snapshot = [...this.stack];
  }
  notify() {
    this.listeners.forEach((listener) => listener());
  }
};

// src/lib/history-manager.ts
var isBrowser = typeof window !== "undefined";
function isSheetHistoryState(state) {
  return typeof state === "object" && state !== null && "__sheetRouter" in state && state.__sheetRouter === true;
}
var HistoryManager = class {
  constructor() {
    __publicField(this, "subscribers", /* @__PURE__ */ new Set());
    __publicField(this, "handlePopState", null);
    __publicField(this, "depth", 0);
    if (!isBrowser) {
      return;
    }
    this.handlePopState = (event) => {
      const targetDepth = isSheetHistoryState(event.state) ? event.state.depth : 0;
      if (targetDepth < this.depth) {
        this.depth = targetDepth;
        this.notifyBack();
      } else {
        this.depth = targetDepth;
      }
    };
    window.addEventListener("popstate", this.handlePopState);
  }
  restoreEntries(entryIds) {
    if (!isBrowser) {
      return;
    }
    if (isSheetHistoryState(window.history.state)) {
      window.history.replaceState(null, "", window.location.href);
    }
    for (const entryId of entryIds) {
      this.depth += 1;
      const state = {
        __sheetRouter: true,
        entryId,
        depth: this.depth
      };
      window.history.pushState(state, "", window.location.href);
    }
  }
  pushState(entryId) {
    if (!isBrowser) {
      return;
    }
    this.depth += 1;
    const state = {
      __sheetRouter: true,
      entryId,
      depth: this.depth
    };
    window.history.pushState(state, "", window.location.href);
  }
  goBack(count = 1) {
    if (!isBrowser) {
      return;
    }
    if (count > 0) {
      this.depth = Math.max(0, this.depth - count);
      window.history.go(-count);
    }
  }
  subscribe(onBack) {
    this.subscribers.add(onBack);
    return () => {
      this.subscribers.delete(onBack);
    };
  }
  destroy() {
    if (isBrowser && this.handlePopState) {
      window.removeEventListener("popstate", this.handlePopState);
    }
    this.subscribers.clear();
  }
  notifyBack() {
    this.subscribers.forEach((handler) => handler());
  }
};

// src/lib/back-navigation-mediator.ts
var idCounter = 0;
function generateEntryId() {
  idCounter += 1;
  return `sheet-${idCounter}-${Date.now()}`;
}
var BackNavigationMediator = class {
  constructor(sheetStack, historyManager) {
    __publicField(this, "sheetStack");
    __publicField(this, "historyManager");
    __publicField(this, "unsubscribeHistory");
    __publicField(this, "programmaticNavigation", 0);
    this.sheetStack = sheetStack;
    this.historyManager = historyManager;
    this.unsubscribeHistory = this.historyManager.subscribe(() => {
      this.handleBack();
    });
    const restoredEntries = this.sheetStack.getSnapshot();
    if (restoredEntries.length > 0) {
      this.historyManager.restoreEntries(
        restoredEntries.map((entry) => entry.id)
      );
    }
  }
  open(path, params = {}) {
    const entry = {
      id: generateEntryId(),
      path,
      params
    };
    this.sheetStack.push(entry);
    this.historyManager.pushState(entry.id);
  }
  back() {
    if (this.sheetStack.isEmpty) {
      return;
    }
    this.sheetStack.pop();
    this.programmaticNavigation += 1;
    this.historyManager.goBack(1);
  }
  backAll() {
    const count = this.sheetStack.size;
    if (count === 0) {
      return;
    }
    this.sheetStack.popAll();
    this.programmaticNavigation += 1;
    this.historyManager.goBack(count);
  }
  isOpen(path) {
    return this.sheetStack.hasPath(path);
  }
  get stack() {
    return this.sheetStack;
  }
  destroy() {
    this.unsubscribeHistory();
    this.historyManager.destroy();
  }
  handleBack() {
    if (this.programmaticNavigation > 0) {
      this.programmaticNavigation -= 1;
      return;
    }
    this.sheetStack.pop();
  }
};

// src/lib/session-storage.ts
var STORAGE_KEY = "__sheetRouter_stack";
var isBrowser2 = typeof window !== "undefined";
function validateEntries(parsed) {
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(
    (entry) => typeof entry === "object" && entry !== null && typeof entry.id === "string" && typeof entry.path === "string" && typeof entry.params === "object"
  );
}
function createSessionStorageProvider() {
  return {
    save(stack) {
      if (!isBrowser2) {
        return;
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
      } catch {
      }
    },
    load() {
      if (!isBrowser2) {
        return [];
      }
      try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) {
          return [];
        }
        return validateEntries(JSON.parse(raw));
      } catch {
        return [];
      }
    },
    clear() {
      if (!isBrowser2) {
        return;
      }
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
      }
    }
  };
}
var SheetRouterContext = createContext(null);
function useSheetRouterContext() {
  const context = useContext(SheetRouterContext);
  if (!context) {
    throw new Error(
      "Sheet router hooks must be used within a <SheetRouter> provider."
    );
  }
  return context;
}
var SheetParamsContext = createContext(null);
function useSheetParamsContext() {
  const context = useContext(SheetParamsContext);
  if (!context) {
    throw new Error(
      "useSheetParams must be used inside a sheet rendered by <SheetRouter>."
    );
  }
  return context;
}
function BottomSheet({
  open,
  behind,
  zIndex,
  onClose,
  title,
  children
}) {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "sr-backdrop",
        "data-open": open,
        style: { zIndex },
        onClick: onClose,
        role: "presentation"
      }
    ),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "sr-sheet",
        "data-open": open,
        "data-behind": behind,
        style: { zIndex: zIndex + 1 },
        role: "dialog",
        "aria-modal": "true",
        "aria-label": title,
        children: [
          /* @__PURE__ */ jsx("div", { className: "sr-handle", children: /* @__PURE__ */ jsx("div", { className: "sr-handle-bar" }) }),
          /* @__PURE__ */ jsx("div", { className: "sr-content", children })
        ]
      }
    )
  ] });
}
var BASE_Z_INDEX = 1e3;
function SheetOutlet() {
  const { stack, routes, mediator } = useSheetRouterContext();
  return /* @__PURE__ */ jsx(Fragment, { children: stack.map((entry, index) => {
    const route = routes.get(entry.path);
    if (!route) {
      return null;
    }
    const isTop = index === stack.length - 1;
    const isBehind = !isTop;
    const zIndex = BASE_Z_INDEX + index * 2;
    return /* @__PURE__ */ jsx(
      BottomSheet,
      {
        open: true,
        behind: isBehind,
        zIndex,
        onClose: () => mediator.back(),
        title: route.title ?? route.path,
        children: /* @__PURE__ */ jsx(
          SheetParamsContext.Provider,
          {
            value: { path: entry.path, params: entry.params },
            children: createElement(route.component)
          }
        )
      },
      entry.id
    );
  }) });
}
var EMPTY_STACK = [];
function isSheetRouteElement(child) {
  return isValidElement(child) && typeof child.type === "function" && "__isSheetRoute" in child.type;
}
function collectRoutes(children) {
  const routes = /* @__PURE__ */ new Map();
  Children.forEach(children, (child) => {
    if (isSheetRouteElement(child)) {
      const { path, component, title } = child.props;
      routes.set(path, { path, component, title });
    }
  });
  return routes;
}
function collectBaseContent(children) {
  const base = [];
  Children.forEach(children, (child) => {
    if (!isSheetRouteElement(child)) {
      base.push(child);
    }
  });
  return base;
}
function SheetRouter({ children, persist = true, storageProvider }) {
  const mediator = useMemo(() => {
    const storage = persist ? storageProvider ?? createSessionStorageProvider() : null;
    const stack2 = new SheetStackManager(storage);
    const history = new HistoryManager();
    return new BackNavigationMediator(stack2, history);
  }, []);
  useEffect(() => {
    return () => {
      mediator.destroy();
    };
  }, [mediator]);
  const routes = useMemo(() => collectRoutes(children), [children]);
  const baseContent = useMemo(() => collectBaseContent(children), [children]);
  const stack = useSyncExternalStore(
    (callback) => mediator.stack.subscribe(callback),
    () => mediator.stack.getSnapshot(),
    () => EMPTY_STACK
  );
  const contextValue = useMemo(
    () => ({ mediator, routes, stack }),
    [mediator, routes, stack]
  );
  return /* @__PURE__ */ jsxs(SheetRouterContext.Provider, { value: contextValue, children: [
    baseContent,
    /* @__PURE__ */ jsx(SheetOutlet, {})
  ] });
}

// src/components/sheet-route.tsx
function SheetRoute(_props) {
  return null;
}
SheetRoute.__isSheetRoute = true;
function useSheetNavigate() {
  const { mediator } = useSheetRouterContext();
  const open = useCallback(
    (path, params) => {
      mediator.open(path, params);
    },
    [mediator]
  );
  const back = useCallback(() => {
    mediator.back();
  }, [mediator]);
  const backAll = useCallback(() => {
    mediator.backAll();
  }, [mediator]);
  const isOpen = useCallback(
    (path) => mediator.isOpen(path),
    [mediator]
  );
  return useMemo(
    () => ({ open, back, backAll, isOpen }),
    [open, back, backAll, isOpen]
  );
}

// src/hooks/use-sheet-params.ts
function useSheetParams() {
  const context = useSheetParamsContext();
  return {
    path: context.path,
    params: context.params
  };
}
function useBeforeUnload(enabled) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handler = (event) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [enabled]);
}

export { SheetRoute, SheetRouter, createSessionStorageProvider, useBeforeUnload, useSheetNavigate, useSheetParams };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map