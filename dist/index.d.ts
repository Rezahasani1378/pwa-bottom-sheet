import * as react_jsx_runtime from 'react/jsx-runtime';
import { ReactNode, ComponentType } from 'react';

interface SheetRouterProps {
    children: ReactNode;
}
declare function SheetRouter({ children }: SheetRouterProps): react_jsx_runtime.JSX.Element;

interface StackEntry {
    id: string;
    path: string;
    params: Record<string, unknown>;
}
interface RouteDefinition {
    path: string;
    component: ComponentType;
    title?: string;
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
}

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

export { type RouteDefinition, type SheetNavigator, SheetRoute, type SheetRouteProps, SheetRouter, type StackEntry, useBeforeUnload, useSheetNavigate, useSheetParams };
