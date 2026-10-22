'use client';

import React, { useMemo } from 'react';
import { useGlobalDownload, DownloadJobState } from '@/context/GlobalDownloadContext';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/components/ui/button';

export function GlobalDownloadProgressOverlay() {
    const { jobs, closeJob, triggerBrowserDownload } = useGlobalDownload();
    const { userType } = useAppContext();

    const { sortedJobs, activeJobsCount, averageProgress, isAnyZipping } = useMemo(() => {
        if (jobs.length === 0) {
            return { sortedJobs: [], activeJobsCount: 0, averageProgress: 0, isAnyZipping: false };
        }

        // Active jobs: not completed and no error
        const activeJobs = jobs.filter(j => j.status !== 'completed' && !j.error && j.status !== 'failed');
        const activeJobsCount = activeJobs.length;
        const isAnyZipping = activeJobs.some(
            j => j.status === 'zipping' || (j.progress >= 100 && j.completedFiles.length === 0)
        );

        // Calculate average progress of ALL jobs
        // While a job is active/zipping, cap its progress at 99% so the overall bar does not show 100% prematurely
        const totalProgress = jobs.reduce((sum, job) => {
            if (job.status === 'completed') return sum + 100;
            if (job.status === 'zipping' || (job.progress >= 100 && job.completedFiles.length === 0)) {
                return sum + 99;
            }
            return sum + (job.progress || 0);
        }, 0);
        const averageProgress = activeJobsCount > 0 
            ? Math.min(99, Math.round(totalProgress / jobs.length))
            : Math.round(totalProgress / jobs.length);

        // Sort: Active first, newest first. Then completed/errored, newest first.
        const sortedJobs = [...jobs].sort((a, b) => {
            const aIsActive = a.status !== 'completed' && !a.error && a.status !== 'failed';
            const bIsActive = b.status !== 'completed' && !b.error && b.status !== 'failed';

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;

            const indexA = jobs.indexOf(a);
            const indexB = jobs.indexOf(b);
            return indexB - indexA; // Newest first
        });

        return { sortedJobs, activeJobsCount, averageProgress, isAnyZipping };
    }, [jobs]);

    const closeAllFinished = () => {
        jobs.forEach(job => {
            if (job.status === 'completed' || job.error || job.status === 'failed') {
                closeJob(job.id);
            }
        });
    };

    if (jobs.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-24 right-6 z-[200] w-[420px] max-w-[calc(100vw-3rem)] pointer-events-none flex flex-col gap-4 items-end animate-in fade-in slide-in-from-bottom-5">
            <div className="w-full bg-white rounded-xl shadow-2xl border border-gray-200 pointer-events-auto flex flex-col max-h-[60vh] overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <h2 className="font-semibold text-gray-800 text-sm">
                                Downloads ({jobs.length})
                            </h2>
                            {activeJobsCount > 0 ? (
                                <span className={`text-[10px] font-semibold ${userType}-text animate-pulse uppercase tracking-wider`}>
                                    {isAnyZipping ? 'Zipping files...' : 'Processing files...'}
                                </span>
                            ) : (
                                <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">
                                    All Ready
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {activeJobsCount > 0 && (
                                <span className={`text-xs font-bold ${userType}-text tabular-nums`}>
                                    {isAnyZipping ? 'Zipping...' : `${averageProgress}%`}
                                </span>
                            )}
                            <button
                                onClick={closeAllFinished}
                                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                                title="Clear finished downloads"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Main Info Message at top above the main loader */}
                    {activeJobsCount > 0 && (
                        <div className={`p-2.5 rounded-lg border text-[11px] leading-snug transition-colors ${
                            isAnyZipping 
                                ? 'bg-amber-50/80 border-amber-200/80 text-amber-900' 
                                : 'bg-blue-50/70 border-blue-100 text-gray-700'
                        }`}>
                            {isAnyZipping ? (
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-amber-800 text-[11px]">
                                        <span className="relative flex h-2 w-2 shrink-0">
                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${userType}-bg opacity-75`} />
                                            <span className={`relative inline-flex rounded-full h-2 w-2 ${userType}-bg`} />
                                        </span>
                                        <span>Zipping files in progress...</span>
                                    </div>
                                    <p className="text-[10.5px] text-amber-900/80">
                                        Files processed successfully. Compressing and creating your ZIP archive now. This may take a moment.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-1.5 font-semibold text-gray-800 text-[11px]">
                                        <Loader2 className={`w-3 h-3 animate-spin ${userType}-text shrink-0`} />
                                        <span>Preparing your download...</span>
                                    </div>
                                    <p className="text-[10.5px] text-gray-500">
                                        This may take a few moments depending on file size and quantity. Please do not close this window.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeJobsCount > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden relative">
                            {isAnyZipping ? (
                                <div className="relative w-full h-full overflow-hidden">
                                    <div className={`absolute inset-0 ${userType}-bg opacity-40`} />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer-wave" />
                                </div>
                            ) : (
                                <div
                                    className={`h-full transition-all duration-300 ease-out ${userType}-bg`}
                                    style={{ width: `${averageProgress}%` }}
                                />
                            )}
                        </div>
                    )}
                </div>
                <div className="overflow-y-auto sidebar-scroll p-4 flex flex-col gap-3">
                    {sortedJobs.map(job => (
                        <DownloadJobItem
                            key={job.id}
                            job={job}
                            userType={userType}
                            onClose={() => closeJob(job.id)}
                            onDownload={(url) => triggerBrowserDownload(url)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function DownloadJobItem({
    job,
    userType,
    onClose,
    onDownload
}: {
    job: DownloadJobState;
    userType: string;
    onClose: () => void;
    onDownload: (url: string) => void;
}) {
    const { progress, error, statusText, completedFiles, status } = job;
    const isError = Boolean(error || status === 'failed');
    const isComplete = !isError && (status === 'completed' || (completedFiles.length > 0 && progress === 100));
    const isZipping = !isError && !isComplete && (status === 'zipping' || (progress >= 100 && completedFiles.length === 0));
    const isProcessing = !isError && !isComplete && !isZipping;

    return (
        <div className={`flex flex-col border ${
            isComplete 
                ? 'border-green-100 bg-green-50/30' 
                : isZipping 
                    ? 'border-amber-100/80 bg-amber-50/20' 
                    : 'border-gray-100 bg-white'
        } rounded-lg p-3 shadow-sm relative transition-colors`}>
            <div className="flex items-center justify-between mb-2 shrink-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    {isComplete && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />}
                    {isError && <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                    {!isComplete && !isError && (
                        <Loader2 className={`w-4 h-4 animate-spin ${userType}-text shrink-0`} />
                    )}
                    <h3 className="text-xs font-bold text-gray-900 select-none truncate" title={statusText}>
                        {statusText}
                    </h3>
                </div>
                {(isComplete || isError) && (
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors shrink-0 text-gray-400 hover:text-gray-600"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* 1. Processing files state (percentage loader) */}
            {isProcessing && (
                <div className="mb-1 shrink-0 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-orange-600 font-medium whitespace-nowrap">Do not close window.</span>
                        <span className={`font-semibold ${userType}-text tabular-nums`}>
                            {progress}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ease-out ${userType}-bg`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* 2. Zipping files state (animated color skeleton loader) */}
            {isZipping && (
                <div className="mb-1 shrink-0">
                    {/* Color Skeleton Loader - Shows fluid movement without percentage */}
                    <div className="space-y-2 bg-gray-50/80 border border-gray-100 rounded-lg p-2.5">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-orange-600 font-medium whitespace-nowrap">Do not close window.</span>
                            <span className={`font-semibold ${userType}-text text-[10.5px] uppercase tracking-wider animate-pulse flex items-center gap-1`}>
                                <span className="inline-block w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="inline-block w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="inline-block w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                                Zipping...
                            </span>
                        </div>

                        {/* Animated colored skeleton bar */}
                        <div className="relative w-full h-2 rounded-full overflow-hidden bg-gray-200">
                            <div className={`absolute inset-0 ${userType}-bg opacity-30`} />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer-wave" />
                        </div>

                        {/* Skeleton lines movement */}
                        <div className="space-y-1.5 pt-0.5">
                            <div className="relative h-2 w-4/5 rounded bg-gray-200 overflow-hidden">
                                <div className={`absolute inset-0 ${userType}-bg opacity-20`} />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer-wave" />
                            </div>
                            <div className="relative h-2 w-3/5 rounded bg-gray-200 overflow-hidden">
                                <div className={`absolute inset-0 ${userType}-bg opacity-15`} />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent animate-shimmer-wave" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Error state */}
            {isError && (
                <div className="mt-1 text-[11px] text-red-600 font-medium break-words shrink-0 bg-red-50 p-2 rounded border border-red-100">
                    {error || 'Download job failed. Please try again.'}
                </div>
            )}

            {/* 4. Complete state (Ready for download) */}
            {isComplete && completedFiles.length > 0 && (
                <div className="mt-2 space-y-2">
                    <p className="text-[11px] text-gray-500 leading-relaxed bg-white/70 p-2 rounded border border-gray-100">
                        The download will start automatically in a few seconds. If it doesn&apos;t start, click <span className="font-semibold text-gray-700">Download</span> below to start it manually.
                    </p>
                    {completedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100 hover:border-gray-200 transition-colors gap-2">
                            <div className="flex flex-col min-w-0 flex-1">
                                <p className="text-[#424242] text-xs font-semibold truncate" title={file.name}>
                                    {file.name}
                                </p>
                            </div>
                            <Button
                                onClick={() => onDownload(file.url)}
                                className={`shrink-0 ${userType}-bg text-white hover:opacity-80 rounded text-[10px] h-6 px-2.5 shadow-sm transition-all`}
                            >
                                Download
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

