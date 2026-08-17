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

// Default layout coordinates (matching the initial 2-column aesthetic)
const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  byLawRestrictions: { x: 0, y: 0 },
  maintFees: { x: 0, y: 48 },
  maintFeesInclude: { x: 0, y: 96 },
  featuresIncluded: { x: 0, y: 144 },
  siteInfluences: { x: 175, y: 22 },
  amenities: { x: 175, y: 70 },
  view: { x: 175, y: 118 },
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
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Merge all fields into a single list for freeform canvas placement
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
      // Fallback for new custom fields: arrange on left or right
      const isRight = index >= leftFields.length;
      const colX = isRight ? 175 : 0;
      const rowY = Math.min(180, (index % 5) * 48);
      return { x: colX, y: rowY };
    },
    [fieldPositions, leftFields.length]
  );

  const handleMouseDown = (
    e: React.MouseEvent,
    fieldId: string
  ) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.closest("button")
    ) {
      return;
    }
    e.stopPropagation();
    setActiveDragId(fieldId);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeDragId || !onPositionChange) return;
      e.preventDefault();

      const dx = (e.clientX - lastMousePos.current.x) / zoom;
      const dy = (e.clientY - lastMousePos.current.y) / zoom;

      // Find current field and its current position
      const fieldIndex = allFields.findIndex((f) => f.id === activeDragId);
      const currentPos = fieldIndex >= 0
        ? getFieldPos(allFields[fieldIndex], fieldIndex)
        : { x: 0, y: 0 };

      // Safezone container boundary bounds (container width ~350px, height ~245px)
      // Clamping limits so field is always 100% visible inside the blue shape
      const minX = 0;
      const maxX = 190;
      const minY = 0;
      const maxY = 185;

      const newX = Math.max(minX, Math.min(maxX, currentPos.x + dx));
      const newY = Math.max(minY, Math.min(maxY, currentPos.y + dy));

      lastMousePos.current = { x: e.clientX, y: e.clientY };
      onPositionChange(activeDragId, {
        x: Math.round(newX),
        y: Math.round(newY),
      });
    },
    [activeDragId, zoom, allFields, getFieldPos, onPositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setActiveDragId(null);
  }, []);

  useEffect(() => {
    if (activeDragId) {
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
      onPositionChange(newId, { x: 0, y: 175 });
    }
  };

  const handleResetPosition = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPositionChange && DEFAULT_POSITIONS[id]) {
      onPositionChange(id, DEFAULT_POSITIONS[id]);
    }
  };

  return (
    <div
      ref={containerRef}
      data-safezone-container="true"
      className="relative z-10 w-full h-[245px] pb-1 text-white text-[12px] leading-relaxed pt-0 select-none"
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
            onMouseDown={(e) => handleMouseDown(e, field.id)}
            onMouseEnter={() => setHoveredId(field.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`absolute w-[155px] p-1 rounded transition-shadow ${
              isDragging
                ? "z-40 cursor-grabbing shadow-2xl scale-[1.02]"
                : "cursor-grab"
            }`}
            style={{
              transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
              transition: isDragging ? "none" : "transform 0.05s ease-out",
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

            {/* Title & Input Row (Original Colors & Typography) */}
            <div>
              <StyledInput
                value={field.title}
                onChange={(e) => onTitleChange(field.id, e.target.value)}
                onChangeStyle={(style) => onTitleStyleChange(field.id, style)}
                inputStyle={field.titleStyle}
                className="font-bold text-[#00B9F2] text-[8px] bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 uppercase"
                placeholder="ENTER TITLE HERE"
              />
            </div>
            <div>
              <StyledInput
                value={field.value}
                onChange={(e) => onValueChange(field.id, e.target.value)}
                onChangeStyle={(style) => onValueStyleChange(field.id, style)}
                inputStyle={field.style}
                className="font-semibold text-[10px] text-white bg-transparent text-left w-full focus:outline-none border-none placeholder-gray-300 placeholder:font-[500]"
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
        className="absolute bottom-0 right-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[8px] text-[#00B9F2] hover:text-white bg-black/30 hover:bg-black/50 px-2 py-0.5 rounded shadow z-20"
        title="Add new draggable field"
      >
        <Plus size={9} />
        <span>Add Field</span>
      </button>
    </div>
  );
};

export default DetailFieldsSection;
