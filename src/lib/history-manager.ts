import type { BackHandler } from "../types";

const isBrowser = typeof window !== "undefined";

interface SheetHistoryState {
  __sheetRouter: true;
  entryId: string;
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

  constructor() {
    if (!isBrowser) {
      return;
    }

    this.handlePopState = (event: PopStateEvent) => {
      if (isSheetHistoryState(event.state)) {
        return;
      }
      this.notifyBack();
    };
    window.addEventListener("popstate", this.handlePopState);
  }

  pushState(entryId: string): void {
    if (!isBrowser) {
      return;
    }
    const state: SheetHistoryState = { __sheetRouter: true, entryId };
    window.history.pushState(state, "", window.location.href);
  }

  goBack(count: number = 1): void {
    if (!isBrowser) {
      return;
    }
    if (count > 0) {
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
