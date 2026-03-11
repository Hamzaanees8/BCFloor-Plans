'use client';

import React, { useMemo } from 'react';
import { useGlobalDownload, DownloadJobState } from '@/context/GlobalDownloadContext';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { Button } from '@/components/ui/button';

export function GlobalDownloadProgressOverlay() {
    const { jobs, closeJob, triggerBrowserDownload } = useGlobalDownload();
    const { userType } = useAppContext();

    const { sortedJobs, activeJobsCount, averageProgress } = useMemo(() => {
        if (jobs.length === 0) {
            return { sortedJobs: [], activeJobsCount: 0, averageProgress: 0 };
        }

        // Calculate average progress of ALL jobs
        const totalProgress = jobs.reduce((sum, job) => sum + job.progress, 0);
        const averageProgress = Math.round(totalProgress / jobs.length);

        // Sort: Active (incomplete/non-error) first, newest first. Then completed/errored, newest first.
        const sortedJobs = [...jobs].sort((a, b) => {
            const aIsActive = a.progress < 100 && !a.error;
            const bIsActive = b.progress < 100 && !b.error;

            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;

            // Both have same active state; sort by newest first (assuming ID contains Date.now() or is sequential, we just reverse order of array since new ones are appended to the end)
            // Because our jobs array naturally appends to the end, higher index = newer.
            const indexA = jobs.indexOf(a);
            const indexB = jobs.indexOf(b);
            return indexB - indexA; // Newest first
        });

        const activeJobsCount = jobs.filter(j => j.progress < 100 && !j.error).length;

        return { sortedJobs, activeJobsCount, averageProgress };
    }, [jobs]);

    if (jobs.length === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-24 right-6 z-[200] w-[400px] max-w-[calc(100vw-3rem)] pointer-events-none flex flex-col gap-4 items-end animate-in fade-in slide-in-from-bottom-5">
            <div className="w-full bg-white rounded-xl shadow-2xl border border-gray-200 pointer-events-auto flex flex-col max-h-[60vh] overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col gap-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800 text-sm">
                            Downloads ({jobs.length})
                        </h2>
                        {activeJobsCount > 0 && (
                            <span className={`text-xs font-semibold ${userType}-text`}>
                                {averageProgress}% Total
                            </span>
                        )}
                    </div>
                    {activeJobsCount > 0 && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full transition-all duration-300 ease-out ${averageProgress === 100 ? 'bg-green-500' : `${userType}-bg`}`}
                                style={{ width: `${averageProgress}%` }}
                            />
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
    const { progress, error, statusText, completedFiles } = job;
    const isComplete = progress === 100 && !error;
    const isError = !!error;

    return (
        <div className={`flex flex-col border ${isComplete ? 'border-green-100 bg-green-50/30' : 'border-gray-100 bg-white'} rounded-lg p-3 shadow-sm relative transition-colors`}>
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
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                        aria-label="Close"
                    >
                        <X className="w-3 h-3 text-gray-400" />
                    </button>
                )}
            </div>

            {!isError && (!isComplete || completedFiles.length === 0) && (
                <div className="mb-1 shrink-0">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="text-orange-600 font-medium whitespace-nowrap">Do not close window.</span>
                        <span className={`font-semibold ${isComplete ? 'text-green-600' : `${userType}-text`}`}>
                            {progress}%
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ease-out ${isComplete ? 'bg-green-500' : `${userType}-bg`}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {isError && (
                <div className="mt-1 text-[11px] text-red-600 font-medium break-words shrink-0">
                    {error}
                </div>
            )}

            {isComplete && completedFiles.length > 0 && (
                <div className="mt-2 space-y-1.5">
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
