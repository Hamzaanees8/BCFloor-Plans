'use client';

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { BulkDownloadFileEntry, BulkDownloadFiles, DownloadJobStatus, PollDownloadJob } from '@/app/dashboard/file-manager/file-manager';

const POLL_INTERVAL_MS = 2000;

interface GlobalDownloadContextType {
    isDownloading: boolean;
    progress: number;
    error: string | null;
    statusText: string;
    startDownload: (files: BulkDownloadFileEntry[]) => Promise<boolean>;
    closeProgress: () => void;
}

const GlobalDownloadContext = createContext<GlobalDownloadContextType | undefined>(undefined);

export function GlobalDownloadProvider({ children }: { children: ReactNode }) {
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [statusText, setStatusText] = useState('Preparing Download...');

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollingRef.current !== null) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            stopPolling();
        };
    }, [stopPolling]);

    const closeProgress = useCallback(() => {
        setIsDownloading(false);
        setProgress(0);
        setError(null);
        setStatusText('Preparing Download...');
        stopPolling();
    }, [stopPolling]);

    const triggerBrowserDownload = useCallback((url: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, []);

    const startDownload = useCallback(
        async (files: BulkDownloadFileEntry[]): Promise<boolean> => {
            if (files.length === 0) return true;

            const token = localStorage.getItem('token') ?? '';

            setIsDownloading(true);
            setProgress(0);
            setError(null);
            setStatusText(`Preparing ZIP...`);

            let jobUuid: string;

            try {
                const result = await BulkDownloadFiles(token, files);
                jobUuid = result.job_uuid;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to start download job';
                setError(msg);
                setStatusText('Download Failed');
                // We keep isDownloading true so the overlay stays open to show the error
                return false;
            }

            // Pseudo-progress animation while waiting for backend
            let pseudoProgress = 0;
            const pseudoTick = setInterval(() => {
                pseudoProgress = Math.min(pseudoProgress + 2, 89);
                setProgress(pseudoProgress);
            }, 400);

            return new Promise<boolean>((resolve) => {
                pollingRef.current = setInterval(async () => {
                    try {
                        const poll = await PollDownloadJob(token, jobUuid);
                        const { status: job_status, percent: serverProgress, download_url } = poll.data;

                        if (typeof serverProgress === 'number') {
                            clearInterval(pseudoTick);
                            setProgress(serverProgress);
                            setStatusText(`Zipping files...`);
                        }

                        const terminal: DownloadJobStatus[] = ['completed', 'failed'];

                        if (terminal.includes(job_status)) {
                            stopPolling();
                            clearInterval(pseudoTick);
                            setProgress(100);

                            if (job_status === 'completed' && download_url) {
                                setStatusText('Download started!');
                                triggerBrowserDownload(download_url);
                                resolve(true);
                            } else {
                                setError(poll.data.message || 'Download job failed. Please try again.');
                                setStatusText('Download Failed');
                                resolve(false);
                            }
                        }
                    } catch (err) {
                        stopPolling();
                        clearInterval(pseudoTick);
                        const msg = err instanceof Error ? err.message : 'Polling error';
                        setError(msg);
                        setStatusText('Download Failed');
                        resolve(false);
                    }
                }, POLL_INTERVAL_MS);
            });
        },
        [stopPolling, triggerBrowserDownload]
    );

    return (
        <GlobalDownloadContext.Provider
            value={{
                isDownloading,
                progress,
                error,
                statusText,
                startDownload,
                closeProgress,
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
