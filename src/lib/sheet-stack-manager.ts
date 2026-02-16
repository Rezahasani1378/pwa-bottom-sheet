import type { StackEntry, Listener, StorageProvider } from "../types";

class SheetStackManager {
  private stack: StackEntry[] = [];
  private listeners = new Set<Listener>();
  private snapshot: readonly StackEntry[] = [];
  private storage: StorageProvider | null;

  constructor(storage: StorageProvider | null) {
    this.storage = storage;

    if (this.storage) {
      const restored = this.storage.load();
      if (restored.length > 0) {
        this.stack = restored.map((entry) => ({ ...entry }));
        this.updateSnapshot();
      }
    }
  }

  push(entry: StackEntry): void {
    this.stack.push(entry);
    this.persist();
    this.updateSnapshot();
    this.notify();
  }

  pop(): StackEntry | undefined {
    const entry = this.stack.pop();
    if (entry) {
      this.persist();
      this.updateSnapshot();
      this.notify();
    }
    return entry;
  }

  popAll(): void {
    if (this.stack.length === 0) {
      return;
    }
    this.stack.length = 0;
    this.persist();
    this.updateSnapshot();
    this.notify();
  }

  peek(): StackEntry | undefined {
    return this.stack[this.stack.length - 1];
  }

  getSnapshot(): readonly StackEntry[] {
    return this.snapshot;
  }

  get size(): number {
    return this.stack.length;
  }

  get isEmpty(): boolean {
    return this.stack.length === 0;
  }

  hasPath(path: string): boolean {
    return this.stack.some((entry) => entry.path === path);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private persist(): void {
    this.storage?.save(this.stack);
  }

  private updateSnapshot(): void {
    this.snapshot = [...this.stack];
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export { SheetStackManager };
