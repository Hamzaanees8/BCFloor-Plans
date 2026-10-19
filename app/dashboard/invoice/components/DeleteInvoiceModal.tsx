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

type DeleteInvoiceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    invoice: any;
    onSuccess: () => void;
};

export default function DeleteInvoiceModal({ isOpen, onClose, invoice, onSuccess }: DeleteInvoiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [actionType, setActionType] = useState<'invoice_only' | 'with_service' | null>(null);

    if (!invoice) return null;

    const invoiceNumber = invoice.invoice_number || invoice.id;
    const isServiceInvoice = Boolean(
        invoice?.items?.some((item: any) => item.order_service_id) ||
        (invoice?.notes && invoice.notes.includes("Service Invoice:"))
    );

    const serviceName = invoice?.items?.find((item: any) => item.order_service_id)?.description || 
        invoice?.notes?.replace("Service Invoice:", "").trim() || "Associated Service";

    const handleDelete = async (removeService: boolean) => {
        try {
            setLoading(true);
            setActionType(removeService ? 'with_service' : 'invoice_only');
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
            setActionType(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!loading && !open) onClose(); }}>
            <DialogContent className="max-w-md w-full bg-white rounded-lg p-6 font-alexandria">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 text-lg font-bold">
                        <Trash2 className="h-5 w-5" /> Delete Invoice #{invoiceNumber}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-3 text-sm text-gray-700 space-y-3">
                    {isServiceInvoice ? (
                        <>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2.5">
                                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800">
                                    <p className="font-semibold text-sm mb-0.5">Linked Service Detected</p>
                                    This invoice is linked to <strong>{serviceName}</strong> on Order #{invoice.order_id || invoice.order?.id}.
                                </div>
                            </div>
                            <p className="text-xs text-gray-600">
                                How would you like to handle this deletion?
                            </p>

                            <div className="space-y-2 pt-1">
                                <div className="p-3 border rounded-lg hover:border-gray-400 transition-colors bg-gray-50/50">
                                    <h4 className="font-semibold text-gray-900 text-xs mb-1">Option 1: Delete Invoice Only</h4>
                                    <p className="text-[11px] text-gray-500 mb-2.5">
                                        Removes this specific invoice. The service remains on the order and will be billed under the main consolidated invoice.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                        onClick={() => handleDelete(false)}
                                        className="w-full text-xs font-semibold text-gray-700 hover:bg-gray-100"
                                    >
                                        {loading && actionType === 'invoice_only' ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                                        )}
                                        Delete Invoice Only
                                    </Button>
                                </div>

                                <div className="p-3 border border-red-200 rounded-lg hover:border-red-300 transition-colors bg-red-50/30">
                                    <h4 className="font-semibold text-red-900 text-xs mb-1">Option 2: Delete Invoice & Remove Service</h4>
                                    <p className="text-[11px] text-red-700/80 mb-2.5">
                                        Deletes this invoice <strong>AND</strong> removes the service from the order (deducts amount from order total, deletes calendar slot, and updates consolidated invoice).
                                    </p>
                                    <Button
                                        size="sm"
                                        disabled={loading}
                                        onClick={() => handleDelete(true)}
                                        className="w-full text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                                    >
                                        {loading && actionType === 'with_service' ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                        )}
                                        Delete Invoice & Remove Service
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <p>
                                Are you sure you want to permanently delete invoice <strong>#{invoiceNumber}</strong>?
                            </p>
                            <p className="text-xs text-gray-500">
                                This will remove the invoice and its line items. This action cannot be undone.
                            </p>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t mt-1">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={loading}
                        onClick={onClose}
                        className="text-xs"
                    >
                        Cancel
                    </Button>
                    {!isServiceInvoice && (
                        <Button
                            type="button"
                            disabled={loading}
                            onClick={() => handleDelete(false)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                        >
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                            Delete Invoice
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
