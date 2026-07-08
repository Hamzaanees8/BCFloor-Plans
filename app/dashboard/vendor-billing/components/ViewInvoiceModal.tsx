import React from 'react';
import { Button } from "@/components/ui/button";
import { Download as DownloadIcon } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import InvoicePdfDocument from "@/app/dashboard/invoice/components/InvoicePdfDocument";
import DownloadInvoicePdf from "@/app/dashboard/invoice/components/DownloadInvoicePdf";

export function ViewInvoiceModal({ isOpen, onClose, invoice, roleSettings }: any) {
    const handleDownload = async () => {
        if (!invoice) return;
        const invoiceNumber = invoice.invoice_number || invoice.id;
        const fileName = `Invoice_${invoiceNumber}.pdf`;
        await DownloadInvoicePdf('invoice-pdf-content', fileName);
    }

    // Map vendor invoice data to InvoiceDocument format
    const documentData = {
        ...invoice,
        items: invoice.lines?.map((line: any) => ({
            ...line,
            quantity: line.quantity || 1,
            unit_price: line.unit_price || line.amount,
        })) || []
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col rounded-[8px] p-0 font-alexandria overflow-hidden bg-gray-50">
                <DialogHeader className="p-4 md:p-6 border-b border-[#E4E4E4] bg-white shrink-0">
                    <DialogTitle className="flex flex-col md:flex-row items-start md:items-center w-full font-alexandria relative pr-8 md:pr-0">
                        <div className="flex flex-col items-start w-full md:w-auto">
                            <span className="text-[20px] md:text-[22px] font-[700] uppercase tracking-wide leading-none" style={{ color: roleSettings.pageTabColor }}>
                                Invoice
                            </span>
                            <span className="text-[13px] md:text-[15px] font-[500] text-gray-500 mt-1.5 break-all">
                                #{invoice.invoice_number || invoice.id}
                            </span>
                        </div>

                        <div className={`flex w-full md:w-auto md:ml-auto md:items-center gap-2 mt-4 md:mt-0 md:pr-4 flex-col md:flex-row items-start`}>
                            <Button
                                onClick={handleDownload}
                                className={`flex-1 h-[40px] md:h-[36px] px-2 md:px-6 text-[12px] md:text-[14px] font-semibold text-white hover:brightness-90 hover:!text-white rounded-[6px] border-none w-full md:w-auto shadow-sm transition-all`}
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                            >
                                <DownloadIcon className="w-4 h-4 mr-1.5 inline-block" /> Download PDF
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4 overflow-y-auto flex-1">
                    <InvoiceDocument 
                        invoice={documentData}
                        editData={null}
                        isEditing={false}
                        updateItem={() => {}}
                        addItem={() => {}}
                        removeItem={() => {}}
                        updateTaxRate={() => {}}
                        setEditData={() => {}}
                        roleSettings={roleSettings}
                    />
                </div>

                {/* Hidden PDF component for high-accuracy capture */}
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <InvoicePdfDocument
                        invoice={documentData}
                        roleSettings={roleSettings}
                    />
                </div>

                <DialogFooter className="border-t p-4 shrink-0 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <Button 
                        onClick={onClose}
                        className="text-white hover:brightness-110 transition-all px-8 h-10 w-full sm:w-auto"
                        style={{ backgroundColor: roleSettings.pageTabColor }}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
