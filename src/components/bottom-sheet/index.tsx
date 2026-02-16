import type { ReactNode } from "react";

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

  return (
    <>
      <div
        className="sr-backdrop"
        data-open={open}
        style={{ zIndex }}
        onClick={onClose}
        role="presentation"
      />
      <div
        className="sr-sheet"
        data-open={open}
        data-behind={behind}
        data-full={isFullScreen}
        style={{
          zIndex: zIndex + 1,
          ...(height ? { height } : {}),
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
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
