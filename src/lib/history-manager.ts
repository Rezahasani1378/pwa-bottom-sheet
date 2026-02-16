import type { BackHandler } from "../types";

const isBrowser = typeof window !== "undefined";

interface SheetHistoryState {
  __sheetRouter: true;
  entryId: string;
  depth: number;
}

function isSheetHistoryState(state: unknown): state is SheetHistoryState {
  return (
    typeof state === "object" &&
    state !== null &&
    "__sheetRouter" in state &&
    (state as SheetHistoryState).__sheetRouter === true
  );
}

class HistoryManager {
  private subscribers = new Set<BackHandler>();
  private handlePopState: ((event: PopStateEvent) => void) | null = null;
  private depth = 0;

  constructor() {
    if (!isBrowser) {
      return;
    }

    this.handlePopState = (event: PopStateEvent) => {
      const targetDepth = isSheetHistoryState(event.state)
        ? event.state.depth
        : 0;

      if (targetDepth < this.depth) {
        this.depth = targetDepth;
        this.notifyBack();
      } else {
        this.depth = targetDepth;
      }
    };
    window.addEventListener("popstate", this.handlePopState);
  }

  restoreEntries(entryIds: string[]): void {
    if (!isBrowser) {
      return;
    }
    if (isSheetHistoryState(window.history.state)) {
      window.history.replaceState(null, "", window.location.href);
    }
    for (const entryId of entryIds) {
      this.depth += 1;
      const state: SheetHistoryState = {
        __sheetRouter: true,
        entryId,
        depth: this.depth,
      };
      window.history.pushState(state, "", window.location.href);
    }
  }

  pushState(entryId: string): void {
    if (!isBrowser) {
      return;
    }
    this.depth += 1;
    const state: SheetHistoryState = {
      __sheetRouter: true,
      entryId,
      depth: this.depth,
    };
    window.history.pushState(state, "", window.location.href);
  }

  goBack(count: number = 1): void {
    if (!isBrowser) {
      return;
    }
    if (count > 0) {
      this.depth = Math.max(0, this.depth - count);
      window.history.go(-count);
    }
  }

  subscribe(onBack: BackHandler): () => void {
    this.subscribers.add(onBack);
    return () => {
      this.subscribers.delete(onBack);
    };
  }

  destroy(): void {
    if (isBrowser && this.handlePopState) {
      window.removeEventListener("popstate", this.handlePopState);
    }
    this.subscribers.clear();
  }

  private notifyBack(): void {
    this.subscribers.forEach((handler) => handler());
  }
}

export { HistoryManager };
