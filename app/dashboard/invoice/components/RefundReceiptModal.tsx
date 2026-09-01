'use client'
import React from 'react'
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Printer, X, RotateCcw } from 'lucide-react'

type RefundReceiptModalProps = {
    isOpen: boolean;
    onClose: () => void;
    payment: any;
    invoice: any;
}

const RefundReceiptModal = ({ isOpen, onClose, payment, invoice }: RefundReceiptModalProps) => {
    if (!isOpen || !payment || !invoice) return null

    const rawInvoiceNum = (invoice.invoice_number || invoice.id || '').toString().replace(/^INV-/, '');
    const receiptNumber = `REF-${rawInvoiceNum}-${payment.id}`;
    const refundAmount = Math.abs(parseFloat(payment.amount || 0)).toFixed(2);
    
    let refundDate = '—';
    try {
        const dateVal = payment.paid_at || payment.created_at;
        if (dateVal) {
            refundDate = new Date(dateVal).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    } catch {
        refundDate = '—';
    }

    const agentName = invoice.agent 
        ? `${invoice.agent.first_name || ''} ${invoice.agent.last_name || ''}`.trim()
        : (invoice.agent_name || 'Agent');
    const agentEmail = invoice.agent?.email || '';
    const propertyAddress = invoice.order?.property?.address || invoice.property_address || '—';

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-print-area');
        if (!printContent) return;

        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body * {
                    visibility: hidden !important;
                }
                #receipt-print-area, #receipt-print-area * {
                    visibility: visible !important;
                }
                #receipt-print-area {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 24px !important;
                    margin: 0 !important;
                }
                .no-print {
                    display: none !important;
                }
            }
        `;
        document.head.appendChild(style);
        window.print();
        document.head.removeChild(style);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[480px] w-[95vw] max-h-[88vh] font-alexandria p-0 overflow-hidden bg-white rounded-[8px] flex flex-col border border-[#BBBBBB] shadow-2xl [&>button]:hidden">
                {/* Header Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-3.5 right-3.5 h-8 w-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors z-20"
                    aria-label="Close dialog"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Printable receipt body */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-7 space-y-5">
                    <div id="receipt-print-area" className="space-y-5">
                        {/* Header Badge & Title */}
                        <div className="text-center space-y-1.5 border-b border-dashed border-gray-200 pb-5">
                            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-red-50 text-red-500 mb-1 border border-red-100">
                                <RotateCcw className="h-5 w-5 text-red-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 tracking-tight">REFUND RECEIPT</h2>
                            <p className="text-xs text-gray-500 font-mono">Receipt Number: {receiptNumber}</p>
                        </div>

                        {/* Main Details */}
                        <div className="space-y-3 text-xs sm:text-sm">
                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-500">Refund Date:</span>
                                <span className="font-semibold text-gray-800 text-right">{refundDate}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-500">Reference Invoice:</span>
                                <span className="font-semibold text-gray-800 text-right">{invoice.invoice_number || invoice.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-1">
                                <span className="text-gray-500">Refund Method:</span>
                                <span className="font-semibold text-gray-800 capitalize text-right">{payment.payment_method || 'manual'}</span>
                            </div>

                            <div className="border-t border-dashed border-gray-200 pt-3.5 space-y-3">
                                <div>
                                    <span className="text-gray-500 block mb-0.5 text-xs">Refunded To Agent:</span>
                                    <span className="font-semibold text-gray-900 block">{agentName}</span>
                                    {agentEmail && <span className="text-xs text-gray-500">{agentEmail}</span>}
                                </div>
                                <div>
                                    <span className="text-gray-500 block mb-0.5 text-xs">Property Address:</span>
                                    <span className="font-semibold text-gray-900 block">{propertyAddress}</span>
                                </div>
                            </div>
                        </div>

                        {/* Refund Amount Banner */}
                        <div className="bg-red-50/70 border border-red-200/80 rounded-lg p-4 text-center space-y-0.5">
                            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">
                                Total Refunded (CAD)
                            </span>
                            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 block">
                                ${refundAmount}
                            </span>
                        </div>

                        {/* Notes */}
                        {payment.meta?.notes && (
                            <div className="border-t border-dashed border-gray-200 pt-3.5 space-y-1">
                                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold block">Notes:</span>
                                <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200/60 p-3 rounded-[6px] italic leading-relaxed">
                                    &ldquo;{payment.meta.notes}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer buttons pinned at bottom */}
                <div className="p-4 px-6 sm:px-7 flex justify-between items-center gap-3 border-t border-gray-200 bg-gray-50/90 shrink-0 no-print">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="h-[36px] px-5 text-xs sm:text-sm font-medium border border-[#BBBBBB] hover:bg-gray-100 text-gray-700 rounded-[6px] transition-colors"
                    >
                        Close
                    </Button>
                    <Button
                        type="button"
                        onClick={handlePrint}
                        className="h-[36px] px-5 text-xs sm:text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-[6px] transition-all hover:brightness-105 active:scale-[0.98] shadow-sm flex items-center gap-2"
                    >
                        <Printer className="h-4 w-4" /> Print Receipt
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default RefundReceiptModal
