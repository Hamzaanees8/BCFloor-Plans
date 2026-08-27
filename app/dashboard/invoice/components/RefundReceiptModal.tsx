'use client'
import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

type RefundReceiptModalProps = {
    isOpen: boolean;
    onClose: () => void;
    payment: any;
    invoice: any;
}

const RefundReceiptModal = ({ isOpen, onClose, payment, invoice }: RefundReceiptModalProps) => {
    if (!isOpen || !payment || !invoice) return null

    const receiptNumber = `REF-${(invoice.invoice_number || invoice.id || '').replace('INV-', '')}-${payment.id}`;
    const refundAmount = Math.abs(parseFloat(payment.amount || 0)).toFixed(2);
    const refundDate = new Date(payment.paid_at || payment.created_at).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const agentName = invoice.agent 
        ? `${invoice.agent.first_name || ''} ${invoice.agent.last_name || ''}`.trim()
        : 'Agent';
    const agentEmail = invoice.agent?.email || '';
    const propertyAddress = invoice.order?.property?.address || '—';

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-print-area');
        if (!printContent) return;

        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * {
                    visibility: hidden;
                }
                #receipt-print-area, #receipt-print-area * {
                    visibility: visible;
                }
                #receipt-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] font-alexandria p-0 overflow-hidden bg-white">
                <div id="receipt-print-area" className="p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2 border-b border-dashed border-gray-200 pb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 text-red-500 mb-1">
                            <span className="font-bold text-lg">REF</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">REFUND RECEIPT</h2>
                        <p className="text-xs text-gray-500">Receipt Number: {receiptNumber}</p>
                    </div>

                    {/* Main Receipt Details */}
                    <div className="space-y-4 text-xs md:text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Refund Date:</span>
                            <span className="font-semibold text-gray-900">{refundDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Reference Invoice:</span>
                            <span className="font-semibold text-gray-900">{invoice.invoice_number || invoice.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Refund Method:</span>
                            <span className="font-semibold text-gray-900 capitalize">{payment.payment_method || 'manual'}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-100 pt-4 space-y-4">
                            <div>
                                <span className="text-gray-500 block mb-1">Refunded To Agent:</span>
                                <span className="font-semibold text-gray-900 block">{agentName}</span>
                                {agentEmail && <span className="text-xs text-gray-500">{agentEmail}</span>}
                            </div>
                            <div>
                                <span className="text-gray-500 block mb-1">Property Address:</span>
                                <span className="font-semibold text-gray-900 block">{propertyAddress}</span>
                            </div>
                        </div>
                    </div>

                    {/* Refund Amount Banner */}
                    <div className="bg-red-50/50 border border-red-100 rounded-lg p-4 text-center space-y-1">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Total Refunded (CAD)</span>
                        <span className="text-2xl font-extrabold text-red-600">${refundAmount}</span>
                    </div>

                    {/* Notes */}
                    {payment.meta?.notes && (
                        <div className="border-t border-dashed border-gray-200 pt-4 space-y-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold block">Notes:</span>
                            <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded italic">
                                &ldquo;{payment.meta.notes}&rdquo;
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer buttons (not printed) */}
                <DialogFooter className="px-8 pb-8 pt-2 flex sm:justify-between gap-3 no-print border-t border-gray-50">
                    <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Close
                    </Button>
                    <Button type="button" onClick={handlePrint} className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
                        <Printer className="mr-2 h-4 w-4" /> Print Receipt
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default RefundReceiptModal
