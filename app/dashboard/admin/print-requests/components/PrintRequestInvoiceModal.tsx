"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Download,
  Loader2,
  X,
  CreditCard,
} from "lucide-react";
import InvoiceDocument from "@/app/dashboard/invoice/components/InvoiceDocument";
import InvoicePdfDocument from "@/app/dashboard/invoice/components/InvoicePdfDocument";
import DownloadInvoicePdf from "@/app/dashboard/invoice/components/DownloadInvoicePdf";
import { PayInvoiceWithStripe } from "@/app/dashboard/invoice/invoice_api";
import { isRenewalInvoice, isMainInvoice, isInvoiceLinkedToService } from "@/app/dashboard/invoice/invoice_utils";
import { useAppContext } from "@/app/context/AppContext";
import { useWhiteLabel } from "@/app/context/Whitelabel";
import { toast } from "sonner";
import type { PrintRequest } from "../print-requests";
import { GetPrintRequestInvoice } from "../print-requests";

interface PrintRequestInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  request: PrintRequest | null;
  onPaidSuccess?: () => void;
}

export default function PrintRequestInvoiceModal({
  open,
  onClose,
  request,
}: PrintRequestInvoiceModalProps) {
  const { userType } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || "admin";
  const isAdmin = userType === "admin";
  const roleSettings =
    appliedSettings[role as keyof typeof appliedSettings] ||
    appliedSettings["admin"];

  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [paying, setPaying] = useState<boolean>(false);

  const fetchInvoice = useCallback(async () => {
    if (!request?.uuid) return;
    setLoading(true);
    try {
      const res = await GetPrintRequestInvoice(request.uuid);
      if (res?.data) {
        setInvoice(res.data);
      } else if (request.invoice) {
        setInvoice(request.invoice);
      } else {
        setInvoice(null);
      }
    } catch (err) {
      console.error("Failed to fetch print request invoice:", err);
      if (request?.invoice) {
        setInvoice(request.invoice);
      } else {
        toast.error("Invoice for this print request is not available yet.");
      }
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (open && request) {
      if (request.invoice) {
        setInvoice(request.invoice);
        setLoading(false);
      }
      fetchInvoice();
    } else {
      setInvoice(null);
    }
  }, [open, request, fetchInvoice]);

  if (!request) return null;

  const isPaid =
    invoice &&
    ["paid", "refunded"].includes((invoice.status || "").toLowerCase());

  const handlePayInvoice = async (mode: "on_behalf" | "self") => {
    if (!invoice) return;
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    setPaying(true);
    try {
      toast.info("Opening Stripe checkout session...");
      const order = invoice.order || request.feature_sheet?.order || request.order;
      await PayInvoiceWithStripe(
        invoice,
        order || {},
        window.location.href,
        undefined,
        mode
      );
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Failed to initiate payment session");
    } finally {
      setPaying(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = document.getElementById("invoice-download-content")?.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${invoice?.invoice_number || invoice?.id}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { font-family: sans-serif; padding: 40px; }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          ${content}
          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = async () => {
    if (!invoice) return;
    const invoiceNumber = invoice.invoice_number || invoice.id;
    const fileName = `Invoice_${invoiceNumber}.pdf`;
    await DownloadInvoicePdf("invoice-pdf-content", fileName);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] rounded-[8px] p-0 font-alexandria overflow-hidden [&>button]:hidden shadow-2xl">
        <DialogHeader className="p-4 md:p-6 border-b border-[#E4E4E4] bg-white">
          <DialogTitle className="flex flex-col gap-3 w-full font-alexandria">
            {/* Row 1: Title and badges on the left, Close button on the right */}
            <div className="flex justify-between items-center w-full gap-3">
              <div className="flex flex-col items-start min-w-0">
                <span
                  className="text-[20px] md:text-[22px] font-[700] uppercase tracking-wide leading-none"
                  style={{ color: `var(--${userType}-page-tab-color)` }}
                >
                  Invoice
                </span>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[13px] md:text-[15px] font-[500] text-gray-500 whitespace-nowrap">
                    #{invoice?.invoice_number || invoice?.id || "N/A"}
                  </span>
                  {invoice && (
                    isRenewalInvoice(invoice) ? (
                      <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-purple-100 text-purple-700 uppercase border border-purple-200 whitespace-nowrap">
                        Hosting Renewal Invoice
                      </span>
                    ) : isMainInvoice(invoice) ? (
                      <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase border border-emerald-300 whitespace-nowrap">
                        Main Invoice
                      </span>
                    ) : isInvoiceLinkedToService(invoice) ? (
                      <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-blue-100 text-blue-700 uppercase border border-blue-200 whitespace-nowrap">
                        Service Order Invoice
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase border border-amber-300 whitespace-nowrap">
                        Feature Sheet Print Invoice
                      </span>
                    )
                  )}
                </div>
              </div>

              <Button
                className="border-none !shadow-none bg-transparent hover:bg-transparent p-0 shrink-0 transition-opacity hover:opacity-70"
                onClick={onClose}
              >
                <X className="!w-[22px] !h-[22px] cursor-pointer text-[#7D7D7D]" />
              </Button>
            </div>

            {/* Row 2: Action buttons underneath on the right side */}
            <div className="flex items-center justify-end gap-2 w-full flex-wrap">
              {invoice && !loading && (
                <>
                  {!isPaid ? (
                    isAdmin ? (
                      <Button
                        onClick={() => handlePayInvoice("on_behalf")}
                        disabled={paying}
                        className="h-[30px] text-xs px-3 font-medium text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98] shadow-sm admin-bg border-none flex items-center gap-1.5"
                      >
                        {paying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                        Pay on Behalf
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePayInvoice("self")}
                        disabled={paying}
                        className="h-[30px] text-xs px-4 font-medium text-white hover:brightness-110 rounded-[6px] transition-all active:scale-[0.98] shadow-sm agent-bg border-none flex items-center gap-1.5"
                      >
                        {paying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                        Pay Now
                      </Button>
                    )
                  ) : (
                    <span className="px-2.5 py-1 rounded-[6px] text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      PAID
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-[30px] text-xs px-2.5 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="h-[30px] text-xs px-2.5 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto p-4 md:p-8 bg-[#F9F9F9]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-xs text-gray-500">Loading invoice document...</p>
            </div>
          ) : !invoice ? (
            <div className="py-20 text-center text-gray-500 text-sm">
              No invoice found for this print request.
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <InvoiceDocument
                invoice={invoice}
                editData={invoice}
                isEditing={false}
                updateItem={() => {}}
                addItem={() => {}}
                removeItem={() => {}}
                setEditData={() => {}}
                roleSettings={roleSettings}
              />
            </div>
          )}
        </div>

        {/* Hidden PDF component for high-accuracy capture */}
        {invoice && (
          <div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
            <InvoicePdfDocument
              invoice={invoice}
              roleSettings={roleSettings}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
