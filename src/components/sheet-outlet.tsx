import { createElement } from "react";
import { useSheetRouterContext } from "../context/sheet-router-context";
import { SheetParamsContext } from "../context/sheet-params-context";
import { BottomSheet } from "./bottom-sheet";

const BASE_Z_INDEX = 1000;

function SheetOutlet() {
  const { stack, routes, mediator } = useSheetRouterContext();

  return (
    <>
      {stack.map((entry, index) => {
        const route = routes.get(entry.path);
        if (!route) {
          return null;
        }

        const isTop = index === stack.length - 1;
        const isBehind = !isTop;
        const zIndex = BASE_Z_INDEX + index * 2;

        return (
          <BottomSheet
            key={entry.id}
            open={true}
            behind={isBehind}
            zIndex={zIndex}
            onClose={() => mediator.back()}
            title={route.title ?? route.path}
            height={route.height}
          >
            <SheetParamsContext.Provider
              value={{ path: entry.path, params: entry.params }}
            >
              {createElement(route.component)}
            </SheetParamsContext.Provider>
          </BottomSheet>
        );
      })}
    </>
  );
}

export { SheetOutlet };
