// app/dashboard/file-manager/components/UploadProgressOverlay.tsx
'use client';

import React from 'react';
import { FileUploadState } from '@/lib/upload/types';
import { Loader2, CheckCircle2, XCircle, X, ChevronUp, ChevronDown, UploadCloud } from 'lucide-react';

interface UploadProgressOverlayProps {
    uploadStates: FileUploadState[];
    overallProgress: number;
    isUploading: boolean;
    onClose?: () => void;
}

// Simulates a smooth, fake loader for a file that's "pending" but in an active batch
function useFakeProgress(active: boolean): number {
    const [fakeProgress, setFakeProgress] = React.useState(0);

    React.useEffect(() => {
        if (!active) {
            setFakeProgress(0);
            return;
        }
        const interval = setInterval(() => {
            setFakeProgress(prev => {
                if (prev >= 90) return prev;
                const increment = prev < 40 ? 4 : prev < 70 ? 2 : 1;
                return Math.min(90, prev + increment);
            });
        }, 120);
        return () => clearInterval(interval);
    }, [active]);

    return fakeProgress;
}

function FileRow({ state, isActiveBatch }: { state: FileUploadState; isActiveBatch: boolean }) {
    const isReallyUploading = state.status === 'uploading' || state.status === 'confirming';
    const isComplete = state.status === 'complete';
    const isError = state.status === 'error';
    const isPending = state.status === 'pending';

    const showFakeLoader = isActiveBatch && isPending;
    const fakeProgress = useFakeProgress(showFakeLoader);

    let displayProgress = 0;
    if (isComplete) displayProgress = 100;
    else if (isReallyUploading) displayProgress = state.progress || 0;
    else if (showFakeLoader) displayProgress = fakeProgress;

    const isAnimating = isReallyUploading || showFakeLoader;
    const sizeInMB = (state.file.size / 1024 / 1024).toFixed(2);

    return (
        <div
            className={`rounded-lg p-2.5 border transition-all duration-300 ${isComplete
                    ? 'bg-green-50/50 border-green-100'
                    : isError
                        ? 'bg-red-50 border-red-100'
                        : isAnimating
                            ? 'bg-blue-50/50 border-blue-100 shadow-sm'
                            : 'bg-white border-gray-100'
                }`}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : isError ? (
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    ) : isAnimating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />
                    ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" />
                    )}

                    <span className={`text-[13px] font-medium truncate ${isComplete ? 'text-green-700' : isError ? 'text-red-700' : 'text-gray-700'}`}>
                        {state.file.name}
                    </span>
                </div>
                <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0 font-medium">{sizeInMB} MB</span>
            </div>

            {!isError && (
                <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ease-out ${isComplete ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                        style={{ width: `${displayProgress}%` }}
                    />
                </div>
            )}

            <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] font-semibold tracking-tight uppercase">
                    {isComplete && <span className="text-green-600">Uploaded</span>}
                    {isError && <span className="text-red-500">Failed</span>}
                    {isReallyUploading && <span className="text-blue-500">Uploading... {Math.round(displayProgress)}%</span>}
                    {showFakeLoader && <span className="text-blue-400 italic">Processing... {Math.round(fakeProgress)}%</span>}
                    {isPending && !isActiveBatch && <span className="text-gray-300">Queued</span>}
                </span>
                {isComplete && <span className="text-[10px] font-bold text-green-600">Done</span>}
            </div>
        </div>
    );
}

export function UploadProgressOverlay({
    uploadStates,
    overallProgress,
    isUploading,
    onClose,
}: UploadProgressOverlayProps) {
    const [isExpanded, setIsExpanded] = React.useState(true);
    const BATCH_SIZE = 5;

    if (!isUploading && uploadStates.length === 0) {
        return null;
    }

    const completedCount = uploadStates.filter(s => s.status === 'complete').length;
    const errorCount = uploadStates.filter(s => s.status === 'error').length;
    const totalCount = uploadStates.length;
    const isAllDone = !isUploading && totalCount > 0;

    const activeBatchStart = Math.floor(completedCount / BATCH_SIZE) * BATCH_SIZE;
    const activeBatchEnd = activeBatchStart + BATCH_SIZE;

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <div className="fixed bottom-6 right-6 z-[200] w-[380px] max-w-[calc(100vw-3rem)] pb-2">
            <div className="bg-white rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-gray-100 overflow-hidden transition-all duration-300">

                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 py-4 cursor-pointer select-none bg-white border-b border-gray-50"
                    onClick={toggleExpand}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isAllDone && errorCount === 0 ? 'bg-green-50' : 'bg-blue-50'}`}>
                            {isAllDone && errorCount === 0 ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                                <UploadCloud className={`w-5 h-5 ${isUploading ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
                            )}
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-gray-800 leading-tight">
                                {isAllDone && errorCount === 0
                                    ? 'Upload Complete'
                                    : isAllDone && errorCount > 0
                                        ? 'Finished with errors'
                                        : 'Uploading Media'}
                            </h3>
                            <p className="text-[11px] text-gray-400 font-semibold mt-0.5 uppercase tracking-wide">
                                {completedCount} of {totalCount} files done
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-gray-400" />
                            : <ChevronUp className="w-4 h-4 text-gray-400" />
                        }
                        {onClose && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Overall Progress */}
                <div className="px-5 py-4 bg-white">
                    <div className="flex justify-between items-center mb-2.5">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Global Progress
                        </span>
                        <span className={`text-[15px] font-bold tabular-nums ${isAllDone && errorCount === 0 ? 'text-green-500' : 'text-blue-500'}`}>
                            {overallProgress}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-100">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${isAllDone && errorCount === 0 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>

                {/* File List */}
                {isExpanded && (
                    <div className="max-h-[300px] overflow-y-auto px-4 pb-4 space-y-2.5 custom-scrollbar bg-white">
                        {uploadStates.map((state, index) => {
                            const isActiveBatch = index >= activeBatchStart && index < activeBatchEnd;
                            return (
                                <FileRow
                                    key={index}
                                    state={state}
                                    isActiveBatch={isActiveBatch}
                                />
                            );
                        })}

                        {isAllDone && errorCount === 0 && (
                            <div className="pt-2">
                                <div className="p-3 bg-green-50 rounded-lg text-center border border-green-100">
                                    <p className="text-[12px] font-semibold text-green-700">
                                        All media successfully processed
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
