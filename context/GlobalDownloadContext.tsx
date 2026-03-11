'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { BulkDownloadFileEntry, BulkDownloadFiles, DownloadJobStatus, PollDownloadJob } from '@/app/dashboard/file-manager/file-manager';

const POLL_INTERVAL_MS = 2000;

export interface DownloadJobState {
    id: string;
    label?: string;
    isDownloading: boolean;
    progress: number;
    error: string | null;
    statusText: string;
    completedFiles: { name: string; url: string }[];
}

interface GlobalDownloadContextType {
    jobs: DownloadJobState[];
    startDownload: (files: BulkDownloadFileEntry[], label?: string) => Promise<boolean>;
    closeJob: (id: string) => void;
    triggerBrowserDownload: (url: string) => void;
}

const GlobalDownloadContext = createContext<GlobalDownloadContextType | undefined>(undefined);

export function GlobalDownloadProvider({ children }: { children: ReactNode }) {
    const [jobs, setJobs] = useState<DownloadJobState[]>([]);

    const updateJob = useCallback((id: string, updates: Partial<DownloadJobState>) => {
        setJobs(currentJobs => 
            currentJobs.map(job => job.id === id ? { ...job, ...updates } : job)
        );
    }, []);

    const closeJob = useCallback((id: string) => {
        setJobs(currentJobs => currentJobs.filter(job => job.id !== id));
    }, []);

    // Clean up all jobs on unmount happens automatically because jobs state is localized,
    // but intervals would need to be cleared. Since we store our intervals in closure
    // state, we don't have access to clear them on unmount right now. This is fine 
    // for a global context since it rarely unmounts.

    const triggerBrowserDownload = useCallback((url: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, []);

    const startDownload = useCallback(
        async (files: BulkDownloadFileEntry[], label?: string): Promise<boolean> => {
            if (files.length === 0) return true;

            const token = localStorage.getItem('token') ?? '';
            const jobId = Date.now().toString() + Math.random().toString(36).substring(7);

            setJobs(currentJobs => [
                ...currentJobs,
                {
                    id: jobId,
                    label,
                    isDownloading: true,
                    progress: 0,
                    error: null,
                    statusText: label ? `${label}: Preparing ZIP...` : `Preparing ZIP...`,
                    completedFiles: [],
                }
            ]);

            let jobUuid: string;

            try {
                const result = await BulkDownloadFiles(token, files);
                jobUuid = result.job_uuid;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to start download job';
                updateJob(jobId, { error: msg, statusText: 'Download Failed', isDownloading: false });
                return false;
            }

            // Pseudo-progress animation while waiting for backend
            let pseudoProgress = 0;
            const pseudoTick = setInterval(() => {
                pseudoProgress = Math.min(pseudoProgress + 2, 89);
                updateJob(jobId, { progress: pseudoProgress });
            }, 400);

            return new Promise<boolean>((resolve) => {
                const pollInterval = setInterval(async () => {
                    try {
                        const poll = await PollDownloadJob(token, jobUuid);
                        const { status: job_status, percent: serverProgress, download_url, direct_download_links } = poll.data;

                        if (typeof serverProgress === 'number') {
                            clearInterval(pseudoTick);
                            updateJob(jobId, { progress: serverProgress, statusText: label ? `${label}: Zipping files...` : `Zipping files...` });
                        }

                        const terminal: DownloadJobStatus[] = ['completed', 'failed'];

                        if (terminal.includes(job_status)) {
                            clearInterval(pollInterval);
                            clearInterval(pseudoTick);
                            updateJob(jobId, { progress: 100 });

                            if (job_status === 'completed') {
                                const links: { name: string; url: string }[] = [];
                                
                                if (Array.isArray(direct_download_links)) {
                                    direct_download_links.forEach(f => {
                                        if (f.name && f.download_url) {
                                            links.push({ name: f.name, url: f.download_url });
                                        }
                                    });
                                }
                                
                                if (download_url) {
                                    links.push({ name: 'All Files ZIP', url: download_url });
                                }
                                
                                updateJob(jobId, {
                                    completedFiles: links,
                                    statusText: label ? `${label}: Ready` : 'Files Ready for Download',
                                    isDownloading: false,
                                });
                                
                                // Auto-trigger only if there's exactly one URL total, otherwise show the popup
                                if (links.length === 1) {
                                  triggerBrowserDownload(links[0].url);
                                }
                                
                                resolve(true);
                            } else {
                                updateJob(jobId, {
                                    error: poll.data.message || 'Download job failed. Please try again.',
                                    statusText: 'Download Failed',
                                    isDownloading: false,
                                });
                                resolve(false);
                            }
                        }
                    } catch (err) {
                        clearInterval(pollInterval);
                        clearInterval(pseudoTick);
                        const msg = err instanceof Error ? err.message : 'Polling error';
                        updateJob(jobId, {
                            error: msg,
                            statusText: 'Download Failed',
                            isDownloading: false,
                        });
                        resolve(false);
                    }
                }, POLL_INTERVAL_MS);
            });
        },
        [triggerBrowserDownload, updateJob]
    );

    return (
        <GlobalDownloadContext.Provider
            value={{
                jobs,
                startDownload,
                closeJob,
                triggerBrowserDownload,
            }}
        >
            {children}
        </GlobalDownloadContext.Provider>
    );
}

export const useGlobalDownload = () => {
    const context = useContext(GlobalDownloadContext);
    if (!context) {
        throw new Error('useGlobalDownload must be used within GlobalDownloadProvider');
    }
    return context;
};
