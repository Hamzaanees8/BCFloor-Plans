import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Plus, Trash, Move, RotateCcw } from "lucide-react";
import { DetailField, TextStyle } from "../types/featureSheetTypes";
import StyledInput from "./StyledInput";

interface DetailFieldsSectionProps {
  leftFields: DetailField[];
  rightFields: DetailField[];
  onLeftFieldsChange: (fields: DetailField[]) => void;
  onRightFieldsChange: (fields: DetailField[]) => void;
  onTitleChange: (id: string, title: string) => void;
  onTitleStyleChange: (id: string, style: TextStyle) => void;
  onValueChange: (id: string, value: string) => void;
  onValueStyleChange: (id: string, style: TextStyle) => void;
  onRemoveField: (id: string) => void;
  fieldPositions?: Record<string, { x: number; y: number }>;
  onPositionChange?: (id: string, pos: { x: number; y: number }) => void;
  zoom?: number;
}

// Single-column right-aligned vertical layout
const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  byLawRestrictions: { x: 0, y: 0 },
  maintenanceFees: { x: 0, y: 44 },
  maintenanceFeesInclude: { x: 0, y: 88 },
  featuresIncluded: { x: 0, y: 155 },
  siteInfluences: { x: 0, y: 215 },
  amenities: { x: 0, y: 275 },
  view: { x: 0, y: 335 },
};

export const DetailFieldsSection: React.FC<DetailFieldsSectionProps> = ({
  leftFields,
  rightFields,
  onLeftFieldsChange,
  onTitleChange,
  onTitleStyleChange,
  onValueChange,
  onValueStyleChange,
  onRemoveField,
  fieldPositions = {},
  onPositionChange,
  zoom = 0.55,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const startMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activeDragIdRef = useRef<string | null>(null);
  const rafId = useRef<number | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Merge all fields into a single list
  const allFields = useMemo(() => [...leftFields, ...rightFields], [leftFields, rightFields]);

  // Helper to get position of a field
  const getFieldPos = useCallback(
    (field: DetailField, index: number): { x: number; y: number } => {
      if (fieldPositions[field.id]) {
        return fieldPositions[field.id];
      }
      if (DEFAULT_POSITIONS[field.id]) {
        return DEFAULT_POSITIONS[field.id];
      }
      return { x: 0, y: Math.min(350, index * 52) };
    },
    [fieldPositions]
  );

  const handleMouseDown = (
    e: React.MouseEvent,
    fieldId: string
  ) => {
    if (e.button !== 0 || e.altKey) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button")
    ) {
      return;
    }
    e.stopPropagation();

    const fieldIndex = allFields.findIndex((f) => f.id === fieldId);
    const currentPos = fieldIndex >= 0
      ? getFieldPos(allFields[fieldIndex], fieldIndex)
      : { x: 0, y: 0 };

    startMouseRef.current = { x: e.clientX, y: e.clientY };
    startPosRef.current = { x: currentPos.x, y: currentPos.y };
    currentPosRef.current = { x: currentPos.x, y: currentPos.y };
    activeDragIdRef.current = fieldId;
    setActiveDragId(fieldId);

    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const dragId = activeDragIdRef.current;
      if (!dragId || !onPositionChange) return;
      e.preventDefault();
      e.stopPropagation();

      const totalDx = (e.clientX - startMouseRef.current.x) / zoom;
      const totalDy = (e.clientY - startMouseRef.current.y) / zoom;

      // Safezone container boundary bounds
      const minX = -120;
      const maxX = 120;
      const minY = 0;
      const maxY = 380;

      const rawX = startPosRef.current.x + totalDx;
      const rawY = startPosRef.current.y + totalDy;

      const nextX = Math.round(Math.max(minX, Math.min(maxX, rawX)));
      const nextY = Math.round(Math.max(minY, Math.min(maxY, rawY)));

      currentPosRef.current = { x: nextX, y: nextY };

      // Instant 0ms visual update on the DOM
      const itemEl = itemRefs.current[dragId];
      if (itemEl) {
        itemEl.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }

      // Schedule React state update smoothly with requestAnimationFrame
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        onPositionChange(dragId, { x: nextX, y: nextY });
      });
    },
    [zoom, onPositionChange]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      const dragId = activeDragIdRef.current;
      if (!dragId) return;
      e.preventDefault();
      e.stopPropagation();

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }

      if (onPositionChange) {
        onPositionChange(dragId, currentPosRef.current);
      }

      activeDragIdRef.current = null;
      setActiveDragId(null);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    },
    [onPositionChange]
  );

  useEffect(() => {
    if (activeDragId) {
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
  }, [activeDragId, handleMouseMove, handleMouseUp]);

  const handleAddNewField = () => {
    const newId = `customField_${Date.now()}`;
    const newField: DetailField = {
      id: newId,
      title: "NEW FIELD:",
      value: "",
    };
    onLeftFieldsChange([...leftFields, newField]);
    if (onPositionChange) {
      onPositionChange(newId, { x: 0, y: Math.min(360, allFields.length * 52) });
    }
  };

  const handleResetPosition = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPositionChange && DEFAULT_POSITIONS[id]) {
      const defaultPos = DEFAULT_POSITIONS[id];
      currentPosRef.current = defaultPos;
      const itemEl = itemRefs.current[id];
      if (itemEl) {
        itemEl.style.transform = `translate3d(${defaultPos.x}px, ${defaultPos.y}px, 0)`;
      }
      onPositionChange(id, defaultPos);
    }
  };

  return (
    <div
      ref={containerRef}
      data-safezone-container="true"
      className="relative z-10 w-full h-[400px] pb-1 text-white text-[12px] leading-relaxed pt-0 select-none text-right"
    >
      {allFields.map((field, index) => {
        const pos = getFieldPos(field, index);
        const isDragging = activeDragId === field.id;
        const isHovered = hoveredId === field.id || isDragging;
        const defaultPos = DEFAULT_POSITIONS[field.id];
        const hasMoved = defaultPos && (pos.x !== defaultPos.x || pos.y !== defaultPos.y);

        return (
          <div
            key={field.id}
            ref={(el) => {
              itemRefs.current[field.id] = el;
            }}
            onMouseDown={(e) => handleMouseDown(e, field.id)}
            onMouseEnter={() => setHoveredId(field.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`absolute right-0 w-[420px] p-1 rounded text-right ${
              isDragging
                ? "z-40 cursor-grabbing shadow-2xl scale-[1.02] !transition-none select-none"
                : "cursor-grab transition-shadow"
            }`}
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              transition: isDragging ? "none" : "transform 0.05s ease-out",
              willChange: isDragging ? "transform" : "auto",
            }}
          >
            {/* Canva-style outline on hover */}
            {isHovered && (
              <div
                data-html2canvas-ignore="true"
                className="absolute -inset-[2px] rounded border-2 border-[#8B3DFF] pointer-events-none z-30 transition-all duration-75"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px rgba(139, 61, 255, 0.45)",
                }}
              />
            )}

            {/* Grab Handle & Action Bar */}
            {isHovered && (
              <div
                data-html2canvas-ignore="true"
                className="absolute -top-3.5 left-0 right-0 flex items-center justify-between z-40 pointer-events-auto px-0.5"
              >
                <span
                  onMouseDown={(e) => handleMouseDown(e, field.id)}
                  className="flex items-center gap-0.5 bg-[#8B3DFF] text-white px-1.5 py-0.5 rounded text-[7.5px] font-semibold shadow cursor-grab active:cursor-grabbing hover:bg-[#7828e8] transition-colors"
                  title="Drag freely anywhere inside the safezone"
                >
                  <Move size={8} strokeWidth={2.5} />
                  <span className="uppercase tracking-wider">Move</span>
                </span>

                <div className="flex items-center gap-1">
                  {hasMoved && (
                    <button
                      type="button"
                      onClick={(e) => handleResetPosition(field.id, e)}
                      className="bg-gray-800/90 text-white p-0.5 px-1 rounded shadow text-[7.5px] flex items-center gap-0.5 hover:bg-gray-700 transition-colors"
                      title="Reset to default position"
                    >
                      <RotateCcw size={7} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveField(field.id);
                    }}
                    className="text-red-400 hover:text-red-200 transition-colors p-[2px] bg-[#1a2b34]/80 rounded"
                    title="Remove field"
                  >
                    <Trash size={10} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}

            {/* Title & Value Row (White Typography for Blue Background) */}
            <div className="w-full text-right">
              <StyledInput
                value={field.title}
                onChange={(e) => onTitleChange(field.id, e.target.value)}
                onChangeStyle={(style) => onTitleStyleChange(field.id, style)}
                inputStyle={field.titleStyle}
                className="font-bold text-white text-[11px] bg-transparent text-right w-full focus:outline-none border-none placeholder-white/80 uppercase tracking-wide"
                placeholder="ENTER TITLE HERE"
              />
            </div>
            <div className="w-full text-right">
              <StyledInput
                value={field.value}
                onChange={(e) => onValueChange(field.id, e.target.value)}
                onChangeStyle={(style) => onValueStyleChange(field.id, style)}
                inputStyle={field.style}
                className="font-normal text-[10.5px] text-white/90 bg-transparent text-right w-full focus:outline-none border-none placeholder-white/60 leading-tight"
                placeholder="Enter details here"
              />
            </div>
          </div>
        );
      })}

      {/* Add Field Button */}
      <button
        type="button"
        data-html2canvas-ignore="true"
        onClick={handleAddNewField}
        className="absolute bottom-0 right-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] text-white/80 hover:text-white bg-black/30 hover:bg-black/50 px-2 py-0.5 rounded shadow z-20"
        title="Add new draggable field"
      >
        <Plus size={9} />
        <span>Add Field</span>
      </button>
    </div>
  );
};

export default DetailFieldsSection;
