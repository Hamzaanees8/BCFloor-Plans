import React, { useState, useRef, useEffect, useCallback, createContext, useMemo } from "react";
import { Move, RotateCcw, Trash2 } from "lucide-react";
import { useFieldPanel } from "./FieldPanelContext";

export interface DraggableBoxContextValue {
  id: string;
  label?: string;
  position: { x: number; y: number };
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
  onDelete?: () => void;
}

export const DraggableBoxContext = createContext<DraggableBoxContextValue | null>(null);

export interface DraggableBoxProps {
  id: string;
  position?: { x: number; y: number };
  onPositionChange: (id: string, pos: { x: number; y: number }) => void;
  children: React.ReactNode;
  zoom?: number;
  className?: string;
  containerClassName?: string;
  /** Explicit boundary limits in px if not auto-detecting parent */
  boundaryLimits?: {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
  };
  label?: string;
  disabled?: boolean;
  onDelete?: () => void;
  deleteTitle?: string;
}

export const DraggableBox: React.FC<DraggableBoxProps> = ({
  id,
  position = { x: 0, y: 0 },
  onPositionChange,
  children,
  zoom = 0.55,
  className = "",
  containerClassName = "",
  boundaryLimits,
  label,
  disabled = false,
  onDelete,
  deleteTitle,
}) => {
  const fieldPanel = useFieldPanel();
  // Hide inline action buttons when the right-side panel context is available
  const hasPanelContext = !!fieldPanel;

  const posX = position?.x || 0;
  const posY = position?.y || 0;

  const boxContextValue = useMemo<DraggableBoxContextValue>(
    () => ({
      id,
      label,
      position: { x: posX, y: posY },
      onPositionChange,
      onDelete,
    }),
    [id, label, posX, posY, onPositionChange, onDelete],
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const boxRef = useRef<HTMLDivElement | null>(null);
  const startMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const boundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number }>({
    minX: -10000,
    maxX: 10000,
    minY: -10000,
    maxY: 10000,
  });
  const rafId = useRef<number | null>(null);

  const hasMoved = posX !== 0 || posY !== 0;

  // Keep currentPosRef synchronized when position prop changes and not dragging
  useEffect(() => {
    if (!isDragging) {
      currentPosRef.current = { x: posX, y: posY };
    }
  }, [posX, posY, isDragging]);

  // Calculate boundary limits based on parent safezone container or explicit limits
  const calculateBounds = useCallback(() => {
    let minX = -10000;
    let maxX = 10000;
    let minY = -10000;
    let maxY = 10000;

    if (boxRef.current) {
      const container =
        boxRef.current.closest('[data-drag-container="true"]') ||
        boxRef.current.closest('[data-section-container="true"]') ||
        boxRef.current.closest('[data-safezone-container="true"]') ||
        boxRef.current.parentElement;
      if (container) {
        const cRect = container.getBoundingClientRect();
        const eRect = boxRef.current.getBoundingClientRect();

        const pad = 2;
        const cLeft = cRect.left + pad;
        const cRight = cRect.right - pad;
        const cTop = cRect.top + pad;
        const cBottom = cRect.bottom - pad;

        const curX = currentPosRef.current.x || 0;
        const curY = currentPosRef.current.y || 0;

        const baseLeft = eRect.left - curX * zoom;
        const baseTop = eRect.top - curY * zoom;

        const leftBound = (cLeft - baseLeft) / zoom;
        const rightBound = (cRight - (baseLeft + eRect.width)) / zoom;
        const topBound = (cTop - baseTop) / zoom;
        const bottomBound = (cBottom - (baseTop + eRect.height)) / zoom;

        if (rightBound >= leftBound) {
          minX = leftBound;
          maxX = rightBound;
        } else {
          minX = Math.min(leftBound, rightBound);
          maxX = Math.max(leftBound, rightBound);
          if (Math.abs(rightBound - leftBound) <= 10) {
            minX = 0;
            maxX = 0;
          }
        }
        if (bottomBound >= topBound) {
          minY = topBound;
          maxY = bottomBound;
        } else {
          minY = Math.min(topBound, bottomBound);
          maxY = Math.max(topBound, bottomBound);
          if (Math.abs(bottomBound - topBound) <= 10) {
            minY = 0;
            maxY = 0;
          }
        }
      }
    }

    if (boundaryLimits) {
      if (boundaryLimits.minX !== undefined) minX = Math.max(minX, boundaryLimits.minX);
      if (boundaryLimits.maxX !== undefined) maxX = Math.min(maxX, boundaryLimits.maxX);
      if (boundaryLimits.minY !== undefined) minY = Math.max(minY, boundaryLimits.minY);
      if (boundaryLimits.maxY !== undefined) maxY = Math.min(maxY, boundaryLimits.maxY);
    }

    return {
      minX: Math.min(minX, maxX),
      maxX: Math.max(minX, maxX),
      minY: Math.min(minY, maxY),
      maxY: Math.max(minY, maxY),
    };
  }, [zoom, boundaryLimits]);



  const startDrag = (clientX: number, clientY: number) => {
    if (disabled) return;

    startMouseRef.current = { x: clientX, y: clientY };
    startPosRef.current = { x: posX, y: posY };
    currentPosRef.current = { x: posX, y: posY };

    boundsRef.current = calculateBounds();

    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0 || e.altKey) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button:not([data-drag-handle='true'])")
    ) {
      return;
    }
    e.stopPropagation();
    startDrag(e.clientX, e.clientY);
  };

  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0 || e.altKey) return;
    e.stopPropagation();
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      const totalDx = (e.clientX - startMouseRef.current.x) / zoom;
      const totalDy = (e.clientY - startMouseRef.current.y) / zoom;

      const rawX = startPosRef.current.x + totalDx;
      const rawY = startPosRef.current.y + totalDy;

      const b = boundsRef.current;
      const nextX = Math.round(Math.max(b.minX, Math.min(b.maxX, rawX)));
      const nextY = Math.round(Math.max(b.minY, Math.min(b.maxY, rawY)));

      currentPosRef.current = { x: nextX, y: nextY };

      // Instant 0ms visual update on the DOM
      if (boxRef.current) {
        boxRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }

      // Schedule React state update smoothly with requestAnimationFrame
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        onPositionChange(id, { x: nextX, y: nextY });
      });
    },
    [isDragging, zoom, id, onPositionChange],
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      setIsDragging(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      // Commit final position to parent state
      onPositionChange(id, currentPosRef.current);
    },
    [isDragging, id, onPositionChange],
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove, { passive: false });
      window.addEventListener("mouseup", handleMouseUp, { passive: false });
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFocused(false);
    currentPosRef.current = { x: 0, y: 0 };
    if (boxRef.current) {
      boxRef.current.style.transform = "translate3d(0px, 0px, 0)";
    }
    onPositionChange(id, { x: 0, y: 0 });
  };

  // Show cyan border whenever hovered, focused/active, or dragging
  const showBorder = (isHovered || isFocused || isDragging) && !disabled;

  // Show drag toolbar badge ONLY when hovered or dragging, but HIDE while actively focused/typing so it never covers input text
  const showToolbar =
    (isHovered || isToolbarHovered || isDragging) && !isFocused && !disabled;

  return (
    <div
      ref={boxRef}
      onMouseDown={handleMouseDown}
      className={`relative group ${
        isDragging ? "z-40 cursor-grabbing !transition-none select-none" : "cursor-grab transition-[box-shadow]"
      } ${containerClassName}`}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsToolbarHovered(false);
        setIsFocused(false);
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      style={{
        transform: `translate3d(${posX}px, ${posY}px, 0)`,
        transition: isDragging ? "none" : "transform 0.05s ease-out",
        willChange: isDragging ? "transform" : "auto",
      }}
    >
      {/* Canva-style Bound/Border Indicator (Cyan #00B9F2 to distinguish from #8B3DFF Section Border) */}
      {showBorder && (
        <div
          data-html2canvas-ignore="true"
          className="absolute inset-0 rounded border-2 border-[#00B9F2] pointer-events-none z-30 transition-all duration-75 select-none"
          style={{
            boxShadow:
              "inset 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px rgba(0, 185, 242, 0.6)",
          }}
        />
      )}

      {/* Canva-style Drag Handle & Tooling Bar (HIDDEN while focused/typing so it never blocks text input) */}
      {showToolbar && (
        <div
          data-html2canvas-ignore="true"
          onMouseEnter={() => {
            setIsHovered(true);
            setIsToolbarHovered(true);
          }}
          onMouseLeave={() => setIsToolbarHovered(false)}
          className="absolute -top-[22px] left-0 right-0 h-[22px] flex items-center justify-between pointer-events-auto z-40 select-none px-0.5"
        >
          {/* Move Handle Badge (Icon only - no text title overlaying the field) */}
          <div
            data-drag-handle="true"
            onMouseDown={handleDragHandleMouseDown}
            className="flex items-center justify-center bg-[#00B9F2] text-white p-1 rounded shadow cursor-grab active:cursor-grabbing hover:bg-[#0096c7] transition-colors shrink-0"
            title={`Drag to reposition ${label || "field"}`}
          >
            <Move size={10} strokeWidth={2.5} />
          </div>

          {/* Right-side Action Buttons (Reset position + Delete field) — hidden when panel is available */}
          {!hasPanelContext && (
            <div className="flex items-center gap-1 shrink-0">
              {/* Reset position button if moved */}
              {hasMoved && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={handleReset}
                  className="bg-gray-800/95 text-white p-1 rounded shadow text-[8px] flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all cursor-pointer pointer-events-auto"
                  title="Reset position"
                >
                  <RotateCcw size={10} />
                </button>
              )}

              {/* Delete button if onDelete provided */}
              {onDelete && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="bg-red-600/90 text-white p-1 rounded shadow text-[8px] flex items-center justify-center hover:bg-red-700 active:scale-95 transition-all cursor-pointer pointer-events-auto"
                  title={deleteTitle || "Delete field"}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content wrapper */}
      <DraggableBoxContext.Provider value={boxContextValue}>
        <div className={`relative ${className}`}>{children}</div>
      </DraggableBoxContext.Provider>
    </div>
  );
};

export default DraggableBox;
