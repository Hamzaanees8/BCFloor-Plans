'use client';

import React from 'react';
import { useUploadQueue } from '@/context/UploadQueueContext';
import { X, CheckCircle, AlertCircle, Loader2, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';

export function UploadProgressToast() {
    const {
        queue,
        stats,
        isUploading,
        removeFromQueue,
        retryUpload,
        clearCompleted,
    } = useUploadQueue();

    const [isExpanded, setIsExpanded] = React.useState(false);

    // Don't render if queue is empty
    if (queue.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : stats.error > 0 ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium">
                        {isUploading
                            ? `Uploading ${stats.complete + stats.processing}/${stats.total} files (${stats.overallProgress}%)`
                            : stats.error > 0
                                ? `${stats.error} failed`
                                : 'Upload complete'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-gray-200">
                <div
                    className={`h-full transition-all duration-300 ${stats.error > 0 ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                    style={{ width: `${stats.overallProgress}%` }}
                />
            </div>

            {/* Expanded file list */}
            {isExpanded && (
                <div className="max-h-64 overflow-y-auto">
                    {queue.map(file => (
                        <div key={file.id} className="flex items-center gap-2 p-2 border-b border-gray-100 text-sm">
                            <StatusIcon status={file.status} />
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-gray-700">{file.filename}</p>
                                {file.status === 'uploading' && (
                                    <div className="h-1 bg-gray-200 rounded mt-1">
                                        <div
                                            className="h-full bg-blue-500 rounded transition-all"
                                            style={{ width: `${file.progress}%` }}
                                        />
                                    </div>
                                )}
                                {file.error && (
                                    <p className="text-xs text-red-500 truncate">{file.error}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {file.status === 'error' && (
                                    <button
                                        onClick={() => retryUpload(file.id)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="Retry"
                                    >
                                        <RefreshCw className="w-3 h-3 text-gray-500" />
                                    </button>
                                )}
                                {(file.status === 'complete' || file.status === 'error') && (
                                    <button
                                        onClick={() => removeFromQueue(file.id)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                        title="Remove"
                                    >
                                        <X className="w-3 h-3 text-gray-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer actions */}
            {isExpanded && stats.complete > 0 && (
                <div className="p-2 bg-gray-50 border-t">
                    <button
                        onClick={clearCompleted}
                        className="text-xs text-blue-500 hover:underline"
                    >
                        Clear completed
                    </button>
                </div>
            )}
        </div>
    );
}

function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'pending':
            return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
        case 'uploading':
            return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
        case 'processing': // User requested check instead of loader
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'complete':
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'error':
            return <AlertCircle className="w-4 h-4 text-red-500" />;
        default:
            return null;
    }
}
