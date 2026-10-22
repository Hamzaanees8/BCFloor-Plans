'use client';
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { DeleteInvoice } from '../invoice_api';
import { toast } from 'sonner';

import { isInvoiceLinkedToService, isMainInvoice } from '../invoice_utils';

type DeleteInvoiceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
    onSuccess: () => void;
};

export default function DeleteInvoiceModal({ isOpen, onClose, invoice, onSuccess }: DeleteInvoiceModalProps) {
    const [loading, setLoading] = useState(false);

    if (!invoice) return null;

    const invoiceNumber = invoice.invoice_number || invoice.id;
    const isMain = isMainInvoice(invoice);
    const isLinkedToService = !isMain && isInvoiceLinkedToService(invoice);

    const linkedItem = invoice?.items?.find((item: any) =>
        Boolean(item.order_service_id || item.order_service || item.orderService)
    );
    const serviceName =
        linkedItem?.order_service?.service?.name ||
        linkedItem?.orderService?.service?.name ||
        linkedItem?.order_service?.custom ||
        linkedItem?.orderService?.custom ||
        linkedItem?.description ||
        "Associated Service";

    const orderId = invoice.order_id || invoice.order?.id;

    const handleDelete = async (removeService: boolean) => {
        try {
            setLoading(true);
            const res = await DeleteInvoice(invoice.uuid, removeService);
            if (res.success) {
                toast.success(removeService 
                    ? 'Invoice deleted and service removed from order.' 
                    : 'Invoice deleted successfully.');
                onSuccess();
                onClose();
            } else {
                toast.error(res.message || 'Failed to delete invoice');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || 'An error occurred while deleting the invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!loading && !open) onClose(); }}>
            <DialogContent 
                overlayClassName="!z-[100000]"
                className="!z-[100001] max-w-md w-full bg-white rounded-lg p-6 font-alexandria shadow-2xl border"
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 text-lg font-bold">
                        <Trash2 className="h-5 w-5" /> Delete Invoice #{invoiceNumber}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-3 text-sm text-gray-700 space-y-3">
                    {isMain ? (
                        <>
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2.5">
                                <AlertTriangle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-emerald-800">
                                    <p className="font-semibold text-sm mb-0.5">Main Order Invoice</p>
                                    This is the main consolidated invoice{orderId ? ` for Order #${orderId}` : ''}.
                                </div>
                            </div>
                            <p>
                                Are you sure you want to permanently delete main invoice <strong>#{invoiceNumber}</strong>?
                            </p>
                            <p className="text-xs text-gray-500">
                                This will remove the invoice and its line items. The order and its services will remain intact. This action cannot be undone.
                            </p>
                        </>
                    ) : isLinkedToService ? (
                        <>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800">
                                    <p className="font-semibold text-sm mb-0.5">Linked Service Detected</p>
                                    This invoice is linked to <strong>{serviceName}</strong>{orderId ? ` on Order #${orderId}` : ''}.
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Deleting this invoice will permanently remove the invoice <strong>AND</strong> remove <strong>{serviceName}</strong> from the order (deducting the amount from the order total and releasing any scheduled calendar slot).
                            </p>
                            <p className="text-xs text-red-600 font-medium">
                                This action cannot be undone.
                            </p>
                        </>
                    ) : (
                        <>
                            <p>
                                Are you sure you want to permanently delete invoice <strong>#{invoiceNumber}</strong>?
                            </p>
                            <p className="text-xs text-gray-500">
                                This is an unlinked / orphan invoice. Deleting it will remove the invoice and its line items. This action cannot be undone.
                            </p>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t mt-2 flex items-center justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={onClose}
                        className="text-xs font-medium"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={loading}
                        onClick={() => handleDelete(isLinkedToService)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                        {loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                        )}
                        {isLinkedToService ? 'Delete Invoice & Remove Service' : 'Delete Invoice'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
