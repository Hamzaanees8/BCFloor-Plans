import React, { useState, useRef, useEffect, useCallback } from "react";
import { Move, RotateCcw, Trash2 } from "lucide-react";

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
  const [isHovered, setIsHovered] = useState(false);
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement | null>(null);

  const posX = position?.x || 0;
  const posY = position?.y || 0;
  const hasMoved = posX !== 0 || posY !== 0;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0 || e.altKey) return;
    // Don't drag if user is actively interacting with an input or button inside
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button:not([data-drag-handle='true'])")
    ) {
      return;
    }
    e.stopPropagation();
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleDragHandleMouseDown = (e: React.MouseEvent) => {
    if (disabled || e.button !== 0 || e.altKey) return;
    e.stopPropagation();
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      e.stopPropagation();

      const dx = (e.clientX - lastMousePos.current.x) / zoom;
      const dy = (e.clientY - lastMousePos.current.y) / zoom;

      let minX = -10000;
      let maxX = 10000;
      let minY = -10000;
      let maxY = 10000;

      // Always clamp strictly within the parent safezone container:
      if (boxRef.current) {
        const container =
          boxRef.current.closest('[data-safezone-container="true"]') ||
          boxRef.current.parentElement;
        if (container) {
          const cRect = container.getBoundingClientRect();
          const eRect = boxRef.current.getBoundingClientRect();

          // 2px inner buffer to stay cleanly inside the container borders
          const pad = 2;
          const cLeft = cRect.left + pad;
          const cRight = cRect.right - pad;
          const cTop = cRect.top + pad;
          const cBottom = cRect.bottom - pad;

          // Available bounds in unscaled coordinates
          const leftBound = posX + (cLeft - eRect.left) / zoom;
          const rightBound = posX + (cRight - eRect.right) / zoom;
          const topBound = posY + (cTop - eRect.top) / zoom;
          const bottomBound = posY + (cBottom - eRect.bottom) / zoom;

          if (rightBound >= leftBound) {
            minX = leftBound;
            maxX = rightBound;
          }
          if (bottomBound >= topBound) {
            minY = topBound;
            maxY = bottomBound;
          }
        }
      }

      // If explicit boundaryLimits were passed and tighter than container
      if (boundaryLimits) {
        if (boundaryLimits.minX !== undefined)
          minX = Math.max(minX, boundaryLimits.minX);
        if (boundaryLimits.maxX !== undefined)
          maxX = Math.min(maxX, boundaryLimits.maxX);
        if (boundaryLimits.minY !== undefined)
          minY = Math.max(minY, boundaryLimits.minY);
        if (boundaryLimits.maxY !== undefined)
          maxY = Math.min(maxY, boundaryLimits.maxY);
      }

      const newX = Math.max(minX, Math.min(maxX, posX + dx));
      const newY = Math.max(minY, Math.min(maxY, posY + dy));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
      onPositionChange(id, { x: Math.round(newX), y: Math.round(newY) });
    },
    [isDragging, zoom, boundaryLimits, posX, posY, id, onPositionChange],
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFocused(false);
    onPositionChange(id, { x: 0, y: 0 });
  };

  // Show toolbar & indicators whenever hovered (or toolbar hovered or dragging) and not suppressed by active typing
  const showIndicator =
    ((isHovered && !isFocused) || isToolbarHovered || isDragging) && !disabled;

  return (
    <div
      ref={boxRef}
      onMouseDown={handleMouseDown}
      className={`relative group transition-[box-shadow] ${
        isDragging ? "z-40 cursor-grabbing" : "cursor-grab"
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
      }}
    >
      {/* Canva-style Bound/Border Indicator (Cyan #00B9F2 to distinguish from #8B3DFF Section Border) */}
      {showIndicator && (
        <div
          data-html2canvas-ignore="true"
          className="absolute -inset-[3px] rounded border-2 border-[#00B9F2] pointer-events-none z-30 transition-all duration-75 select-none"
          style={{
            boxShadow:
              "0 0 0 1.5px rgba(255, 255, 255, 0.9), 0 0 8px rgba(0, 185, 242, 0.45)",
          }}
        />
      )}

      {/* Canva-style Drag Handle & Tooling Bar (visible on hover when not focused/active) */}
      {showIndicator && (
        <div
          data-html2canvas-ignore="true"
          onMouseEnter={() => {
            setIsHovered(true);
            setIsToolbarHovered(true);
          }}
          onMouseLeave={() => setIsToolbarHovered(false)}
          className="absolute -top-[24px] left-0 right-0 h-[26px] flex items-center justify-between pointer-events-auto z-40 select-none px-0.5"
        >
          {/* Move Handle Badge */}
          <div
            data-drag-handle="true"
            onMouseDown={handleDragHandleMouseDown}
            className="flex items-center gap-1 bg-[#00B9F2] text-white px-1.5 py-0.5 rounded shadow text-[8.5px] font-semibold cursor-grab active:cursor-grabbing hover:bg-[#0096c7] transition-colors"
            title="Drag to reposition within safezone"
          >
            <Move size={9} strokeWidth={2.5} />
            <span className="text-[8px] uppercase tracking-wider">
              {label || "Move"}
            </span>
          </div>

          {/* Right-side Action Buttons (Reset position + Delete field) */}
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
        </div>
      )}

      {/* Content wrapper */}
      <div className={`relative ${className}`}>{children}</div>
    </div>
  );
};

export default DraggableBox;
