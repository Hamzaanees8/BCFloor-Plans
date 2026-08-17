"use client";

import React, { useState, useMemo } from "react";
import {
  RotateCcw,
  Trash2,
  X,
  Search,
  Layers,
  Sparkles,
  Undo2,
} from "lucide-react";
import { TextStyle } from "../types/featureSheetTypes";
import { useSidebar } from "@/components/ui/sidebar";

export interface DeletedDetailFieldItem {
  id: string;
  title: string;
  value: string;
  titleStyle?: TextStyle;
  style?: TextStyle;
  column?: "left" | "right";
  section?: string;
  deletedAt?: number;
}

export interface DeletedFieldsPanelProps {
  deletedFields: DeletedDetailFieldItem[];
  onRestore: (fieldId: string) => void;
  onRestoreAll?: () => void;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
}

export const DeletedFieldsPanel: React.FC<DeletedFieldsPanelProps> = ({
  deletedFields,
  onRestore,
  onRestoreAll,
  isOpen: controlledIsOpen,
  onToggle,
  className = "",
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Dynamically offset from dashboard app-sidebar if present
  let sidebarLeftOffset = 0;
  try {
    const sidebar = useSidebar();
    if (!sidebar.isMobile) {
      sidebarLeftOffset = sidebar.state === "expanded" ? 208 : 64;
    }
  } catch {
    sidebarLeftOffset = 0;
  }

  const isOpen =
    controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleOpen = () => {
    if (onToggle) onToggle(true);
    else setInternalIsOpen(true);
  };

  const handleClose = () => {
    if (onToggle) onToggle(false);
    else setInternalIsOpen(false);
  };

  // Filter fields based on search query with full null-safety
  const validFields = useMemo(() => {
    return (deletedFields || []).filter((f) => f && typeof f === "object");
  }, [deletedFields]);

  const filteredFields = useMemo(() => {
    if (!searchQuery.trim()) return validFields;
    const q = searchQuery.toLowerCase();
    return validFields.filter((f) => {
      const titleStr = (f?.title ?? "").toString().toLowerCase();
      const valStr = (f?.value ?? "").toString().toLowerCase();
      const secStr = (f?.section ?? "").toString().toLowerCase();
      return titleStr.includes(q) || valStr.includes(q) || secStr.includes(q);
    });
  }, [validFields, searchQuery]);

  const totalCount = validFields.length;

  return (
    <div
      data-html2canvas-ignore="true"
      className="font-sans antialiased select-none pointer-events-auto"
    >
      {/* ─── TRIGGER BUTTON ─── */}
      <button
        type="button"
        onClick={isOpen ? handleClose : handleOpen}
        aria-label="Toggle Deleted Fields Sidebar"
        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl shadow-lg border transition-all duration-200 text-xs font-semibold cursor-pointer group pointer-events-auto ${
          totalCount > 0
            ? "bg-[#1E293B] text-white border-gray-700 hover:bg-[#0F172A] hover:border-[#00B9F2]/60 shadow-xl shadow-[#00B9F2]/10 hover:-translate-y-0.5 active:translate-y-0"
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-md hover:-translate-y-0.5 active:translate-y-0"
        }`}
        title="Open Deleted Fields Panel to restore removed fields"
      >
        <div className="relative flex items-center justify-center">
          <Trash2
            size={15}
            className={
              totalCount > 0
                ? "text-[#00B9F2] group-hover:scale-110 transition-transform"
                : "text-gray-500"
            }
          />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00B9F2] rounded-full animate-pulse" />
          )}
        </div>
        <span className="tracking-wide">Deleted Fields</span>
        {totalCount > 0 && (
          <span className="bg-[#00B9F2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
            {totalCount}
          </span>
        )}
      </button>

      {/* ─── BACKDROP OVERLAY (FULL SCREEN VIEWPORT CONTENT AREA) ─────────────────── */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[999] pointer-events-auto transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* ─── SLIDE-OUT SIDEBAR OVER SCREEN (DOCKS BESIDE MAIN APP SIDEBAR) ───────── */}
      <div
        style={{
          left: `${sidebarLeftOffset}px`,
        }}
        className={`fixed inset-y-0 z-[1000] w-[350px] max-w-[calc(100vw-${sidebarLeftOffset}px-16px)] bg-[#0F172A] text-gray-100 border-r border-gray-800 flex flex-col transition-all duration-300 ease-out pointer-events-auto ${
          isOpen
            ? "translate-x-0 opacity-100 shadow-[0_0_50px_rgba(0,0,0,0.85)] visible"
            : "-translate-x-full opacity-0 shadow-none invisible pointer-events-none"
        } ${className}`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-gray-800 bg-[#1E293B]/90 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00B9F2]/15 text-[#00B9F2] flex items-center justify-center border border-[#00B9F2]/30 shadow-inner">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Deleted Fields
                </h3>
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {totalCount} {totalCount === 1 ? "field" : "fields"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Click restore to return fields to the sheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar / Search */}
        <div className="p-3 border-b border-gray-800/80 bg-[#162032]/70 flex flex-col gap-2 shrink-0">
          {totalCount > 0 && onRestoreAll && (
            <button
              type="button"
              onClick={onRestoreAll}
              className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#00B9F2] to-[#0284C7] hover:from-[#00a3d5] hover:to-[#0369a1] text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-md hover:shadow-cyan-500/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              <RotateCcw size={13} strokeWidth={2.5} />
              <span>Restore All ({totalCount})</span>
            </button>
          )}

          {totalCount > 2 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deleted fields..."
                className="w-full bg-[#0F172A] border border-gray-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-[#00B9F2] focus:ring-1 focus:ring-[#00B9F2] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Field List Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-0">
          {totalCount === 0 ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-[#00B9F2] mb-3 shadow-inner">
                <Sparkles size={22} />
              </div>
              <h4 className="text-sm font-semibold text-gray-200 mb-1">
                No Deleted Fields
              </h4>
              <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed">
                All detail fields are active on the sheet. Removing any field
                makes it appear here for instant restore.
              </p>
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xs">
                No fields match &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            filteredFields.map((field) => {
              const displayTitle =
                (field?.title ?? "").toString().trim() || "UNTITLED FIELD";
              const displayValue = (field?.value ?? "").toString().trim();

              return (
                <div
                  key={field.id}
                  className="group bg-[#1E293B]/70 hover:bg-[#1E293B] border border-gray-800 hover:border-gray-700 rounded-xl p-3 transition-all duration-150 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#00B9F2] uppercase tracking-wide truncate">
                        {displayTitle}
                      </span>
                      {field.column && (
                        <span className="text-[9px] uppercase bg-gray-800 text-gray-400 border border-gray-700 px-1.5 py-0.5 rounded">
                          {field.column}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-300 truncate mt-0.5 font-normal">
                      {displayValue || (
                        <span className="text-gray-500 italic">
                          Empty value
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRestore(field.id)}
                    className="shrink-0 flex items-center gap-1 bg-[#00B9F2]/15 hover:bg-[#00B9F2] text-[#00B9F2] hover:text-white border border-[#00B9F2]/30 hover:border-[#00B9F2] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
                    title={`Restore ${displayTitle}`}
                  >
                    <Undo2 size={12} strokeWidth={2.5} />
                    <span>Restore</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Info */}
        <div className="p-3 border-t border-gray-800 bg-[#162032]/80 text-center shrink-0">
          <p className="text-[10px] text-gray-500">
            Restored fields return to their original column on Page 4
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeletedFieldsPanel;
