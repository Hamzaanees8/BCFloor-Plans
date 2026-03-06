"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GetMediaJobs, RetryMediaJob, MediaJob } from "@/app/dashboard/global-settings/global-settings";
import { toast } from "sonner";
import { DateTime } from "luxon";
import { Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const MediaJobsTable = ({ userType }: { userType: string }) => {
    const [data, setData] = useState<MediaJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryingUuids, setRetryingUuids] = useState<Set<string>>(new Set());
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchJobs = useCallback(async (isAutoPoll = false) => {
        if (!isAutoPoll) setLoading(true);
        try {
            const response = await GetMediaJobs();
            // Always treat a successful API response as non-error.
            // Empty arrays will show the "no data" empty state via DataTable.
            setData(Array.isArray(response.data) ? response.data : []);
            setError(false);
        } catch (err) {
            // Only show "failed to fetch" on real network/server errors.
            console.error("Error fetching media jobs:", err);
            setError(true);
        } finally {
            if (!isAutoPoll) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [fetchJobs]);

    const hasProcessingJobs = data.some((job) => job.status === "processing");

    useEffect(() => {
        if (hasProcessingJobs) {
            if (!pollIntervalRef.current) {
                pollIntervalRef.current = setInterval(() => {
                    fetchJobs(true);
                }, 10000);
            }
        } else {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        }
    }, [hasProcessingJobs, fetchJobs]);

    const handleRetry = async (job: MediaJob) => {
        setRetryingUuids((prev) => new Set(prev).add(job.uuid));
        try {
            const response = await RetryMediaJob({ uuid: job.uuid, type: job.type });
            if (response.status) {
                toast.success(response.message || "Job retry triggered successfully");
                fetchJobs(true);
            } else {
                toast.error(response.message || "Failed to retry job");
            }
        } catch {
            toast.error("An error occurred while retrying the job");
        } finally {
            setRetryingUuids((prev) => {
                const next = new Set(prev);
                next.delete(job.uuid);
                return next;
            });
        }
    };

    const typeLabels: Record<string, string> = {
        "tour-file": "Tour Photo",
        "vendor-portfolio": "Portfolio Image",
        "feature-sheet": "Feature Sheet",
    };

    const columns: ColumnDef<MediaJob>[] = [
        {
            id: "preview",
            header: "PREVIEW",
            cell: ({ row }) => (
                <div className="relative w-10 h-10 overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                    {row.original.thumbnail ? (
                        <Image
                            src={row.original.thumbnail}
                            alt={row.original.filename}
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            ),
        },
        {
            accessorKey: "created_at",
            header: "TIMESTAMP",
            cell: ({ row }) => (
                <div className="text-[#666666]">
                    {DateTime.fromISO(row.original.created_at).toFormat("MMM d, h:mm a")}
                </div>
            ),
        },
        {
            accessorKey: "type",
            header: "TYPE",
            cell: ({ row }) => (
                <Badge variant="outline" className="font-normal border-[#BBBBBB] text-[#666666]">
                    {typeLabels[row.original.type] || row.original.type}
                </Badge>
            ),
        },
        {
            accessorKey: "context",
            header: "CONTEXT",
            cell: ({ row }) => (
                <div className="text-[#666666] max-w-[200px] truncate" title={row.original.context}>
                    {row.original.context}
                </div>
            ),
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => {
                const isProcessing = row.original.status === "processing";
                const isFailed = row.original.status === "failed";

                return (
                    <div className="flex items-center gap-2">
                        {isProcessing ? (
                            <Badge className="bg-blue-500 hover:bg-blue-600 text-white animate-pulse">
                                Processing...
                            </Badge>
                        ) : isFailed ? (
                            <Badge variant="destructive">Failed</Badge>
                        ) : (
                            <Badge className="bg-green-500 hover:bg-green-600 text-white capitalize">
                                {row.original.status}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "ACTIONS",
            cell: ({ row }) => {
                const isFailed = row.original.status === "failed";
                const isRetrying = retryingUuids.has(row.original.uuid);

                return (
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            disabled={!isFailed || isRetrying}
                            onClick={() => handleRetry(row.original)}
                            className={cn(
                                "h-8 px-3 text-xs",
                                userType === "admin" ? "hover:bg-[#4290E9] hover:text-white" : "hover:bg-[#6BAE41] hover:text-white"
                            )}
                        >
                            {isRetrying ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                            Retry
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="w-full">
            <div className="flex justify-end p-4 border-b border-[#BBBBBB] bg-[#E4E4E4]/50">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchJobs()}
                    disabled={loading}
                    className="flex items-center gap-2 h-9"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Refresh
                </Button>
            </div>
            <DataTable
                data={data}
                columns={columns}
                loading={loading}
                error={error}
                dataName="Media Jobs"
                userType={userType}
                emptyMessage="No media processing jobs found."
            />
        </div>
    );
};

export default MediaJobsTable;
