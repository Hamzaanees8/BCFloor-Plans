"use client";
import React, { useState, useEffect, useCallback } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { RefreshCcw, Eye, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { GetQbSyncLogs, QbSyncLog, RetryQbSyncLog } from "@/app/dashboard/global-settings/qb-sync-logs";
import { DateTime } from "luxon";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const QbSyncLogsSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [logs, setLogs] = useState<QbSyncLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedLog, setSelectedLog] = useState<QbSyncLog | null>(null);
    const [openDetails, setOpenDetails] = useState(false);
    const [retrying, setRetrying] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await GetQbSyncLogs({ status: statusFilter === "all" ? undefined : statusFilter });
            if (res.success && res.data) {
                setLogs(res.data);
            } else {
                setLogs([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load QB sync logs");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleRetry = async (uuid: string) => {
        setRetrying(uuid);
        try {
            const res = await RetryQbSyncLog(uuid);
            if (res.success) {
                toast.success("Retry initiated successfully");
                fetchLogs();
            } else {
                toast.error(res.message || "Failed to retry sync");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error occurred while retrying");
        } finally {
            setRetrying(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'success':
                return <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">SUCCESS</Badge>;
            case 'failed':
                return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none">FAILED</Badge>;
            case 'pending':
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-none">PENDING</Badge>;
            default:
                return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-none">{status?.toUpperCase() || 'N/A'}</Badge>;
        }
    };

    const formatEntityType = (type: string) => {
        if (!type) return "N/A";
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };

    const columns: ColumnDef<QbSyncLog>[] = [
        {
            accessorKey: "created_at",
            header: "DATE/TIME",
            cell: ({ row }) => {
                const dateStr = row.getValue("created_at") as string;
                return (
                    <div className="text-[#666666]">
                        {dateStr ? DateTime.fromISO(dateStr).toFormat("LLL dd, yyyy HH:mm") : "N/A"}
                    </div>
                );
            },
        },
        {
            accessorKey: "entity_type",
            header: "ENTITY TYPE",
            cell: ({ row }) => <div className="text-[#666666] font-medium">{formatEntityType(row.getValue("entity_type") as string)}</div>,
        },
        {
            accessorKey: "entity_id",
            header: "ENTITY ID",
            cell: ({ row }) => <div className="text-[#666666]">{row.getValue("entity_id") || "N/A"}</div>,
        },
        {
            accessorKey: "action",
            header: "ACTION",
            cell: ({ row }) => <div className="text-[#666666]">{row.getValue("action") || "N/A"}</div>,
        },
        {
            accessorKey: "qb_doc_number",
            header: "QB DOC#",
            cell: ({ row }) => <div className="text-[#666666]">{row.getValue("qb_doc_number") || "N/A"}</div>,
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => getStatusBadge(row.getValue("status") as string),
        },
        {
            accessorKey: "attempts",
            header: "ATTEMPTS",
            cell: ({ row }) => <div className="text-[#666666] text-center">{row.getValue("attempts") || 0}</div>,
        },
        {
            accessorKey: "error_message",
            header: "ERROR",
            cell: ({ row }) => {
                const errorMsg = row.getValue("error_message") as string;
                return <div className="text-[#666666] truncate max-w-[150px]" title={errorMsg}>{errorMsg || "None"}</div>;
            },
        },
        {
            id: "actions",
            header: "ACTIONS",
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-1 text-[#4290E9] hover:text-[#4290E9] hover:bg-blue-50 px-2"
                            onClick={() => {
                                setSelectedLog(log);
                                setOpenDetails(true);
                            }}
                        >
                            <Eye className="w-4 h-4" />
                            View
                        </Button>
                        {log.status === 'failed' && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-orange-500 hover:text-orange-600 hover:bg-orange-50 px-2"
                                onClick={() => handleRetry(log.uuid)}
                                disabled={retrying === log.uuid}
                            >
                                <RotateCcw className={`w-4 h-4 ${retrying === log.uuid ? 'animate-spin' : ''}`} />
                                Retry
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <div className="w-full flex-col flex rounded-lg">
            <div className="flex items-center justify-between w-full pb-4 px-4 py-4" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)` }}>
                <div className="flex items-center gap-4">
                    <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"}`}>QB SYNC LOGS</p>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px] bg-white border-none h-8 text-[#555]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div
                    onClick={fetchLogs}
                    className="flex items-center gap-x-[10px] cursor-pointer group"
                >
                    <p className={`text-base font-semibold font-raleway ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"}`}>Refresh</p>
                    <RefreshCcw className={`w-[18px] h-[18px] ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"} group-hover:rotate-180 transition-transform duration-500`} />
                </div>
            </div>
            <div className="w-full mt-4">
                <DataTable
                    data={logs}
                    columns={columns}
                    loading={loading}
                    error={false}
                    dataName="QB Sync Logs"
                    userType={userType}
                />
            </div>

            <Dialog open={openDetails} onOpenChange={setOpenDetails}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Sync Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="flex flex-col gap-4 mt-4 text-black">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-semibold text-gray-500">Entity Type:</div>
                                <div>{formatEntityType(selectedLog.entity_type)}</div>
                                
                                <div className="font-semibold text-gray-500">Entity ID:</div>
                                <div className="break-all">{selectedLog.entity_id || "N/A"}</div>
                                
                                <div className="font-semibold text-gray-500">Action:</div>
                                <div>{selectedLog.action || "N/A"}</div>
                                
                                <div className="font-semibold text-gray-500">Status:</div>
                                <div>{getStatusBadge(selectedLog.status)}</div>
                                
                                <div className="font-semibold text-gray-500">Attempts:</div>
                                <div>{selectedLog.attempts || 0}</div>
                                
                                <div className="font-semibold text-gray-500">Date/Time:</div>
                                <div>{selectedLog.created_at ? DateTime.fromISO(selectedLog.created_at).toFormat("LLL dd, yyyy HH:mm") : "N/A"}</div>
                            </div>
                            
                            {selectedLog.error_message && (
                                <div className="flex flex-col gap-1 mt-2">
                                    <div className="font-semibold text-sm text-gray-500">Error Message:</div>
                                    <div className="text-sm bg-red-50 text-red-600 p-3 rounded border border-red-100 max-h-[150px] overflow-y-auto whitespace-pre-wrap break-words">
                                        {selectedLog.error_message}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QbSyncLogsSettings;
