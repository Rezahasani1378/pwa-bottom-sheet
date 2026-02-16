import { useRef, useCallback, type ReactNode, type PointerEvent } from "react";

const DISMISS_THRESHOLD = 0.3;

interface BottomSheetProps {
  open: boolean;
  behind: boolean;
  zIndex: number;
  onClose: () => void;
  title: string;
  children: ReactNode;
  height?: string;
}

function BottomSheet({
  open,
  behind,
  zIndex,
  onClose,
  title,
  children,
  height,
}: BottomSheetProps) {
  const isFullScreen = !height || height === "100%";
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    startY: number;
    currentY: number;
    dragging: boolean;
    sheetHeight: number;
  } | null>(null);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const sheet = sheetRef.current;
    if (!sheet) {
      return;
    }

    const target = e.target as HTMLElement;
    const isScrollable = target.closest(".sr-content");
    if (isScrollable && isScrollable.scrollTop > 0) {
      return;
    }

    dragState.current = {
      startY: e.clientY,
      currentY: e.clientY,
      dragging: false,
      sheetHeight: sheet.offsetHeight,
    };

    sheet.setPointerCapture(e.pointerId);
    sheet.style.animation = "none";
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!state || !sheet) {
      return;
    }

    state.currentY = e.clientY;
    const deltaY = state.currentY - state.startY;

    if (!state.dragging && deltaY > 5) {
      state.dragging = true;
      sheet.style.transition = "none";
    }

    if (!state.dragging) {
      return;
    }

    const offset = Math.max(0, deltaY);
    sheet.style.transform = `translateY(${offset}px)`;

    if (backdrop) {
      const progress = Math.min(offset / state.sheetHeight, 1);
      backdrop.style.opacity = String(1 - progress);
    }
  }, []);

  const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const state = dragState.current;
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!state || !sheet) {
      dragState.current = null;
      return;
    }

    sheet.releasePointerCapture(e.pointerId);

    const deltaY = state.currentY - state.startY;
    const dismissed = state.dragging && deltaY > state.sheetHeight * DISMISS_THRESHOLD;

    dragState.current = null;

    if (dismissed) {
      sheet.style.transition = "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)";
      sheet.style.transform = "translateY(100%)";
      if (backdrop) {
        backdrop.style.transition = "opacity 0.25s ease";
        backdrop.style.opacity = "0";
      }
      const timer = setTimeout(() => {
        onClose();
        sheet.style.transition = "";
        sheet.style.transform = "";
        sheet.style.animation = "";
        if (backdrop) {
          backdrop.style.transition = "";
          backdrop.style.opacity = "";
        }
      }, 250);
      return () => clearTimeout(timer);
    }

    sheet.style.transition = "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)";
    sheet.style.transform = "translateY(0)";
    if (backdrop) {
      backdrop.style.transition = "opacity 0.25s ease";
      backdrop.style.opacity = "";
    }

    const cleanup = () => {
      sheet.style.transition = "";
      sheet.style.animation = "";
    };
    sheet.addEventListener("transitionend", cleanup, { once: true });
  }, [onClose]);

  return (
    <>
      <div
        ref={backdropRef}
        className="sr-backdrop"
        data-open={open}
        style={{ zIndex }}
        onClick={onClose}
        role="presentation"
      />
      <div
        ref={sheetRef}
        className="sr-sheet"
        data-open={open}
        data-behind={behind}
        data-full={isFullScreen}
        style={{
          zIndex: zIndex + 1,
          ...(height ? { height } : {}),
          touchAction: "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="sr-handle">
          <div className="sr-handle-bar" />
        </div>
        <div className="sr-content">{children}</div>
      </div>
    </>
  );
}

export { BottomSheet };
export type { BottomSheetProps };
