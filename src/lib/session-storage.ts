import type { StackEntry, StorageProvider } from "../types";

const STORAGE_KEY = "__sheetRouter_stack";
const isBrowser = typeof window !== "undefined";

function validateEntries(parsed: unknown): StackEntry[] {
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(
    (entry): entry is StackEntry =>
      typeof entry === "object" &&
      entry !== null &&
      typeof entry.id === "string" &&
      typeof entry.path === "string" &&
      typeof entry.params === "object",
  );
}

function createSessionStorageProvider(): StorageProvider {
  return {
    save(stack: readonly StackEntry[]): void {
      if (!isBrowser) {
        return;
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
      } catch {
        // quota exceeded or private browsing
      }
    },

    load(): StackEntry[] {
      if (!isBrowser) {
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

    clear(): void {
      if (!isBrowser) {
        return;
      }
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  };
}

export { createSessionStorageProvider };
