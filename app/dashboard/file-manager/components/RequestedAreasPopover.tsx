"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Ruler, FileText, CheckCircle2 } from "lucide-react";
import { Order } from "../../orders/page";

interface RequestedAreasPopoverProps {
  orderData?: Order | null;
  isScrolled?: boolean;
  className?: string;
}

export default function RequestedAreasPopover({
  orderData,
  isScrolled = false,
  className = "",
}: RequestedAreasPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const orderMeta = useMemo(() => {
    try {
      if (!orderData?.meta) return {};
      return typeof orderData.meta === "string"
        ? JSON.parse(orderData.meta)
        : orderData.meta;
    } catch {
      return {};
    }
  }, [orderData?.meta]);

  const floorplanAreas: string[] = useMemo(() => {
    if (Array.isArray(orderMeta?.floorplan_areas)) {
      return orderMeta.floorplan_areas;
    }
    return [];
  }, [orderMeta]);

  const floorplanNotes: string = orderMeta?.floorplan_notes || "";
  const hasContent = floorplanAreas.length > 0 || !!floorplanNotes;

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen((prev) => !prev);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`flex items-center gap-1.5 rounded-[6px] border font-alexandria font-medium transition-all duration-200 cursor-pointer ${
            isScrolled
              ? "h-[24px] px-2 text-[10px]"
              : "h-[26px] md:h-[32px] px-2 md:px-3 text-[10px] md:text-[12px]"
          } ${
            hasContent
              ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 shadow-xs"
              : "bg-white/80 border-gray-300 text-gray-700 hover:bg-gray-100"
          } ${className}`}
          title="Click or hover to view requested measurement areas"
        >
          <Ruler
            className={`${isScrolled ? "w-3 h-3" : "w-3.5 h-3.5"} text-blue-600 shrink-0`}
          />
          <span className="whitespace-nowrap">Requested Areas</span>
          {floorplanAreas.length > 0 && (
            <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[9px] md:text-[10px] font-bold bg-blue-600 text-white leading-none">
              {floorplanAreas.length}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="w-[320px] sm:w-[360px] p-4 bg-white rounded-lg shadow-xl border border-gray-200 text-gray-800 font-alexandria z-50 animate-in fade-in-50 zoom-in-95"
      >
        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-gray-100">
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Ruler className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-gray-900 tracking-tight flex items-center gap-1">
              Other Areas to Measure
            </h4>
            <p className="text-[11px] text-gray-500 truncate">
              Special areas specified for this floor plan
            </p>
          </div>
        </div>

        {floorplanAreas.length > 0 ? (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
                Additional Areas ({floorplanAreas.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
              {floorplanAreas.map((area, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs"
                >
                  <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                  {area}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-2.5 mb-2 bg-gray-50 rounded border border-gray-200 text-center">
            <p className="text-xs text-gray-500 italic">
              No additional specific areas were selected for this order.
            </p>
          </div>
        )}

        {floorplanNotes ? (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 mb-1 text-[11px] font-semibold text-gray-700 uppercase tracking-wider">
              <FileText className="w-3 h-3 text-blue-600" />
              <span>Special Instructions / Notes</span>
            </div>
            <div className="p-2.5 bg-blue-50/60 rounded-md border border-blue-100 text-xs text-blue-950 whitespace-pre-wrap leading-relaxed max-h-[120px] overflow-y-auto">
              {floorplanNotes}
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
