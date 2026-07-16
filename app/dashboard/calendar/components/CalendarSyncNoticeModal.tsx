'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { UnsyncedOrder, ManualSyncCalendar } from '../calendar';
import { toast } from 'sonner';
import { useAppContext } from '@/app/context/AppContext';

interface CalendarSyncNoticeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    unsyncedOrders: UnsyncedOrder[];
    onSynced: () => void;
}

export const CalendarSyncNoticeModal: React.FC<CalendarSyncNoticeModalProps> = ({
    open,
    onOpenChange,
    unsyncedOrders,
    onSynced,
}) => {
    const { userType } = useAppContext();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (!unsyncedOrders || unsyncedOrders.length === 0) return;

        setIsSyncing(true);
        try {
            const orderIds = unsyncedOrders.map((item) => item.order_id);
            const res = await ManualSyncCalendar(orderIds);
            if (res.success) {
                toast.success(res.message || `${orderIds.length} booking(s) submitted for Google Calendar sync.`);
                onSynced();
                onOpenChange(false);
            } else {
                toast.error(res.message || "Failed to sync calendar events.");
            }
        } catch (error: any) {
            console.error("Manual calendar sync error:", error);
            toast.error(error.message || "Error submitting bookings for calendar sync.");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col font-alexandria">
                <DialogHeader className="border-b pb-3">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                        <RefreshCw className="w-5 h-5 text-[#4290E9] animate-spin-slow" />
                        Unsynced Google Calendar Bookings
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 mt-1">
                        We detected <span className="font-semibold text-gray-800">{unsyncedOrders.length}</span> booking(s) in your platform schedule (past 7 days to next 100 days) that are missing from your connected Google Calendar.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-3 space-y-3">
                    {unsyncedOrders.map((order) => (
                        <div
                            key={order.order_id}
                            className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-900">Order #{order.order_id}</span>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">
                                        {order.type || 'Booking'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                                    <span className="truncate">{order.address}</span>
                                </div>
                                {order.services && (
                                    <p className="text-[11px] text-gray-500 italic">
                                        Services: {order.services}
                                    </p>
                                )}
                            </div>

                            <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-1 text-gray-700 bg-white sm:bg-transparent p-2 sm:p-0 rounded border sm:border-none">
                                <div className="flex items-center gap-1 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-[#4290E9]" />
                                    <span>{order.date}</span>
                                </div>
                                <span className="text-[11px] text-gray-500">
                                    {order.start_time} - {order.end_time}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <DialogFooter className="border-t pt-3 flex items-center justify-between sm:justify-between">
                    <span className="text-xs text-gray-400">
                        Date Range: Past 7 days to Next 100 days
                    </span>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSyncing}
                            className="text-xs h-9 px-4"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSync}
                            disabled={isSyncing || unsyncedOrders.length === 0}
                            className={`text-xs h-9 px-5 ${userType}-bg text-white flex items-center gap-2 hover:opacity-95`}
                        >
                            {isSyncing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Sync {unsyncedOrders.length} Booking(s)
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
