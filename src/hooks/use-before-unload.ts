import { useEffect } from "react";

function useBeforeUnload(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [enabled]);
}

export { useBeforeUnload };
