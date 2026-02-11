// app/dashboard/file-manager/components/UploadProgressOverlay.tsx
'use client';

import React from 'react';
import { FileUploadState } from '@/lib/upload/types';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

interface UploadProgressOverlayProps {
    uploadStates: FileUploadState[];
    overallProgress: number;
    isUploading: boolean;
    onClose?: () => void;
}

export function UploadProgressOverlay({
    uploadStates,
    overallProgress,
    isUploading,
    onClose,
}: UploadProgressOverlayProps) {
    if (!isUploading && uploadStates.length === 0) {
        return null;
    }

    const completedCount = uploadStates.filter(s => s.status === 'complete').length;
    const errorCount = uploadStates.filter(s => s.status === 'error').length;
    const totalCount = uploadStates.length;

    return (
        <div className="fixed bottom-6 right-6 z-[200] w-[420px] max-w-[calc(100vw-3rem)]">
            <div className="bg-white rounded-xl p-6 shadow-2xl border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">
                            {isUploading ? 'Uploading Files...' : 'Upload Complete'}
                        </h3>
                        {isUploading && (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        )}
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}
                </div>

                {/* Overall Progress */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-700">
                            Overall Progress
                        </span>
                        <span className="text-xs font-bold text-gray-900">
                            {completedCount} / {totalCount} files
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                    <div className="text-right mt-1">
                        <span className="text-xs font-semibold text-blue-600">
                            {overallProgress}%
                        </span>
                    </div>
                </div>

                {/* Individual File Progress */}
                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {uploadStates.map((state, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {state.status === 'complete' && (
                                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    )}
                                    {state.status === 'error' && (
                                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                    )}
                                    {(state.status === 'uploading' || state.status === 'confirming') && (
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600 flex-shrink-0" />
                                    )}
                                    <span className="text-xs font-medium text-gray-900 truncate">
                                        {state.file.name}
                                    </span>
                                </div>
                                <span className="text-[10px] text-gray-500 ml-2 flex-shrink-0">
                                    {(state.file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>

                            {/* Progress bar for individual file */}
                            {state.status !== 'error' && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-300 ${state.status === 'complete'
                                                ? 'bg-green-500'
                                                : state.status === 'confirming'
                                                    ? 'bg-yellow-500'
                                                    : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${state.progress}%` }}
                                    />
                                </div>
                            )}

                            {/* Status text */}
                            <div className="mt-1.5 flex justify-between items-center">
                                <span className="text-[10px] text-gray-600">
                                    {state.status === 'pending' && 'Waiting...'}
                                    {state.status === 'uploading' && `Uploading... ${state.progress}%`}
                                    {state.status === 'confirming' && 'Processing...'}
                                    {state.status === 'complete' && 'Complete'}
                                    {state.status === 'error' && (
                                        <span className="text-red-600">
                                            {state.error || 'Upload failed'}
                                        </span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                {!isUploading && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-600">
                                {errorCount > 0 ? (
                                    <span className="text-red-600 font-medium">
                                        {errorCount} file{errorCount !== 1 ? 's' : ''} failed
                                    </span>
                                ) : (
                                    <span className="text-green-600 font-medium">
                                        All files uploaded successfully!
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
