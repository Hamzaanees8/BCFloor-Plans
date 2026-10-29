"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { TextStyle } from "../types/featureSheetTypes";
import type { CustomFontOption } from "./StyledInput";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveFieldInfo {
  fieldId: string;
  fieldLabel: string;
  currentStyle: TextStyle;
  customFonts: CustomFontOption[];
  onStyleChange: (style: TextStyle) => void;
  /** Move by dx, dy in logical (un-zoomed) px. Supplied by DraggableBox. */
  onNudge?: (dx: number, dy: number) => void;
  onDelete?: () => void;
  onResetPosition?: () => void;
}

export interface FieldPanelContextValue {
  activeField: ActiveFieldInfo | null;
  isDeletedFieldsOpen: boolean;
  /** Call this when a field is focused / clicked. */
  openPanel: (info: ActiveFieldInfo) => void;
  /** Call this to deactivate the field editor panel. */
  closePanel: () => void;
  /** Set deleted fields panel open state directly. */
  setDeletedFieldsOpen: (open: boolean) => void;
  /** Open deleted fields panel (and close field editor). */
  openDeletedFieldsPanel: () => void;
  /** Close deleted fields panel. */
  closeDeletedFieldsPanel: () => void;
  /** Convenience: update style on the currently active field. */
  updateActiveStyle: (style: TextStyle) => void;
  /** Dynamically attach nudge, reset, and delete handlers to activeField. */
  updateActiveFieldHandlers: (handlers: {
    onNudge?: (dx: number, dy: number) => void;
    onResetPosition?: () => void;
    onDelete?: () => void;
  }) => void;
  /** Close BOTH field editor and deleted fields sidebars. */
  closeAllSidebars: () => void;
}

// Global event name for closing all feature sheet sidebars
export const CLOSE_SIDEBARS_EVENT = "bcfp:close-sidebars";

/** Broadcast a global event to close all feature sheet sidebars (Field Editor & Deleted Fields). */
export const closeFeatureSheetSidebars = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CLOSE_SIDEBARS_EVENT));
  }
};

// ─── Context ─────────────────────────────────────────────────────────────────

const FieldPanelContext = createContext<FieldPanelContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FieldPanelProvider({ children }: { children: React.ReactNode }) {
  const [activeField, setActiveField] = useState<ActiveFieldInfo | null>(null);
  const [isDeletedFieldsOpen, setIsDeletedFieldsOpen] = useState(false);

  const openPanel = useCallback((info: ActiveFieldInfo) => {
    // Opening Field Editor automatically closes Deleted Fields sidebar
    setIsDeletedFieldsOpen(false);
    setActiveField(info);
  }, []);

  const closePanel = useCallback(() => {
    setActiveField(null);
  }, []);

  const setDeletedFieldsOpen = useCallback((open: boolean) => {
    if (open) {
      // Opening Deleted Fields automatically closes Field Editor sidebar
      setActiveField(null);
    }
    setIsDeletedFieldsOpen(open);
  }, []);

  const openDeletedFieldsPanel = useCallback(() => {
    setActiveField(null);
    setIsDeletedFieldsOpen(true);
  }, []);

  const closeDeletedFieldsPanel = useCallback(() => {
    setIsDeletedFieldsOpen(false);
  }, []);

  const closeAllSidebars = useCallback(() => {
    setActiveField(null);
    setIsDeletedFieldsOpen(false);
    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement)?.blur?.();
    }
  }, []);

  const updateActiveStyle = useCallback((style: TextStyle) => {
    setActiveField((prev) => {
      if (!prev) return prev;
      prev.onStyleChange(style);
      return { ...prev, currentStyle: style };
    });
  }, []);

  const updateActiveFieldHandlers = useCallback((handlers: {
    onNudge?: (dx: number, dy: number) => void;
    onResetPosition?: () => void;
    onDelete?: () => void;
  }) => {
    setActiveField((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        onNudge: handlers.onNudge ?? prev.onNudge,
        onResetPosition: handlers.onResetPosition ?? prev.onResetPosition,
        onDelete: handlers.onDelete ?? prev.onDelete,
      };
    });
  }, []);

  // Listen for Ctrl + Del (or Cmd + Del on Mac) to delete the currently selected input field
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeField) return;

      const isDeleteKey =
        e.key === "Delete" ||
        e.key === "Del" ||
        e.code === "Delete" ||
        (e.metaKey && e.key === "Backspace");

      if ((e.ctrlKey || e.metaKey) && isDeleteKey) {
        if (typeof activeField.onDelete === "function") {
          e.preventDefault();
          e.stopPropagation();
          activeField.onDelete();
          closePanel();
          if (typeof document !== "undefined") {
            (document.activeElement as HTMLElement)?.blur?.();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [activeField, closePanel]);

  // Listen for global close sidebars event broadcast
  React.useEffect(() => {
    const handleCloseEvent = () => {
      closeAllSidebars();
    };
    window.addEventListener(CLOSE_SIDEBARS_EVENT, handleCloseEvent);
    return () => {
      window.removeEventListener(CLOSE_SIDEBARS_EVENT, handleCloseEvent);
    };
  }, [closeAllSidebars]);

  const value = React.useMemo(
    () => ({
      activeField,
      isDeletedFieldsOpen,
      openPanel,
      closePanel,
      setDeletedFieldsOpen,
      openDeletedFieldsPanel,
      closeDeletedFieldsPanel,
      closeAllSidebars,
      updateActiveStyle,
      updateActiveFieldHandlers,
    }),
    [
      activeField,
      isDeletedFieldsOpen,
      openPanel,
      closePanel,
      setDeletedFieldsOpen,
      openDeletedFieldsPanel,
      closeDeletedFieldsPanel,
      closeAllSidebars,
      updateActiveStyle,
      updateActiveFieldHandlers,
    ],
  );

  return (
    <FieldPanelContext.Provider value={value}>
      {children}
    </FieldPanelContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Returns the FieldPanel context, or null if used outside a provider. */
export function useFieldPanel(): FieldPanelContextValue | null {
  return useContext(FieldPanelContext);
}
