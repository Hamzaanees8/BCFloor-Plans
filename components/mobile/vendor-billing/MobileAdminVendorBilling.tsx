'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  User,
} from 'lucide-react';

interface MobileAdminVendorBillingProps {
  vendorsGrouped: any[];
  loading: boolean;
  roleSettings: any;
  vendorInvoicesMap: Map<any, any[]>;
  loadingInvoices: Set<any>;
  vendorTotalEarnings: Map<any, number>;
  travelCosts: Map<string, any>;
  loadingTravelCosts: Set<any>;
  handlePayInvoice: (invoiceUuid: string, vendorUuid: string, vendorId: any, invoiceNumber: string, amount: number) => Promise<any>;
  triggerPaymentAction: (action: () => void) => void;
  setViewingInvoice: (invoice: any) => void;
  setIsViewModalOpen: (open: boolean) => void;
  router: any;
  expandedRow: number | null;
  toggleRow: (i: number, vg: any) => void;
}

export default function MobileAdminVendorBilling({
  vendorsGrouped,
  loading,
  roleSettings,
  vendorInvoicesMap,
  loadingInvoices,
  vendorTotalEarnings,
  travelCosts,
  loadingTravelCosts,
  handlePayInvoice,
  triggerPaymentAction,
  setViewingInvoice,
  setIsViewModalOpen,
  router,
  expandedRow,
  toggleRow,
}: MobileAdminVendorBillingProps) {

  const getVendorStatus = (vg: any) => {
    const invoices = vendorInvoicesMap.get(vg.vendorId) || [];
    if (invoices.length === 0) return { label: 'No Invoice', color: 'bg-gray-100 text-gray-800' };
    const allPaid = invoices.every((inv) => inv.status === 'paid');
    const somePaid = invoices.some((inv) => inv.status === 'paid');
    if (allPaid) return { label: 'Paid', color: 'bg-green-100 text-green-800' };
    if (somePaid) return { label: 'Partial', color: 'bg-amber-100 text-amber-800' };
    return { label: 'Unpaid', color: 'bg-rose-100 text-rose-800' };
  };

  const getOrderTravelTotal = (orderId: number, services: any[]) => {
    return services.reduce((sum, svc) => {
      const tc = travelCosts.get(`${orderId}-${svc.uuid}`);
      return sum + (tc && tc.travelCost > 0 ? tc.travelCost : 0);
    }, 0);
  };

  const computeCombinedTime = (slots: any[]) => {
    if (!slots || slots.length === 0) return '';
    const sorted = [...slots].sort((a, b) => a.start_time.localeCompare(b.start_time));
    const start = sorted[0].start_time;
    const end = sorted[sorted.length - 1].end_time;
    return `${start} - ${end}`;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3 pb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3 bg-gray-200" />
              <Skeleton className="h-4 w-3/4 bg-gray-200" />
              <Skeleton className="h-3 w-1/2 bg-gray-200" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (vendorsGrouped.length === 0) {
    return (
      <div className="p-8 pb-20 text-center text-gray-500 font-medium">
        No vendor billing data found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-20">
      {vendorsGrouped.map((vg, i) => {
        const isExpanded = expandedRow === i;
        const status = getVendorStatus(vg);
        const invoices = vendorInvoicesMap.get(vg.vendorId) || [];

        return (
          <Card key={vg.vendorId} className="overflow-hidden border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div 
                className="flex items-start justify-between gap-2 cursor-pointer"
                onClick={() => toggleRow(i, vg)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400 shrink-0" />
                    {vg.vendor?.first_name} {vg.vendor?.last_name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${status.color}`}>
                      {status.label}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {vg.totalOrders} Orders
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      ${Number(vg.totalAmount).toFixed(2)}
                    </Badge>
                  </div>
                </div>

                <div className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">
                  {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-5">
                  
                  {/* GENERATE INVOICE ACTION */}
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Invoices</h4>
                    <Button
                      size="sm"
                      onClick={() => {
                        localStorage.setItem('resume_payment_vendor_uuid', vg.vendor.uuid);
                        router.push(`/dashboard/vendor-billing/pending/${vg.vendor.uuid}`);
                      }}
                      className="text-xs px-2.5 py-1 text-white flex items-center gap-1 hover:brightness-110"
                      style={{ backgroundColor: roleSettings.pageTabColor }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Generate
                    </Button>
                  </div>

                  {/* INVOICE HISTORY LIST */}
                  {loadingInvoices.has(vg.vendorId) ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full bg-gray-200" />
                    </div>
                  ) : invoices.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No invoices generated yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {invoices.map((inv) => (
                        <div key={inv.uuid} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <p className="font-semibold text-gray-800">#{inv.invoice_number}</p>
                            <p className="text-[10px] text-gray-400">
                              {inv.cycle_start ? `${inv.cycle_start.split('T')[0]} → ${inv.cycle_end ? inv.cycle_end.split('T')[0] : ''}` : '—'}
                            </p>
                            <p className="font-bold text-gray-700 mt-1">${Number(inv.total_amount).toFixed(2)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                              inv.status === 'pending_payment' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>{inv.status}</span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-[10px]"
                              onClick={() => {
                                setViewingInvoice(inv);
                                setIsViewModalOpen(true);
                              }}
                            >
                              View
                            </Button>
                            {(inv.status === 'pending_payment' || inv.status === 'draft') && (
                              <Button
                                size="sm"
                                className="h-7 px-2 text-[10px] text-white"
                                style={{ backgroundColor: roleSettings.pageTabColor }}
                                onClick={() => {
                                  triggerPaymentAction(() => handlePayInvoice(inv.uuid, vg.vendor.uuid, vg.vendorId, inv.invoice_number, Number(inv.total_amount)));
                                }}
                              >
                                Pay
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VERIFIED EARNINGS BLOCK */}
                  {vendorTotalEarnings.has(vg.vendorId) && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-xs">
                      <p className="font-semibold text-green-800">
                        Verified Earnings (This Month): ${Number(vendorTotalEarnings.get(vg.vendorId) ?? 0).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* ORDERS BREAKDOWN */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Orders & Services</h4>
                    {loadingTravelCosts.has(vg.vendorId) ? (
                      <div className="flex items-center gap-2 p-2 text-xs text-gray-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculating travel costs...
                      </div>
                    ) : (
                      vg.orders.map((order: any) => {
                        const orderTotal = order.services.reduce((t: number, s: any) => t + Number(s.amount ?? 0), 0);
                        const orderTravelTotal = getOrderTravelTotal(order.orderId, order.services);

                        return (
                          <div key={order.orderId} className="border border-gray-150 rounded-lg overflow-hidden bg-white">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-150 flex items-center justify-between text-xs font-medium">
                              <span className="font-bold">Order #{order.orderId}</span>
                              <span className="text-[10px] text-gray-500">
                                Total: ${(orderTotal + orderTravelTotal).toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="p-2.5 space-y-2">
                              {order.services.map((svc: any, sIdx: number) => {
                                const isPaid = svc.vendor_payment != null || svc.vendor_paid === true || svc.vendor_paid === 1;
                                const linkedInvoice = svc.vendor_invoice_id;
                                const isInvoiced = linkedInvoice != null && !isPaid;
                                const svcTravel = travelCosts.get(`${order.orderId}-${svc.uuid}`);
                                const svcTime = computeCombinedTime(svc.slots || []);

                                return (
                                  <div key={sIdx} className="bg-gray-50/50 rounded p-2 text-xs border border-gray-100 space-y-1">
                                    <div className="flex items-start justify-between gap-1 flex-wrap">
                                      <span className="font-semibold text-gray-800">{svc.serviceName}</span>
                                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                        isPaid ? 'bg-green-100 text-green-700' :
                                        isInvoiced ? 'bg-blue-100 text-blue-700' :
                                        'bg-orange-100 text-orange-700'
                                      }`}>
                                        Payment: {isPaid ? 'Paid' : isInvoiced ? 'Invoiced' : 'Unpaid'}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                      Amount: ${Number(svc.amount).toFixed(2)} {svcTime && `· Time: ${svcTime}`}
                                    </p>
                                    
                                    {svcTravel && svcTravel.travelCost > 0 && (
                                      <div className="pt-1 mt-1 border-t border-dashed border-gray-200 text-[10px] text-orange-700 flex justify-between">
                                        <span>Travel Cost:</span>
                                        <span className="font-bold">${svcTravel.travelCost.toFixed(2)} ({svcTravel.distance} km)</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
