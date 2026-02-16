import { type ComponentType } from "react";

export interface StackEntry {
  id: string;
  path: string;
  params: Record<string, unknown>;
}

export interface RouteDefinition {
  path: string;
  component: ComponentType;
  title?: string;
}

export interface SheetNavigator {
  open: (path: string, params?: Record<string, unknown>) => void;
  back: () => void;
  backAll: () => void;
  isOpen: (path: string) => boolean;
}

export interface SheetRouteProps {
  path: string;
  component: ComponentType;
  title?: string;
}

export type Listener = () => void;

export type BackHandler = () => void;
