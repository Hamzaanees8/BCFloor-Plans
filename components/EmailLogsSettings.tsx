import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { RefreshCcw, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { GetEmailLogs, EmailLog } from "@/app/dashboard/global-settings/email-logs";
import { DateTime } from "luxon";
import { Badge } from "@/components/ui/badge";
import EmailLogDetailsDialog from "./EmailLogDetailsDialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const EmailLogsSettings = () => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const [logs, setLogs] = useState<EmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [openDetails, setOpenDetails] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await GetEmailLogs();
            if (res.success && res.data) {
                setLogs(res.data);
            } else {
                setLogs([]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load email logs");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const filteredLogs = useMemo(() => {
        if (!searchQuery.trim()) return logs;
        const q = searchQuery.toLowerCase().trim();
        return logs.filter((log) => {
            const subject = (log.subject || "").toLowerCase();
            const to = (Array.isArray(log.to) ? log.to.join(", ") : (log.to || "")).toLowerCase();
            const from = (log.from || "").toLowerCase();
            const status = (log.status || "").toLowerCase();
            return subject.includes(q) || to.includes(q) || from.includes(q) || status.includes(q);
        });
    }, [logs, searchQuery]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'delivered':
                return <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">DELIVERED</Badge>;
            case 'sent':
                return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none">SENT</Badge>;
            case 'bounced':
            case 'complained':
                return <Badge className="bg-red-500 hover:bg-red-600 text-white border-none">{status?.toUpperCase() || 'N/A'}</Badge>;
            case 'delivery_delayed':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-none">DELAYED</Badge>;
            default:
                return <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-none">{status?.toUpperCase() || 'N/A'}</Badge>;
        }
    };

    const columns: ColumnDef<EmailLog>[] = [
        {
            accessorKey: "created_at",
            header: "DATE/TIME",
            cell: ({ row }) => {
                const dateStr = row.getValue("created_at") as string;
                return (
                    <div className="text-[#666666]">
                        {DateTime.fromISO(dateStr).toFormat("LLL dd, yyyy HH:mm")}
                    </div>
                );
            },
        },
        {
            accessorKey: "subject",
            header: "SUBJECT",
            cell: ({ row }) => <div className="text-[#666666] font-medium">{row.getValue("subject")}</div>,
        },
        {
            accessorKey: "to",
            header: "RECIPIENT",
            cell: ({ row }) => {
                const to = row.getValue("to");
                const displayText = Array.isArray(to) ? to.join(', ') : (to as string);
                return <div className="text-[#666666] truncate max-w-[200px]" title={displayText}>{displayText}</div>;
            },
        },
        {
            accessorKey: "status",
            header: "STATUS",
            cell: ({ row }) => getStatusBadge(row.getValue("status") as string),
        },
        {
            id: "actions",
            header: "ACTIONS",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 text-[#4290E9] hover:text-[#4290E9] hover:bg-blue-50"
                    onClick={() => {
                        setSelectedLogId(row.original.id);
                        setOpenDetails(true);
                    }}
                >
                    <Eye className="w-4 h-4" />
                    View Details
                </Button>
            ),
        },
    ];

    return (
        <div className="w-full flex-col flex rounded-lg">
            <div className="flex items-center justify-between w-full pb-4 px-4 py-4" style={{ backgroundColor: `color-mix(in srgb, ${roleSettings.pageBg}, black 10%)` }}>
                <p className={`text-[18px] font-semibold uppercase ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"}`}>EMAIL LOGS</p>
                <div
                    onClick={fetchLogs}
                    className="flex items-center gap-x-[10px] cursor-pointer group"
                >
                    <p className={`text-base font-semibold font-raleway ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"}`}>Refresh</p>
                    <RefreshCcw className={`w-[18px] h-[18px] ${userType === "admin" ? "text-[#4290E9]" : "text-[#6BAE41]"} group-hover:rotate-180 transition-transform duration-500`} />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full mt-4 px-1">
                <div className="relative w-full sm:w-[360px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search logs by recipient, subject, or status..."
                        className="pl-9 h-[40px] bg-white border border-[#BBBBBB] text-sm"
                    />
                </div>
                {searchQuery && (
                    <p className="text-xs text-gray-500">
                        Found {filteredLogs.length} matching log{filteredLogs.length === 1 ? '' : 's'}
                    </p>
                )}
            </div>

            <div className="w-full mt-3">
                <DataTable
                    data={filteredLogs}
                    columns={columns}
                    loading={loading}
                    error={false}
                    dataName="Email Logs"
                    userType={userType}
                    autoResetPageIndex={false}
                />
            </div>

            <EmailLogDetailsDialog
                open={openDetails}
                setOpen={setOpenDetails}
                logId={selectedLogId}
            />
        </div>
    );
};

export default EmailLogsSettings;
