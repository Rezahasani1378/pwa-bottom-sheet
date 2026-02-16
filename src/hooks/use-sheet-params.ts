import { useSheetParamsContext } from "../context/sheet-params-context";

function useSheetParams<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): { path: string; params: T } {
  const context = useSheetParamsContext();
  return {
    path: context.path,
    params: context.params as T,
  };
}

export { useSheetParams };
