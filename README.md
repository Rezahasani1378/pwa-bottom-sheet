# @rezahasani78/sheet-router

A declarative, router-like bottom sheet stack for React.  
Handles Android/browser back button with unlimited stacked sheets.

**[Live Demo](https://sheet-router-nextjs.vercel.app/)**

---

## Features

- **Stacked sheets** — open unlimited sheets on top of each other, each with its own params
- **Back-button support** — browser back button and Android hardware back close sheets one by one
- **Configurable height** — `50%`, `80%`, `100%`, or any CSS value per sheet
- **State persistence** — survives page refresh via `sessionStorage` (default) or a custom storage provider
- **SSR-safe** — works with Next.js, Remix, and any server-rendered React app
- **Tiny** — no dependencies beyond React

## Installation

```bash
npm install @rezahasani78/sheet-router
```

## Quick Start

```tsx
import { SheetRouter, SheetRoute, useSheetNavigate } from "@rezahasani78/sheet-router";
import "@rezahasani78/sheet-router/styles.css";

function App() {
  return (
    <SheetRouter>
      <HomePage />
      <SheetRoute path="sheet-a" component={SheetA} height="50%" />
      <SheetRoute path="sheet-b" component={SheetB} height="80%" />
      <SheetRoute path="sheet-c" component={SheetC} />
    </SheetRouter>
  );
}

function HomePage() {
  const { open } = useSheetNavigate();

  return (
    <div>
      <button onClick={() => open("sheet-a")}>Open Sheet A (50%)</button>
      <button onClick={() => open("sheet-b")}>Open Sheet B (80%)</button>
      <button onClick={() => open("sheet-c")}>Open Sheet C (full screen)</button>
    </div>
  );
}

function SheetA() {
  const { open, back } = useSheetNavigate();

  return (
    <div>
      <h2>Sheet A</h2>
      <button onClick={() => open("sheet-b")}>Stack Sheet B on top</button>
      <button onClick={back}>Close</button>
    </div>
  );
}

function SheetB() {
  const { back, backAll } = useSheetNavigate();

  return (
    <div>
      <h2>Sheet B</h2>
      <button onClick={back}>Back</button>
      <button onClick={backAll}>Close All</button>
    </div>
  );
}

function SheetC() {
  const { back } = useSheetNavigate();

  return (
    <div>
      <h2>Sheet C (full screen)</h2>
      <button onClick={back}>Back</button>
    </div>
  );
}
```

## API

### `<SheetRouter>`

The root provider. Wrap your app content and `<SheetRoute>` declarations inside it.

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | — | Base content + `<SheetRoute>` elements |
| `persist` | `boolean` | `true` | Persist sheet stack across page refreshes |
| `storageProvider` | `StorageProvider` | `sessionStorage` | Custom storage backend (Redux, Zustand, etc.) |

### `<SheetRoute>`

Declares a sheet. Renders nothing by itself — the sheet opens when navigated to.

| Prop | Type | Required | Description |
|---|---|---|---|
| `path` | `string` | yes | Unique identifier for this sheet |
| `component` | `ComponentType` | yes | React component rendered inside the sheet |
| `title` | `string` | no | Accessible label for the dialog |
| `height` | `string` | no | CSS height value (`"50%"`, `"80%"`, etc.). Omit for full screen |

### `useSheetNavigate()`

Returns a `SheetNavigator` object with navigation methods.

```ts
const { open, back, backAll, isOpen } = useSheetNavigate();
```

| Method | Signature | Description |
|---|---|---|
| `open` | `(path: string, params?: Record<string, unknown>) => void` | Opens a sheet by path, optionally passing params |
| `back` | `() => void` | Closes the top sheet |
| `backAll` | `() => void` | Closes all sheets at once |
| `isOpen` | `(path: string) => boolean` | Checks if a sheet with the given path is in the stack |

### `useSheetParams<T>()`

Access the current sheet's path and params. Use inside a sheet component.

```tsx
function UserSheet() {
  const { path, params } = useSheetParams<{ userId: string }>();
  return <p>User: {params.userId}</p>;
}
```

### `useBeforeUnload(enabled: boolean)`

Shows a browser confirmation dialog when the user tries to close/reload the tab.

```tsx
useBeforeUnload(true); // enable the prompt
```

### `StorageProvider` interface

Implement this to use a custom storage backend.

```ts
interface StorageProvider {
  save: (stack: readonly StackEntry[]) => void;
  load: () => StackEntry[];
  clear: () => void;
}
```

#### Example: Redux storage provider

```ts
import type { StorageProvider, StackEntry } from "@rezahasani78/sheet-router";
import { store } from "./store";
import { setStack, clearStack } from "./sheet-slice";

export function createReduxStorageProvider(): StorageProvider {
  return {
    save(stack) {
      store.dispatch(setStack([...stack]));
    },
    load() {
      return store.getState().sheet.stack;
    },
    clear() {
      store.dispatch(clearStack());
    },
  };
}
```

### Disabling persistence

```tsx
<SheetRouter persist={false}>
  {/* sheets reset on refresh */}
</SheetRouter>
```

---

## Design Patterns

This library is built on five design patterns:

### Stack

`SheetStackManager` manages sheets as a **LIFO stack**. Each `open()` pushes a new entry, `back()` pops the top, `backAll()` clears the stack. The stack drives the rendering order — earlier entries appear behind newer ones.

```
open("A") → [A]
open("B") → [A, B]
open("C") → [A, B, C]
back()    → [A, B]
backAll() → []
```

### Observer

Both `SheetStackManager` and `HistoryManager` implement the **Observer pattern** using a `subscribe(listener)` / `notify()` mechanism. React subscribes via `useSyncExternalStore` so the UI re-renders only when the stack actually changes — no unnecessary renders.

### Mediator

`BackNavigationMediator` sits between the stack and the History API, **coordinating** them so they never fall out of sync. When the user presses the browser back button, the mediator pops the stack. When `back()` is called programmatically, it pops the stack _and_ calls `history.go(-1)`. A `programmaticNavigation` guard prevents double-pops.

### Strategy

The `StorageProvider` interface is the **Strategy pattern**. `SheetStackManager` calls `save()`, `load()`, and `clear()` on whatever storage object was injected — it never knows the concrete implementation. You can swap `sessionStorage` for Redux, Zustand, IndexedDB, or anything else by passing a different object that satisfies the same three-method contract.

```
SheetRouter
  ├─ persist=false       → storage = null (no-op)
  ├─ no storageProvider  → createSessionStorageProvider()  (default)
  └─ storageProvider={x} → your custom implementation
        ▼
  SheetStackManager calls x.save() / x.load() / x.clear()
```

### Provider (React Context)

`SheetRouterContext` and `SheetParamsContext` use the **Provider pattern** to distribute the mediator, route map, and current stack to any descendant via hooks (`useSheetNavigate`, `useSheetParams`) — without prop drilling.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                SheetRouter                  │
│  (collects routes, renders base + outlet)   │
├─────────────────────────────────────────────┤
│            SheetRouterContext               │
│  ┌──────────────┐  ┌────────────────────┐  │
│  │ SheetOutlet   │  │  useSheetNavigate  │  │
│  │ (renders      │  │  useSheetParams    │  │
│  │  BottomSheet  │  │  (hooks for        │  │
│  │  per entry)   │  │   components)      │  │
│  └──────┬───────┘  └────────────────────┘  │
├─────────┼───────────────────────────────────┤
│         ▼                                   │
│  BackNavigationMediator (Mediator)          │
│  ┌──────────────────┐ ┌─────────────────┐  │
│  │ SheetStackManager │ │ HistoryManager  │  │
│  │ (Stack+Observer)  │ │ (Observer)      │  │
│  └────────┬─────────┘ └───────┬─────────┘  │
│           ▼                    ▼            │
│    StorageProvider       History API        │
│  (sessionStorage/Redux)  (pushState/       │
│                           popstate)         │
└─────────────────────────────────────────────┘
```

---

## Browser Support

Works in all modern browsers that support the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API):

- Chrome / Edge 80+
- Firefox 80+
- Safari 14+
- Android WebView / Chrome for Android

## License

MIT
