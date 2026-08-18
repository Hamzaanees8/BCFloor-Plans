"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const drawerMarkup = (
    <>
      {/* ─── BACKDROP OVERLAY (FULL SCREEN VIEWPORT CONTENT AREA) ─────────────────── */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[99999] pointer-events-auto transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* ─── SLIDE-OUT SIDEBAR OVER SCREEN (DOCKS BESIDE MAIN APP SIDEBAR) ───────── */}
      <div
        style={{
          left: `${sidebarLeftOffset}px`,
        }}
        className={`fixed inset-y-0 z-[100000] w-[360px] max-w-[calc(100vw-${sidebarLeftOffset}px-16px)] bg-slate-900 text-slate-100 border-r border-slate-800/80 shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col transition-all duration-300 ease-out pointer-events-auto ${
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "-translate-x-full opacity-0 invisible pointer-events-none"
        } ${className}`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 shadow-inner">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white tracking-wide">
                  Deleted Fields
                </h3>
                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalCount} {totalCount === 1 ? "field" : "fields"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click restore to return fields to the sheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer active:scale-95"
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar / Search */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-900/60 flex flex-col gap-2.5 shrink-0">
          {totalCount > 0 && onRestoreAll && (
            <button
              type="button"
              onClick={onRestoreAll}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-semibold py-2.5 px-3.5 rounded-xl shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <RotateCcw size={13} strokeWidth={2.5} />
              <span>Restore All ({totalCount})</span>
            </button>
          )}

          {totalCount > 2 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deleted fields..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Field List Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar min-h-0">
          {totalCount === 0 ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-sky-400 mb-3 shadow-inner">
                <Sparkles size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-200 mb-1">
                No Deleted Fields
              </h4>
              <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
                All fields are active on the sheet. Deleting any field makes it appear here for instant restore.
              </p>
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
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
                  className="group bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3.5 transition-all duration-200 flex items-center justify-between gap-3 shadow-sm hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wide truncate">
                        {displayTitle}
                      </span>
                      {field.column && (
                        <span className="text-[9px] font-semibold uppercase bg-slate-900 text-slate-400 border border-slate-700/80 px-1.5 py-0.5 rounded-md">
                          {field.column}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 truncate mt-1 font-medium">
                      {displayValue || (
                        <span className="text-slate-500 italic">
                          Empty value
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRestore(field.id)}
                    className="shrink-0 flex items-center gap-1.5 bg-sky-500/15 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/30 hover:border-sky-500 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
                    title={`Restore ${displayTitle}`}
                  >
                    <Undo2 size={13} strokeWidth={2.5} />
                    <span>Restore</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Info */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/90 text-center shrink-0">
          <p className="text-[11px] text-slate-400 font-medium">
            Restored fields return to their original position on the sheet
          </p>
        </div>
      </div>
    </>
  );

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
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-md border transition-all duration-200 text-xs font-semibold cursor-pointer group pointer-events-auto ${
          totalCount > 0
            ? "bg-slate-900 text-white border-slate-800 hover:bg-slate-800 hover:border-sky-500/50 shadow-xl shadow-sky-500/10 hover:-translate-y-0.5 active:translate-y-0"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0"
        }`}
        title="Open Deleted Fields Panel to restore removed fields"
      >
        <div className="relative flex items-center justify-center">
          <Trash2
            size={15}
            className={
              totalCount > 0
                ? "text-sky-400 group-hover:scale-110 transition-transform duration-150"
                : "text-slate-400 group-hover:text-slate-600 transition-colors"
            }
          />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-400 rounded-full animate-ping" />
          )}
        </div>
        <span className="tracking-wide">Deleted Fields</span>
        {totalCount > 0 && (
          <span className="bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            {totalCount}
          </span>
        )}
      </button>

      {/* Render overlay and drawer via Portal at document.body root */}
      {mounted ? createPortal(drawerMarkup, document.body) : null}
    </div>
  );
};

export default DeletedFieldsPanel;
