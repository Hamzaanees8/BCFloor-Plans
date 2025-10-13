"use client";

import UnsavedChangesDialog from "@/components/UnsavedChangesDialog";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type ConfirmOptions = {
  title?: string;
  description?: string;
};

type UnsavedContextType = {
  isDirty: boolean;
  setIsDirty: (v: boolean) => void;
  // ask to confirm before running action. If not dirty, runs immediately.
  confirmNavigation: (action: () => void, opts?: ConfirmOptions) => void;
};

const UnsavedContext = createContext<UnsavedContextType>({
  isDirty: false,
  setIsDirty: () => {},
  confirmNavigation: () => {},
});

export const UnsavedProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDirty, setIsDirty] = useState(false);

  // dialog state
  const [open, setOpen] = useState(false);
  const nextActionRef = useRef<(() => void) | null>(null);
  const optionsRef = useRef<ConfirmOptions>({});

  // Called by components who want navigation confirmation
  const confirmNavigation = (action: () => void, opts?: ConfirmOptions) => {
    if (!isDirty) {
      // nothing unsaved → just run
      action();
      return;
    }

    // store the action and show dialog
    nextActionRef.current = action;
    optionsRef.current = opts || {
      title: "Unsaved Changes",
      description: "You have unsaved changes. Do you want to leave without saving?",
    };
    setOpen(true);
  };

  const handleConfirm = () => {
    // user chose to discard & proceed
    setIsDirty(false); // clear dirty state
    setOpen(false);
    const action = nextActionRef.current;
    nextActionRef.current = null;
    optionsRef.current = {};
    if (action) action();
  };

  const handleCancel = () => {
    // just close and keep dirty state
    setOpen(false);
    nextActionRef.current = null;
    optionsRef.current = {};
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
    <UnsavedContext.Provider value={{ isDirty, setIsDirty, confirmNavigation }}>
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
