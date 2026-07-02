'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { GetMyEarnings } from '@/app/dashboard/vendors/vendors';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Briefcase,
  Truck,
  FileText,
  CalendarDays,
  MapPin,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface EarningItem {
  date: string;
  property_address: string;
  service_name: string;
  service_amount: number;
  travel_amount: number;
  total_amount: number;
  status: string;
  invoice_number?: string;
  paid_at?: string;
}

interface EarningsSummary {
  total: number;
  services: number;
  travel: number;
}

type Period = 'this_month' | 'last_month' | 'this_year';

const PERIOD_OPTIONS: { label: string; value: Period }[] = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getEarningStatusColor(status: string): string {
  const s = status?.toLowerCase();
  if (s === 'paid') return 'bg-green-100 text-green-700 border-green-200';
  if (s === 'invoiced') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (s === 'pending') return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
}

// ── Component ───────────────────────────────────────────────────────────────

export default function MobileVendorEarnings() {
  const { appliedSettings } = useWhiteLabel();

  const [period, setPeriod] = useState<Period>('this_month');
  const [earnings, setEarnings] = useState<EarningItem[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({ total: 0, services: 0, travel: 0 });
  const [loading, setLoading] = useState(true);

  const vendorColor = appliedSettings?.vendor?.pageTabColor || '#DC9600';

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await GetMyEarnings({ period });
      const data = res?.data ?? res;
      
      setEarnings(data?.items ?? []);
      
      setSummary({
        total: data?.summary?.total_earned ?? 0,
        services: data?.summary?.total_services ?? 0,
        travel: data?.summary?.total_travel ?? 0,
      });
    } catch (err) {
      console.error('Failed to fetch earnings:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // ── Loading skeleton ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="font-alexandria p-4 space-y-4 pb-20">
        <Skeleton className="h-7 w-40" />
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="h-4 w-12 mb-2" />
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────

  return (
    <div className="font-alexandria p-4 pb-24 space-y-5">
      {/* Header */}
      <h1 className="text-[20px] font-semibold text-gray-900">Earnings</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Total Earned */}
        <Card className="border border-gray-200">
          <CardContent className="p-3 text-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5"
              style={{ backgroundColor: `${vendorColor}20` }}
            >
              <DollarSign className="w-4 h-4" style={{ color: vendorColor }} />
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-[15px] font-bold text-gray-900 mt-0.5">
              {formatCurrency(summary.total)}
            </p>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="border border-gray-200">
          <CardContent className="p-3 text-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5"
              style={{ backgroundColor: `${vendorColor}20` }}
            >
              <Briefcase className="w-4 h-4" style={{ color: vendorColor }} />
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Services</p>
            <p className="text-[15px] font-bold text-gray-900 mt-0.5">
              {formatCurrency(summary.services)}
            </p>
          </CardContent>
        </Card>

        {/* Travel */}
        <Card className="border border-gray-200">
          <CardContent className="p-3 text-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5"
              style={{ backgroundColor: `${vendorColor}20` }}
            >
              <Truck className="w-4 h-4" style={{ color: vendorColor }} />
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Travel</p>
            <p className="text-[15px] font-bold text-gray-900 mt-0.5">
              {formatCurrency(summary.travel)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Period filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium transition-colors min-h-[40px] ${
              period === opt.value
                ? 'text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={
              period === opt.value
                ? { backgroundColor: vendorColor }
                : undefined
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Earnings list */}
      {earnings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-[15px] font-medium text-gray-600">No earnings found</p>
          <p className="text-[12px] text-gray-400 mt-1">Try selecting a different period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {earnings.map((item, idx) => (
            <Card key={idx} className="border border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-2.5">
                {/* Date & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDate(item.date)}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[11px] px-2 py-0.5 capitalize ${getEarningStatusColor(item.status)}`}
                  >
                    {item.status}
                  </Badge>
                </div>

                {/* Property address */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-[13px] text-gray-700 leading-tight">
                    {item.property_address}
                  </span>
                </div>

                {/* Service name */}
                <p className="text-[13px] font-medium text-gray-800">{item.service_name}</p>

                {/* Amount breakdown */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-[12px] text-gray-600">
                    <span>Service</span>
                    <span>{formatCurrency(item.service_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] text-gray-600">
                    <span>Travel</span>
                    <span>{formatCurrency(item.travel_amount)}</span>
                  </div>
                  <div className="flex justify-between text-[13px] font-semibold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatCurrency(item.total_amount)}</span>
                  </div>
                </div>

                {/* Invoice number */}
                {item.invoice_number && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    Invoice: {item.invoice_number}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
