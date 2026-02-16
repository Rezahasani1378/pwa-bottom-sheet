import type { StackEntry, Listener } from "../types";

class SheetStackManager {
  private stack: StackEntry[] = [];
  private listeners = new Set<Listener>();
  private snapshot: readonly StackEntry[] = [];

  push(entry: StackEntry): void {
    this.stack.push(entry);
    this.updateSnapshot();
    this.notify();
  }

  pop(): StackEntry | undefined {
    const entry = this.stack.pop();
    if (entry) {
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

  private updateSnapshot(): void {
    this.snapshot = [...this.stack];
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export { SheetStackManager };
