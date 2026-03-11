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
    isLoading: boolean;
    progress: number;
    error: string | null;
    jobFiles: { name: string; url: string }[]; // files ready for manual download
    triggerDownload: (files: BulkDownloadFileEntry[]) => Promise<boolean>;
}

export function useDownloadJob(): UseDownloadJobReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [jobFiles, setJobFiles] = useState<{ name: string; url: string }[]>([]);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    }, []);

    const triggerDownload = useCallback(
        async (files: BulkDownloadFileEntry[]): Promise<boolean> => {
            if (!files.length) return true;

            const token = localStorage.getItem('token') ?? '';

            setIsLoading(true);
            setProgress(0);
            setError(null);
            setJobFiles([]);

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

            let pseudoProgress = 0;
            const pseudoTick = setInterval(() => {
                pseudoProgress = Math.min(pseudoProgress + 2, 89);
                setProgress(pseudoProgress);
            }, 400);

            return new Promise<boolean>((resolve) => {
                pollingRef.current = setInterval(async () => {
                    try {
                        const poll = await PollDownloadJob(token, jobUuid);
                        const job = poll.data;

                        const { status, percent, download_url, direct_download_links } = job;

                        if (typeof percent === 'number') {
                            clearInterval(pseudoTick);
                            setProgress(percent);
                        }

                        const terminal: DownloadJobStatus[] = ['completed', 'failed'];

                        if (terminal.includes(status)) {
                            stopPolling();
                            clearInterval(pseudoTick);
                            setProgress(100);
                            setIsLoading(false);

                            if (status === 'completed') {
                                const filesToDownload: { name: string; url: string }[] = [];

                                if (Array.isArray(direct_download_links)) {
                                    direct_download_links.forEach((f: { name?: string; download_url?: string }) => {
                                        if (f?.download_url) {
                                            filesToDownload.push({ name: f.name || 'Unnamed File', url: f.download_url });
                                        }
                                    });
                                }

                                if (download_url) {
                                    filesToDownload.push({ name: 'All Files ZIP', url: download_url });
                                }

                                setJobFiles(filesToDownload);

                                if (filesToDownload.length === 0) {
                                    setError('Download completed but no files found.');
                                    resolve(false);
                                    return;
                                }

                                // Download files sequentially with a delay to avoid browser blocking
                                for (const file of filesToDownload) {
                                    console.log(`Downloading: ${file.name}`);
                                    const link = document.createElement('a');
                                    link.href = file.url;
                                    link.download = file.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    
                                    // Wait 1.5 seconds between downloads
                                    await new Promise(res => setTimeout(res, 1500));
                                }
                                resolve(true);
                            } else {
                                setError('Download job failed.');
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
        [stopPolling],
    );

    return { isLoading, progress, error, jobFiles, triggerDownload };
}
