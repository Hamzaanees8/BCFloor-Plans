'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Printer,
  Calendar,
  User,
  MapPin,
  FileText,
  Copy,
  Eye,
  Loader2,
} from 'lucide-react';
import type { PrintRequest } from '@/app/dashboard/admin/print-requests/print-requests';

interface MobilePrintRequestsListProps {
  requests: PrintRequest[];
  loading: boolean;
  error: boolean;
  handleStatusChange: (uuid: string, newStatus: string) => Promise<void>;
  getStatusColor: (status: string) => string;
  isAdmin?: boolean;
  loadingInvoiceUuid?: string | null;
  onOpenDetail?: (request: PrintRequest) => void;
  onOpenInvoice?: (request: PrintRequest) => void;
}

export default function MobilePrintRequestsList({
  requests,
  loading,
  error,
  handleStatusChange,
  getStatusColor,
  isAdmin = false,
  loadingInvoiceUuid,
  onOpenDetail,
  onOpenInvoice,
}: MobilePrintRequestsListProps) {
  if (loading) {
    return (
      <div className="p-4 space-y-3 pb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 pb-20 text-center text-red-500">
        Failed to load print requests. Please try again.
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="p-8 pb-20 text-center text-gray-400">
        No print requests found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-20">
      {requests.map((req) => {
        const date = new Date(req.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
        const agentName = `${req.agent?.first_name || ''} ${req.agent?.last_name || ''}`;
        const isPaid = req.payment_status === 'PAID';
        const isUnread = isAdmin
          ? !req.is_read
          : (!req.agent_read || req.payment_status === 'UNPAID');

        return (
          <Card
            key={req.uuid}
            className={`overflow-hidden border shadow-xs cursor-pointer transition-colors ${
              isUnread ? 'border-sky-300 bg-sky-50/25' : 'border-gray-200 bg-white'
            }`}
            onClick={() => onOpenDetail?.(req)}
          >
            <CardContent className="p-4">
              <div className="space-y-2.5">
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <span
                        className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"
                        title={isAdmin ? "Unread request" : !req.agent_read ? "Status updated" : "Payment pending"}
                      />
                    )}
                    <span className={`text-xs flex items-center gap-1 ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      {date}
                    </span>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {isAdmin ? (
                      <Select
                        value={req.status}
                        onValueChange={(value) => handleStatusChange(req.uuid, value)}
                      >
                        <SelectTrigger
                          className={`w-[115px] h-[28px] text-[11px] font-medium rounded-full border ${getStatusColor(
                            req.status
                          )}`}
                        >
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Processing">Processing</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-medium rounded-full border ${getStatusColor(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Agent Details */}
                <div className="flex items-start gap-2 pt-1">
                  <User className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{agentName}</p>
                    <p className="text-xs text-gray-500 truncate">{req.agent?.email}</p>
                  </div>
                </div>

                {/* Property Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-700 font-medium line-clamp-1">
                    {req.property?.address || 'No Property Address'}
                  </p>
                </div>

                {/* Print Specs & Payment Status */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Copy className="h-3.5 w-3.5 text-gray-400" />
                    Copies: <span className="font-semibold text-gray-800">{req.copies}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Printer className="h-3.5 w-3.5 text-gray-400" />
                    Bleed: <span className="font-semibold text-gray-800">{req.with_bleed ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      disabled={loadingInvoiceUuid === req.uuid}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenInvoice?.(req);
                      }}
                      className={`h-[22px] w-[60px] text-[10px] flex justify-center items-center cursor-pointer px-1 text-white font-bold rounded-md shadow-xs ${
                        isPaid
                          ? "bg-[#6BAE41] hover:bg-[#5fa43a]"
                          : "bg-[#DC9600] hover:bg-[#eda304]"
                      }`}
                      title="Click to view invoice"
                    >
                      {loadingInvoiceUuid === req.uuid ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isPaid ? (
                        "PAID"
                      ) : isAdmin ? (
                        "UNPAID"
                      ) : (
                        "UnPaid"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Template Info & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-gray-400" />
                    {req.feature_sheet?.template_key || 'Standard Template'}
                  </span>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => onOpenDetail?.(req)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>

                    {(req.feature_sheet?.order_id || req.order_uuid) && req.feature_sheet?.uuid && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs text-gray-700 hover:bg-gray-50 shrink-0"
                        asChild
                      >
                        <a
                          href={`/dashboard/file-manager/${req.feature_sheet.order_id || req.order_uuid}?serviceId=CreateFeatureSheet&sheetUuid=${req.feature_sheet.uuid}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Preview
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
