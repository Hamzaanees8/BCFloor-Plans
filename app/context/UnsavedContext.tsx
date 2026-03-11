"use client";

import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type ConfirmOptions = {
  title?: string;
  description?: string;
  onSave?: () => Promise<void>;
  confirmLabel?: string;
  cancelLabel?: string;
};

type UnsavedContextType = {
  isDirty: boolean;
  setIsDirty: (v: boolean, opts?: ConfirmOptions) => void;
  // ask to confirm before running action. If not dirty, runs immediately.
  confirmNavigation: (action: () => void, opts?: ConfirmOptions) => void;
};

const UnsavedContext = createContext<UnsavedContextType>({
  isDirty: false,
  setIsDirty: () => { },
  confirmNavigation: () => { },
});

export const UnsavedProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDirty, setIsDirty] = useState(false);

  // dialog state
  const [open, setOpen] = useState(false);
  const nextActionRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef<ConfirmOptions>({});

  const setIsDirtyWithOpts = (v: boolean, opts?: ConfirmOptions) => {
    setIsDirty(v);
    if (v && opts) {
      optionsRef.current = opts;
    } else if (!v) {
      optionsRef.current = {};
    }
  };

  // Called by components who want navigation confirmation
  const confirmNavigation = (action: () => void, opts?: ConfirmOptions) => {
    if (!isDirty) {
      action();
      return;
    }

    nextActionRef.current = action;

    const finalTitle = optionsRef.current.title || opts?.title || "Unsaved Changes";
    const finalDescription = optionsRef.current.description || opts?.description || "You have unsaved changes. Do you want to leave without saving?";
    const finalOnSave = optionsRef.current.onSave || opts?.onSave;
    const finalConfirmLabel = optionsRef.current.confirmLabel || opts?.confirmLabel;
    const finalCancelLabel = optionsRef.current.cancelLabel !== undefined ? optionsRef.current.cancelLabel : opts?.cancelLabel;

    optionsRef.current = {
      title: finalTitle,
      description: finalDescription,
      onSave: finalOnSave,
      confirmLabel: finalConfirmLabel,
      cancelLabel: finalCancelLabel,
    };
    setOpen(true);
  };

  const handleConfirm = () => {
    // user chose to discard & proceed
    setIsDirty(false); // clear dirty state
    optionsRef.current = {}; // clear options
    setOpen(false);
    const action = nextActionRef.current;
    nextActionRef.current = null;
    if (action) action();
  };

  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = ""; // required by some browsers
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [isDirty]);

  return (
    <UnsavedContext.Provider value={{ isDirty, setIsDirty: setIsDirtyWithOpts, confirmNavigation }}>
      {children}
      {/* Dialog mounted globally so it can be triggered from anywhere */}
      <UnsavedChangesDialog
        open={open}
        setOpen={setOpen}
        onConfirm={handleConfirm}
        onSave={optionsRef.current?.onSave}
        title={optionsRef.current?.title}
        description={optionsRef.current?.description}
        confirmLabel={optionsRef.current?.confirmLabel}
        cancelLabel={optionsRef.current?.cancelLabel}
      />
    </UnsavedContext.Provider>
  );
};

export const useUnsaved = () => useContext(UnsavedContext);
