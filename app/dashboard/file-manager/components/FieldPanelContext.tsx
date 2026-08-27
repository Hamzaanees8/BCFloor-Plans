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

interface FieldPanelContextValue {
  activeField: ActiveFieldInfo | null;
  /** Call this when a field is focused / clicked. */
  openPanel: (info: ActiveFieldInfo) => void;
  /** Call this to deactivate the panel (e.g. click outside). */
  closePanel: () => void;
  /** Convenience: update style on the currently active field. */
  updateActiveStyle: (style: TextStyle) => void;
  /** Dynamically attach nudge, reset, and delete handlers to activeField. */
  updateActiveFieldHandlers: (handlers: {
    onNudge?: (dx: number, dy: number) => void;
    onResetPosition?: () => void;
    onDelete?: () => void;
  }) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const FieldPanelContext = createContext<FieldPanelContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FieldPanelProvider({ children }: { children: React.ReactNode }) {
  const [activeField, setActiveField] = useState<ActiveFieldInfo | null>(null);

  const openPanel = useCallback((info: ActiveFieldInfo) => {
    setActiveField(info);
  }, []);

  const closePanel = useCallback(() => {
    setActiveField(null);
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

  return (
    <FieldPanelContext.Provider
      value={{
        activeField,
        openPanel,
        closePanel,
        updateActiveStyle,
        updateActiveFieldHandlers,
      }}
    >
      {children}
    </FieldPanelContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/** Returns the FieldPanel context, or null if used outside a provider. */
export function useFieldPanel(): FieldPanelContextValue | null {
  return useContext(FieldPanelContext);
}
