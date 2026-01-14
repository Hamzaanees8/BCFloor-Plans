// hooks/useConfirmation.ts
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'confirmation_dialog_show_again';

export const useConfirmation = () => {
    const [showDialog, setShowDialog] = useState(false);
    const [shouldShowAgain, setShouldShowAgain] = useState(true);
    const [pendingAction, setPendingAction] = useState<() => void>(() => () => { });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
            setShouldShowAgain(JSON.parse(saved));
        }
    }, []);

    // Save to localStorage
    const saveToStorage = useCallback((value: boolean) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    }, []);

    const confirmAction = useCallback((action: () => void) => {
        setPendingAction(() => action);

        if (shouldShowAgain) {
            setShowDialog(true);
        } else {
            // Execute immediately if user chose "don't show again"
            action();
        }
    }, [shouldShowAgain]);

    const handleConfirm = () => {
        pendingAction();
        setShowDialog(false);
    };

    const handleToggleShowAgain = () => {
        const newValue = !shouldShowAgain;
        setShouldShowAgain(newValue);
        saveToStorage(newValue);
    };

    return {
        showDialog,
        setShowDialog,
        shouldShowAgain,
        toggleShowAgain: handleToggleShowAgain,
        confirmAction,
        handleConfirm,
    };
};