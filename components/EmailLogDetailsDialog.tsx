"use client";
import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { GetEmailLog, EmailLogDetail } from "@/app/dashboard/global-settings/email-logs";
import { DateTime } from "luxon";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailLogDetailsDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    logId: string | null;
}

const EmailLogDetailsDialog = ({ open, setOpen, logId }: EmailLogDetailsDialogProps) => {
    const [log, setLog] = useState<EmailLogDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && logId) {
            setLoading(true);
            GetEmailLog(logId)
                .then((res) => {
                    if (res.success) {
                        setLog(res.data);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setLog(null);
        }
    }, [open, logId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'bg-green-500 hover:bg-green-600';
            case 'sent': return 'bg-blue-500 hover:bg-blue-600';
            case 'bounced':
            case 'complained': return 'bg-red-500 hover:bg-red-600';
            default: return 'bg-gray-500 hover:bg-gray-600';
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col font-alexandria">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold uppercase text-[#4290E9]">
                        Email Log Details
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 pr-4 overflow-y-auto max-h-[70vh]">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-4 w-[300px]" />
                            <Skeleton className="h-[200px] w-full" />
                        </div>
                    ) : log ? (
                        <div className="space-y-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Subject</p>
                                    <p className="text-base font-medium">{log.subject}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                                    <Badge className={getStatusColor(log.status)}>
                                        {log.status?.toUpperCase() || 'N/A'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">From</p>
                                    <p className="text-sm">{log.from}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">To</p>
                                    <p className="text-sm">{Array.isArray(log.to) ? log.to.join(', ') : log.to}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Sent At</p>
                                    <p className="text-sm">
                                        {DateTime.fromISO(log.created_at).toLocaleString(DateTime.DATETIME_MED)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase">Last Event</p>
                                    <p className="text-sm capitalize">{log.last_event?.replace('_', ' ') || log.status}</p>
                                </div>
                            </div>

                            {(log.html || log.text) && (
                                <div className="mt-6">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Content Preview</p>
                                    <div className="border rounded-md p-4 bg-gray-50 max-h-[400px] overflow-auto">
                                        {log.html ? (
                                            <div dangerouslySetInnerHTML={{ __html: log.html }} />
                                        ) : (
                                            <pre className="whitespace-pre-wrap text-sm">{log.text}</pre>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Failed to load email log details.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default EmailLogDetailsDialog;
