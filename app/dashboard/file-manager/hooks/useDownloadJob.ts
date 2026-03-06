'use client';

import { useCallback, useRef, useState } from 'react';
import {
    BulkDownloadFileEntry,
    BulkDownloadFiles,
    DownloadJobStatus,
    PollDownloadJob,
} from '../file-manager';

const POLL_INTERVAL_MS = 2000;

export interface UseDownloadJobReturn {
    /** True while a job is inflight (pending, processing). */
    isLoading: boolean;
    /** 0–100. Driven by backend `progress` field when available, else animates pseudo-progress. */
    progress: number;
    /** Error message string if the job failed, otherwise null. */
    error: string | null;
    /** Call this to start a bulk-download job for the given files. Returns true on success. */
    triggerDownload: (files: BulkDownloadFileEntry[]) => Promise<boolean>;
}

/**
 * Shared hook for job-based bulk downloads.
 *
 * Usage:
 *   const { isLoading, progress, error, triggerDownload } = useDownloadJob();
 *   const success = await triggerDownload([{ uuid: 'abc', size: 'large' }, ...]);
 */
export function useDownloadJob(): UseDownloadJobReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // Keep a ref to the interval so we can clear it from anywhere.
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollingRef.current !== null) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const triggerBrowserDownload = useCallback((url: string) => {
        const a = document.createElement('a');
        a.href = url;
        // The server sets Content-Disposition so the browser picks the filename.
        a.download = '';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, []);

    const triggerDownload = useCallback(
        async (files: BulkDownloadFileEntry[]): Promise<boolean> => {
            if (files.length === 0) return true;

            const token = localStorage.getItem('token') ?? '';

            setIsLoading(true);
            setProgress(0);
            setError(null);

            let jobUuid: string;

            try {
                const result = await BulkDownloadFiles(token, files);
                jobUuid = result.job_uuid;
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to start download job';
                setError(msg);
                setIsLoading(false);
                return false;
            }

            // Pseudo-progress animation while we wait (increments up to 89 %).
            // Reset once backend confirms progress or job completes.
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

                        // Use server progress when available.
                        if (typeof serverProgress === 'number') {
                            clearInterval(pseudoTick);
                            setProgress(serverProgress);
                        }

                        const terminal: DownloadJobStatus[] = ['completed', 'failed'];

                        if (terminal.includes(job_status)) {
                            stopPolling();
                            clearInterval(pseudoTick);
                            setProgress(100);
                            setIsLoading(false);

                            if (job_status === 'completed' && download_url) {
                                triggerBrowserDownload(download_url);
                                resolve(true);
                            } else {
                                setError(poll.data.message || 'Download job failed. Please try again.');
                                resolve(false);
                            }
                        }
                    } catch (err) {
                        stopPolling();
                        clearInterval(pseudoTick);
                        const msg = err instanceof Error ? err.message : 'Polling error';
                        setError(msg);
                        setIsLoading(false);
                        resolve(false);
                    }
                }, POLL_INTERVAL_MS);
            });
        },
        [stopPolling, triggerBrowserDownload],
    );

    return { isLoading, progress, error, triggerDownload };
}
