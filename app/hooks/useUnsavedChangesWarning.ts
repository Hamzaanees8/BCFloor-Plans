"use client";
import { useEffect } from "react";

/**
 * Hook to warn user about unsaved changes when navigating away or closing tab
 * @param isDirty - true if form has unsaved changes
 */
export default function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Must assign a non-empty string for some browsers
        e.returnValue = "You have unsaved changes. Leave without saving?";
        return "You have unsaved changes. Leave without saving?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Back/forward button
  useEffect(() => {
    const handlePopState = () => {
      if (
        isDirty &&
        !window.confirm("You have unsaved changes. Leave without saving?")
      ) {
        // pushState reverts navigation if user cancels
        history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirty]);
}
