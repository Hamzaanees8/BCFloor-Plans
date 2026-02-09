// app/dashboard/file-manager/components/UploadProgressOverlay.tsx
'use client';

import React from 'react';
import { FileUploadState } from '@/lib/upload/types';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface UploadProgressOverlayProps {
    uploadStates: FileUploadState[];
    overallProgress: number;
    isUploading: boolean;
}

export function UploadProgressOverlay({
    uploadStates,
    overallProgress,
    isUploading,
}: UploadProgressOverlayProps) {
    if (!isUploading && uploadStates.length === 0) {
        return null;
    }

    const completedCount = uploadStates.filter(s => s.status === 'complete').length;
    const errorCount = uploadStates.filter(s => s.status === 'error').length;
    const totalCount = uploadStates.length;

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">
                        {isUploading ? 'Uploading Files...' : 'Upload Complete'}
                    </h3>
                    {isUploading && (
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    )}
                </div>

                {/* Overall Progress */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Overall Progress
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                            {completedCount} / {totalCount} files
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
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
                <div className="max-h-96 overflow-y-auto space-y-3">
                    {uploadStates.map((state, index) => (
                        <div
                            key={index}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {state.status === 'complete' && (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    )}
                                    {state.status === 'error' && (
                                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                    )}
                                    {(state.status === 'uploading' || state.status === 'confirming') && (
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 flex-shrink-0" />
                                    )}
                                    <span className="text-sm font-medium text-gray-900 truncate">
                                        {state.file.name}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {(state.file.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                            </div>

                            {/* Progress bar for individual file */}
                            {state.status !== 'error' && (
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
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
                            <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs text-gray-600">
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
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600">
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
