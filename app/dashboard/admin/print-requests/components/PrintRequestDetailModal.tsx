"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Calendar,
  User,
  MapPin,
  FileText,
  Copy,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ExternalLink,
  X,
  MessageSquareQuote,
  Receipt,
} from "lucide-react";
import type { PrintRequest } from "../print-requests";
import { MarkPrintRequestAsRead } from "../print-requests";
import { useAppContext } from "@/app/context/AppContext";

interface PrintRequestDetailModalProps {
  open: boolean;
  onClose: () => void;
  request: PrintRequest | null;
  getStatusColor?: (status: string) => string;
  onReadUpdated?: (uuid: string) => void;
  onOpenInvoice?: (request: PrintRequest) => void;
}

export default function PrintRequestDetailModal({
  open,
  onClose,
  request,
  onReadUpdated,
  onOpenInvoice,
}: PrintRequestDetailModalProps) {
  const { userType, refreshPrintRequestsCount } = useAppContext();
  const isAdmin = userType === "admin";
  const [isOpeningInvoice, setIsOpeningInvoice] = useState(false);

  useEffect(() => {
    if (!open || !request) return;

    // Auto mark as read when opened
    const shouldMarkAdmin = isAdmin && request.is_read === false;
    const shouldMarkAgent = !isAdmin && request.agent_read === false;

    if (shouldMarkAdmin || shouldMarkAgent) {
      MarkPrintRequestAsRead(request.uuid)
        .then(() => {
          refreshPrintRequestsCount();
          if (onReadUpdated) {
            onReadUpdated(request.uuid);
          }
        })
        .catch((err) => {
          console.error("Failed to mark print request as read in modal:", err);
        });
    }
  }, [open, request, isAdmin, refreshPrintRequestsCount, onReadUpdated]);

  if (!request) return null;

  const date = new Date(request.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isPaid = request.payment_status === "PAID";
  const agentName = `${request.agent?.first_name || ""} ${request.agent?.last_name || ""}`.trim();
  const orderId = request.feature_sheet?.order_id || request.order_uuid;
  const orderDisplayNumber = request.order_number || (orderId ? `#${String(orderId).slice(0, 8)}` : null);
  const sheetUuid = request.feature_sheet?.uuid;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case "Processing":
        return <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />;
      case "Completed":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "Cancelled":
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Processing":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Cancelled":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[92vw] sm:w-[580px] max-w-[580px] rounded-xl p-0 font-alexandria overflow-hidden shadow-2xl border border-gray-200 [&>button]:hidden">
        {/* Styled Differentiated Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0B2545] to-[#133E68] text-white px-6 py-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Printer className="w-5 h-5 text-sky-200" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Print Request Details
                  {orderDisplayNumber && (
                    <span className="text-xs font-normal px-2 py-0.5 rounded bg-white/20 text-sky-100">
                      Order {orderDisplayNumber}
                    </span>
                  )}
                </DialogTitle>
                <p className="text-xs text-sky-100/80 mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-300" />
                  Submitted on {date}
                </p>
              </div>
            </div>

            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/15 rounded-full h-8 w-8 transition-colors p-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-gray-50/50">
          {/* Dual Status Bar */}
          <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-xs grid grid-cols-2 gap-3 divide-x divide-gray-100">
            {/* Fulfillment Status */}
            <div className="pr-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                Fulfillment Status
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeStyle(
                  request.status
                )}`}
              >
                {getStatusIcon(request.status)}
                {request.status}
              </div>
            </div>

            {/* Payment Status */}
            <div className="pl-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600 block mb-1.5">
                Payment Status
              </span>
              <Button
                type="button"
                disabled={isOpeningInvoice}
                onClick={() => {
                  setIsOpeningInvoice(true);
                  onOpenInvoice?.(request);
                  setTimeout(() => setIsOpeningInvoice(false), 500);
                }}
                className={`h-[28px] w-[80px] text-[11px] flex justify-center items-center cursor-pointer px-3 text-white font-bold rounded-md shadow-xs ${
                  isPaid
                    ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                    : "bg-[#DC9600] hover:bg-[#eda304]"
                }`}
                title="Click to view invoice"
              >
                {isOpeningInvoice ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPaid ? (
                  "PAID"
                ) : userType === "admin" ? (
                  "UNPAID"
                ) : (
                  "UnPaid"
                )}
              </Button>
            </div>
          </div>

          {/* Property & Agent Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Property Location Card */}
            <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                Property Address
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 pt-1">
                {request.property?.address || "No Property Address"}
              </p>
            </div>

            {/* Agent Info Card */}
            <div className="bg-white rounded-xl p-3.5 border border-gray-200/80 shadow-xs space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                <User className="w-3.5 h-3.5 text-sky-600" />
                Requesting Agent
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate pt-1">
                {agentName || "Unknown Agent"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {request.agent?.email || "No email available"}
              </p>
            </div>
          </div>

          {/* Print Job Specifications Grid */}
          <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              Print Specifications
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Copies Tile */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <Copy className="w-3 h-3 text-gray-600" /> Copies
                </span>
                <span className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                  {request.copies} <span className="text-xs font-normal text-gray-500">units</span>
                </span>
              </div>

              {/* Bleed Tile */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <Printer className="w-3 h-3 text-gray-600" /> Margins
                </span>
                <span className="text-xs font-bold text-gray-800 mt-1">
                  {request.with_bleed ? "With Bleed" : "Standard"}
                </span>
              </div>

              {/* Template Tile */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-gray-600" /> Template
                </span>
                <span className="text-xs font-bold text-gray-800 mt-1 truncate" title={request.feature_sheet?.template_key}>
                  {request.feature_sheet?.template_key || "Standard"}
                </span>
              </div>

              {/* Price Tile */}
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-gray-600" /> Price
                </span>
                <span className="text-sm sm:text-base font-bold text-gray-900 mt-1">
                  {request.amount !== undefined && request.amount !== null
                    ? `$${Number(request.amount).toFixed(2)}`
                    : "Included"}
                </span>
              </div>
            </div>
          </div>

          {/* Special Instructions Callout */}
          <div className="bg-white rounded-xl p-4 border border-gray-200/80 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
              <MessageSquareQuote className="w-3.5 h-3.5 text-sky-600" />
              Special Print Instructions
            </h4>
            {request.additional_info ? (
              <div className="p-3 rounded-lg bg-sky-50/60 border border-sky-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {request.additional_info}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No special instructions provided.</p>
            )}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Left Action: Preview Sheet */}
          <div>
            {orderId && sheetUuid ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-xs font-semibold text-sky-700 hover:text-sky-800 hover:bg-sky-50 border-sky-200 h-9 gap-1.5"
                asChild
              >
                <a
                  href={`/dashboard/file-manager/${orderId}?serviceId=CreateFeatureSheet&sheetUuid=${sheetUuid}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Preview Feature Sheet
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </Button>
            ) : (
              <span className="text-xs text-gray-500">No preview available</span>
            )}
          </div>

          {/* Right Actions: View Invoice / Pay / Close */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              onClick={() => onOpenInvoice?.(request)}
              className={`w-full sm:w-auto text-xs font-semibold h-9 gap-1.5 shadow-xs ${
                !isPaid
                  ? isAdmin
                    ? "admin-bg text-white hover:brightness-110"
                    : "agent-bg text-white hover:brightness-110"
                  : "bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              {!isPaid
                ? isAdmin
                  ? "Pay on Behalf"
                  : "Pay Invoice"
                : "View Invoice"}
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto text-xs font-medium text-gray-700 hover:bg-gray-100 border-gray-300 h-9"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
