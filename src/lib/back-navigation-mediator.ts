import type { StackEntry } from "../types";
import { SheetStackManager } from "./sheet-stack-manager";
import { HistoryManager } from "./history-manager";

let idCounter = 0;

function generateEntryId(): string {
  idCounter += 1;
  return `sheet-${idCounter}-${Date.now()}`;
}

class BackNavigationMediator {
  private sheetStack: SheetStackManager;
  private historyManager: HistoryManager;
  private unsubscribeHistory: () => void;
  private programmaticNavigation = 0;

  constructor(
    sheetStack: SheetStackManager,
    historyManager: HistoryManager,
  ) {
    this.sheetStack = sheetStack;
    this.historyManager = historyManager;

    this.unsubscribeHistory = this.historyManager.subscribe(() => {
      this.handleBack();
    });

    const restoredEntries = this.sheetStack.getSnapshot();
    if (restoredEntries.length > 0) {
      this.historyManager.restoreEntries(
        restoredEntries.map((entry) => entry.id),
      );
    }
  }

  open(path: string, params: Record<string, unknown> = {}): void {
    const entry: StackEntry = {
      id: generateEntryId(),
      path,
      params,
    };
    this.sheetStack.push(entry);
    this.historyManager.pushState(entry.id);
  }

  back(): void {
    if (this.sheetStack.isEmpty) {
      return;
    }
    this.sheetStack.pop();
    this.programmaticNavigation += 1;
    this.historyManager.goBack(1);
  }

  backAll(): void {
    const count = this.sheetStack.size;
    if (count === 0) {
      return;
    }
    this.sheetStack.popAll();
    this.programmaticNavigation += 1;
    this.historyManager.goBack(count);
  }

  isOpen(path: string): boolean {
    return this.sheetStack.hasPath(path);
  }

  get stack(): SheetStackManager {
    return this.sheetStack;
  }

  destroy(): void {
    this.unsubscribeHistory();
    this.historyManager.destroy();
  }

  private handleBack(): void {
    if (this.programmaticNavigation > 0) {
      this.programmaticNavigation -= 1;
      return;
    }
    this.sheetStack.pop();
  }
}

export { BackNavigationMediator };
