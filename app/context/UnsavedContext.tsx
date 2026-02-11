"use client";

import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type ConfirmOptions = {
  title?: string;
  description?: string;
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
      // nothing unsaved → just run
      action();
      return;
    }

    // store the action and show dialog
    nextActionRef.current = action;

    // Prioritize options set via setIsDirty (stored in optionsRef.current) 
    // over generic options passed to confirmNavigation
    const finalTitle = optionsRef.current.title || opts?.title || "Unsaved Changes";
    const finalDescription = optionsRef.current.description || opts?.description || "You have unsaved changes. Do you want to leave without saving?";

    optionsRef.current = {
      title: finalTitle,
      description: finalDescription,
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

  const handleCancel = () => {
    // just close and keep dirty state
    setOpen(false);
    nextActionRef.current = null;
    // Don't clear optionsRef.current here because we are still dirty
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
        onCancel={handleCancel}
        title={optionsRef.current?.title}
        description={optionsRef.current?.description}
      />
    </UnsavedContext.Provider>
  );
};

export const useUnsaved = () => useContext(UnsavedContext);
