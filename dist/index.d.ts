import * as react_jsx_runtime from 'react/jsx-runtime';
import { ComponentType, ReactNode } from 'react';

interface StackEntry {
    id: string;
    path: string;
    params: Record<string, unknown>;
}
interface RouteDefinition {
    path: string;
    component: ComponentType;
    title?: string;
    height?: string;
}
interface SheetNavigator {
    open: (path: string, params?: Record<string, unknown>) => void;
    back: () => void;
    backAll: () => void;
    isOpen: (path: string) => boolean;
}
interface SheetRouteProps {
    path: string;
    component: ComponentType;
    title?: string;
    height?: string;
}
interface StorageProvider {
    save: (stack: readonly StackEntry[]) => void;
    load: () => StackEntry[];
    clear: () => void;
}

interface SheetRouterProps {
    children: ReactNode;
    persist?: boolean;
    storageProvider?: StorageProvider;
}
declare function SheetRouter({ children, persist, storageProvider }: SheetRouterProps): react_jsx_runtime.JSX.Element;

declare function SheetRoute(_props: SheetRouteProps): null;
declare namespace SheetRoute {
    var __isSheetRoute: boolean;
}

declare function useSheetNavigate(): SheetNavigator;

declare function useSheetParams<T extends Record<string, unknown> = Record<string, unknown>>(): {
    path: string;
    params: T;
};

declare function useBeforeUnload(enabled: boolean): void;

declare function createSessionStorageProvider(): StorageProvider;

export { type RouteDefinition, type SheetNavigator, SheetRoute, type SheetRouteProps, SheetRouter, type StackEntry, type StorageProvider, createSessionStorageProvider, useBeforeUnload, useSheetNavigate, useSheetParams };
