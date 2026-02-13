'use client';

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { FileUploadState } from '@/lib/upload/types';
import { UploadFilesData, UpdateFilesData } from '@/app/dashboard/file-manager/file-manager';
import { SelectedFiles, DroppedMarker, Files } from '@/app/dashboard/file-manager/FileManagerContext';

interface UploadParams {
    token: string;
    orderUuid?: string;
    filesDataUuid?: string;
    files: SelectedFiles[];
    links: any[]; // Using any to match the loose typing in file-manager.ts, refine if possible
    droppedMarkers: DroppedMarker[];
    delay: number;
    transition: string;
    selectedAudioTrack: string;
    changedFiles?: Files[]; // Only for update
    isUpdate: boolean;
}

interface GlobalFileUploadContextType {
    uploadStates: FileUploadState[];
    overallProgress: number;
    isUploading: boolean;
    startUpload: (params: UploadParams) => Promise<any>;
    closeProgress: () => void;
}

const GlobalFileUploadContext = createContext<GlobalFileUploadContextType | undefined>(undefined);

export function GlobalFileUploadProvider({ children }: { children: ReactNode }) {
    const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [overallProgress, setOverallProgress] = useState(0);
    const progressIntervalsRef = useRef<NodeJS.Timeout[]>([]);

    const closeProgress = useCallback(() => {
        setUploadStates([]);
        setOverallProgress(0);
        setIsUploading(false);
    }, []);

    const startUpload = useCallback(async (params: UploadParams) => {
        const {
            token,
            orderUuid,
            filesDataUuid,
            files,
            links,
            droppedMarkers,
            delay,
            transition,
            selectedAudioTrack,
            changedFiles,
            isUpdate
        } = params;

        // Get all files to upload
        const allFiles = files.filter(f => !f.is_deleted);

        // Initialize upload states
        if (allFiles.length > 0) {
            setIsUploading(true);
            const initialStates: FileUploadState[] = allFiles.map(f => ({
                file: f.file,
                progress: 0,
                status: 'pending' as const,
            }));
            setUploadStates(initialStates);

            // Start simulated progress
            progressIntervalsRef.current = [];
            allFiles.forEach((_, index) => {
                const interval = setInterval(() => {
                    setUploadStates(prev => {
                        const newStates = [...prev];
                        if (newStates[index] && newStates[index].status === 'uploading' && newStates[index].progress < 95) {
                            const currentProgress = newStates[index].progress;
                            const increment = currentProgress < 50 ? 3 : currentProgress < 80 ? 2 : 1;
                            newStates[index] = {
                                ...newStates[index],
                                progress: Math.min(95, currentProgress + increment),
                            };
                        }
                        return newStates;
                    });
                }, 500);
                progressIntervalsRef.current.push(interval);
            });

            // Mark as uploading
            setUploadStates(prev => prev.map(state => ({
                ...state,
                status: 'uploading' as const,
            })));
        }

        try {
            let response;
            if (isUpdate && filesDataUuid) {
                response = await UpdateFilesData(
                    token,
                    filesDataUuid,
                    files,
                    links,
                    droppedMarkers,
                    delay,
                    transition,
                    selectedAudioTrack || "none",
                    changedFiles
                );
            } else if (orderUuid) {
                response = await UploadFilesData(
                    token,
                    orderUuid,
                    files,
                    links,
                    droppedMarkers,
                    delay,
                    transition,
                    selectedAudioTrack || "none",
                    (index, progress, status) => {
                        // Real progress update if supported by UploadFilesData (it has a callback now)
                        // However, for consistency with existing logic, we might rely on simulation + final completion
                        // If we want real progress, we need to map the index correctly.
                        // The simulation logic above is what was in FileManager.tsx, so preserving it.
                        // We can update the state here if needed, but let's stick to the simulation for now as per the request to "make it global" (not necessarily rewrite logic).
                    }
                );
            } else {
                throw new Error("Missing orderUuid or filesDataUuid");
            }

            // Clear intervals
            progressIntervalsRef.current.forEach(interval => clearInterval(interval));
            progressIntervalsRef.current = [];

            // Complete
            setUploadStates(prev => prev.map(state => ({
                ...state,
                progress: 100,
                status: 'complete' as const,
            })));
            setOverallProgress(100);
            setIsUploading(false);

            toast.success("All changes saved successfully!");
            return response;
        } catch (error) {
            progressIntervalsRef.current.forEach(interval => clearInterval(interval));
            progressIntervalsRef.current = [];

            setUploadStates(prev => prev.map(state => ({
                ...state,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Upload failed',
            })));

            setIsUploading(false);

            let errorMessage = "An error occurred while saving changes.";
            if (error instanceof Error) {
                try {
                    const errorObj = JSON.parse(error.message);
                    if (errorObj.message && typeof errorObj.message === 'object') {
                        const validationErrors = Object.values(errorObj.message).flat();
                        errorMessage = validationErrors.join(', ');
                    } else if (errorObj.message) {
                        errorMessage = errorObj.message;
                    } else {
                        errorMessage = error.message;
                    }
                } catch {
                    errorMessage = error.message;
                }
            }
            toast.error(errorMessage);
            throw error; // Re-throw to let caller know
        }
    }, []);

    // Update overall progress
    React.useEffect(() => {
        if (uploadStates.length === 0) {
            // Only reset if not explicitly closed? logic in FileManager was:
            // setOverallProgress(0) if length === 0.
            return;
        }
        const totalProgress = uploadStates.reduce((sum, state) => sum + state.progress, 0);
        const average = Math.round(totalProgress / uploadStates.length);
        setOverallProgress(average);
    }, [uploadStates]);

    return (
        <GlobalFileUploadContext.Provider value={{
            uploadStates,
            overallProgress,
            isUploading,
            startUpload,
            closeProgress
        }}>
            {children}
        </GlobalFileUploadContext.Provider>
    );
}

export const useGlobalFileUpload = () => {
    const context = useContext(GlobalFileUploadContext);
    if (!context) {
        throw new Error('useGlobalFileUpload must be used within GlobalFileUploadProvider');
    }
    return context;
};
