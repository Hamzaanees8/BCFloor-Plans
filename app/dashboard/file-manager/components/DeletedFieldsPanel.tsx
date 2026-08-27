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
  userType?: string;
}

export const DeletedFieldsPanel: React.FC<DeletedFieldsPanelProps> = ({
  deletedFields,
  onRestore,
  onRestoreAll,
  isOpen: controlledIsOpen,
  onToggle,
  className = "",
  userType = "admin",
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
      {/* ─── BACKDROP OVERLAY ─────────────────── */}
      {isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-[99999] pointer-events-auto transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* ─── SLIDE-OUT SIDEBAR OVER SCREEN ───────── */}
      <div
        style={{
          left: `${sidebarLeftOffset}px`,
        }}
        className={`fixed inset-y-0 z-[100000] w-[360px] max-w-[calc(100vw-${sidebarLeftOffset}px-16px)] bg-white text-gray-800 border-r border-gray-200/80 shadow-2xl flex flex-col font-alexandria transition-all duration-300 ease-out pointer-events-auto ${
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "-translate-x-full opacity-0 invisible pointer-events-none"
        } ${className}`}
      >
        {/* Drawer Header */}
        <div className={`p-4 border-b border-gray-200/80 ${userType}-bg text-white flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center border border-white/20 shadow-2xs">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-wide font-alexandria">
                  Deleted Fields
                </h3>
                <span className="bg-white/20 text-white border border-white/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalCount} {totalCount === 1 ? "field" : "fields"}
                </span>
              </div>
              <p className="text-[11px] text-white/80 mt-0.5 font-alexandria">
                Click restore to return fields to the sheet
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
            title="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Bar / Search */}
        <div className="p-3.5 border-b border-gray-100 bg-white flex flex-col gap-2.5 shrink-0">
          {totalCount > 0 && onRestoreAll && (
            <button
              type="button"
              onClick={onRestoreAll}
              className={`w-full flex items-center justify-center gap-2 ${userType}-bg hover:brightness-95 text-white text-xs font-semibold py-2.5 px-3.5 rounded-lg shadow-2xs transition-all cursor-pointer font-alexandria`}
            >
              <RotateCcw size={13} strokeWidth={2.5} />
              <span>Restore All ({totalCount})</span>
            </button>
          )}

          {totalCount > 2 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deleted fields..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-2 text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-alexandria"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Field List Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 custom-scrollbar min-h-0 bg-gray-50/50">
          {totalCount === 0 ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 mb-3 shadow-2xs">
                <Sparkles size={22} />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1 font-alexandria">
                No Deleted Fields
              </h4>
              <p className="text-xs text-gray-400 max-w-[220px] leading-relaxed font-alexandria">
                All fields are active on the sheet. Deleting any field makes it appear here for instant restore.
              </p>
            </div>
          ) : filteredFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-alexandria">
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
                  className="bg-white hover:bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 transition-all flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-wide truncate font-alexandria">
                        {displayTitle}
                      </span>
                      {field.column && (
                        <span className="text-[9px] font-semibold uppercase bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-md font-alexandria">
                          {field.column}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-600 truncate mt-1 font-medium font-alexandria">
                      {displayValue || (
                        <span className="text-gray-400 italic">
                          Empty value
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRestore(field.id)}
                    className={`shrink-0 flex items-center gap-1.5 ${userType}-bg hover:brightness-95 text-white border-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs font-alexandria cursor-pointer`}
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
        <div className="p-3.5 border-t border-gray-200/80 bg-gray-50/80 text-center shrink-0">
          <p className="text-[11px] text-gray-500 font-medium font-alexandria">
            Restored fields return to their original position on the sheet
          </p>
        </div>
      </div>
    </>
  );

  return (
    <div
      data-html2canvas-ignore="true"
      className="font-alexandria antialiased select-none pointer-events-auto"
    >
      {/* ─── TRIGGER BUTTON ─── */}
      <button
        type="button"
        onClick={isOpen ? handleClose : handleOpen}
        aria-label="Toggle Deleted Fields Sidebar"
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg shadow-2xs border transition-all duration-200 text-xs font-semibold cursor-pointer pointer-events-auto font-alexandria ${
          totalCount > 0
            ? `${userType}-bg text-white border-transparent hover:brightness-95 shadow-sm`
            : "bg-white text-gray-700 border-gray-200/80 hover:bg-gray-50 shadow-2xs"
        }`}
        title="Open Deleted Fields Panel to restore removed fields"
      >
        <div className="relative flex items-center justify-center">
          <Trash2
            size={14}
            className={
              totalCount > 0
                ? "text-white"
                : "text-gray-500"
            }
          />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
          )}
        </div>
        <span className="tracking-wide">Deleted Fields</span>
        {totalCount > 0 && (
          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
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
