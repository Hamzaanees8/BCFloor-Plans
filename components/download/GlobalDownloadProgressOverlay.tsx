'use client';

import React from 'react';
import { useGlobalDownload } from '@/context/GlobalDownloadContext';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

export function GlobalDownloadProgressOverlay() {
    const { isDownloading, progress, error, statusText, closeProgress } = useGlobalDownload();
    const { userType } = useAppContext();

    if (!isDownloading && progress === 0 && !error && statusText === 'Preparing Download...') {
        return null;
    }

    const isComplete = progress === 100 && !error;
    const isError = !!error;

    return (
        <div className="fixed bottom-24 right-6 z-[200] w-[350px] max-w-[calc(100vw-3rem)] pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-500">
            <div className="bg-white rounded-xl p-5 shadow-2xl border border-gray-200 transition-all duration-300 pointer-events-auto hover:shadow-3xl hover:-translate-y-1">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {isComplete && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        {isError && <XCircle className="w-5 h-5 text-red-600" />}
                        {!isComplete && !isError && (
                            <Loader2 className={`w-5 h-5 animate-spin ${userType}-text`} />
                        )}
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-gray-900 select-none truncate">
                                {statusText}
                            </h3>
                            {!isError && (
                                <p className="text-[10px] text-orange-600 font-medium whitespace-nowrap">
                                    Please do not close the window.
                                </p>
                            )}
                        </div>
                    </div>
                    {(isComplete || isError) && (
                        <button
                            onClick={closeProgress}
                            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                </div>

                {!isError && (
                    <div className="mb-1">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ease-out ${isComplete ? 'bg-green-500' : `${userType}-bg`}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="text-right mt-1">
                            <span className={`text-xs font-semibold ${isComplete ? 'text-green-600' : `${userType}-text`}`}>
                                {progress}%
                            </span>
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="mt-2 text-xs text-red-600 font-medium break-words">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
