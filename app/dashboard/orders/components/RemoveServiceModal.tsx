'use client';
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ServiceRemovalPreview {
    service_name: string;
    base_price: number;
    discount_amount: number;
    tax_rate: number;
    tax_amount: number;
    final_total: number;
    invoice_type: 'individual' | 'consolidated';
    invoice_number: string | null;
}

type RemoveServiceModalProps = {
    isOpen: boolean;
    onClose: () => void;
    orderUuid: string;
    serviceUuid: string;
    serviceName: string;
    servicePrice?: number;
    onSuccess: () => void;
};

export default function RemoveServiceModal({
    isOpen,
    onClose,
    orderUuid,
    serviceUuid,
    serviceName,
    servicePrice,
    onSuccess,
}: RemoveServiceModalProps) {
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [preview, setPreview] = useState<ServiceRemovalPreview | null>(null);

    useEffect(() => {
        if (!isOpen || !orderUuid || !serviceUuid) {
            setPreview(null);
            return;
        }

        let isMounted = true;
        setPreviewLoading(true);

        api.get(`/orders/${orderUuid}/services/${serviceUuid}/preview-remove`)
            .then((res) => {
                if (isMounted && res.data?.success && res.data?.data) {
                    setPreview(res.data.data);
                }
            })
            .catch((err) => {
                console.warn("Could not fetch remove preview:", err);
            })
            .finally(() => {
                if (isMounted) setPreviewLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen, orderUuid, serviceUuid]);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            const res = (await api.delete(`/orders/${orderUuid}/services/${serviceUuid}`)).data;
            if (res.success) {
                toast.success(res.message || `Service "${serviceName}" removed successfully.`);
                onSuccess();
                onClose();
            } else {
                toast.error(res.message || "Failed to remove service.");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || err.message || "An error occurred while removing the service.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!loading && !open) onClose(); }}>
            <DialogContent className="max-w-md w-full bg-white rounded-lg p-6 font-alexandria">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600 text-lg font-bold">
                        <Trash2 className="h-5 w-5" /> Remove Service
                    </DialogTitle>
                </DialogHeader>

                <div className="py-3 text-sm text-gray-700 space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2.5">
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-xs text-red-900 w-full">
                            <p className="font-semibold text-sm mb-1">
                                Remove &quot;{preview?.service_name || serviceName}&quot;?
                            </p>

                            {/* Price Breakdown */}
                            <div className="my-2.5 p-2.5 bg-white/90 rounded border border-red-200/80 text-gray-800 space-y-1">
                                {previewLoading ? (
                                    <div className="flex items-center gap-2 py-1 text-gray-500 text-xs">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Calculating exact invoice breakdown...</span>
                                    </div>
                                ) : preview ? (
                                    <>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-600">Base Price:</span>
                                            <span className="font-medium">${preview.base_price.toFixed(2)}</span>
                                        </div>
                                        {preview.discount_amount > 0 && (
                                            <div className="flex justify-between items-center text-xs text-green-700">
                                                <span>Discount (Adjusted):</span>
                                                <span className="font-medium">-${preview.discount_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-600">Taxes ({preview.tax_rate}%):</span>
                                            <span className="font-medium">+${preview.tax_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-200 pt-1.5 mt-1 flex justify-between items-center text-xs font-bold text-red-700">
                                            <span>Total Amount Deducted:</span>
                                            <span className="text-sm">${preview.final_total.toFixed(2)}</span>
                                        </div>
                                        {preview.invoice_number && (
                                            <div className="text-[10px] text-gray-500 pt-1 flex items-center gap-1">
                                                <Receipt className="h-3 w-3 text-gray-400" />
                                                <span>
                                                    {preview.invoice_type === 'individual'
                                                        ? `Deletes individual invoice ${preview.invoice_number}`
                                                        : `Updates consolidated invoice ${preview.invoice_number}`}
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {servicePrice !== undefined && servicePrice > 0 && (
                                            <div className="flex justify-between items-center text-xs font-semibold">
                                                <span>Base Price:</span>
                                                <span>${servicePrice.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-gray-500 italic mt-0.5">
                                            (Tax and applicable package discounts will be automatically recalculated on completion)
                                        </p>
                                    </>
                                )}
                            </div>

                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-800">
                                <li>Deletes this service from the order</li>
                                <li>Removes its booking slot from the calendar</li>
                                <li>Deducts full final price (including tax &amp; discount) from invoice</li>
                                <li>Updates order amount and synchronizes payment status</li>
                            </ul>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        This action is intended for unpaid services and does not apply cancellation fees or send cancellation emails.
                    </p>
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
                    <Button
                        type="button"
                        disabled={loading}
                        onClick={handleConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                    >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                        Remove Service
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
