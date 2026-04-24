'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { format } from "date-fns"
import { Calendar as CalendarIcon, Loader2, ChevronRight, DollarSign, Briefcase, Truck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAppContext } from '@/app/context/AppContext'
import { GetVendorEarnings, GetMyEarnings } from '@/app/dashboard/vendors/vendors'
import { toast } from 'sonner'

interface VendorEarningsHistoryProps {
    vendorId?: string;
}

interface EarningItem {
    uuid: string;
    date: string;
    order_uuid: string | null;
    property_address: string;
    service_name: string;
    service_amount: number;
    travel_amount: number;
    total_amount: number;
    status: string;
    invoice_number: string | null;
    paid_at: string | null;
}

interface EarningSummary {
    total_earned: number;
    total_services: number;
    total_travel: number;
    count: number;
}

interface MonthlyBreakdown {
    month: string;
    total: number;
    services: number;
    travel: number;
    count: number;
}

const VendorEarningsHistory: React.FC<VendorEarningsHistoryProps> = ({ vendorId }) => {
    const { userType } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('this_month');
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [data, setData] = useState<{
        summary: EarningSummary;
        breakdown: MonthlyBreakdown[];
        items: EarningItem[];
        filters: {
            period: string;
            start_date: string | null;
            end_date: string | null;
        }
    } | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { period };
            if (period === 'custom_range') {
                if (startDate) params.start_date = format(startDate, 'yyyy-MM-dd');
                if (endDate) params.end_date = format(endDate, 'yyyy-MM-dd');
            }

            let response;
            if (userType === 'vendor') {
                response = await GetMyEarnings(params);
            } else if (vendorId) {
                response = await GetVendorEarnings(vendorId, params);
            }

            if (response?.success) {
                setData(response.data);
            } else {
                toast.error(response?.message || 'Failed to fetch earnings data');
            }
        } catch (error) {
            console.error('Error fetching earnings:', error);
            toast.error('An error occurred while fetching earnings data');
        } finally {
            setLoading(false);
        }
    }, [period, startDate, endDate, userType, vendorId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return 'text-green-600';
            case 'invoiced': return 'text-blue-600';
            default: return 'text-orange-600';
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 font-alexandria">
            {/* Filters Section */}
            <div className="flex flex-wrap items-end justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</label>
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[180px] h-10 border-gray-200">
                                <SelectValue placeholder="Select Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_month">Last Month</SelectItem>
                                <SelectItem value="this_year">This Year</SelectItem>
                                <SelectItem value="custom_range">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {period === 'custom_range' && (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-[160px] h-10 justify-start text-left font-normal border-gray-200 ${!startDate && 'text-muted-foreground'}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={`w-[160px] h-10 justify-start text-left font-normal border-gray-200 ${!endDate && 'text-muted-foreground'}`}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                    <span className="font-medium">Range:</span>
                    <span>{data?.filters?.start_date ? format(new Date(data.filters.start_date), "MMM d, yyyy") : '...'}</span>
                    <ChevronRight className="w-3 h-3" />
                    <span>{data?.filters?.end_date ? format(new Date(data.filters.end_date), "MMM d, yyyy") : '...'}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#4290E9]" />
                    <p className="text-gray-500 animate-pulse">Loading earnings history...</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-100 text-white flex flex-col gap-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-20 h-20" />
                            </div>
                            <span className="text-blue-100 text-sm font-medium uppercase tracking-wider">Total Earned</span>
                            <span className="text-3xl font-bold">{formatCurrency(data?.summary?.total_earned || 0)}</span>
                            <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs">
                                <span className="bg-white/20 px-2 py-0.5 rounded-full">{data?.summary?.count} Jobs Completed</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 text-gray-50 opacity-50 group-hover:scale-110 transition-transform">
                                <Briefcase className="w-20 h-20 text-gray-100" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Services</span>
                            <span className="text-3xl font-bold text-gray-800">{formatCurrency(data?.summary?.total_services || 0)}</span>
                            <div className="mt-4 text-gray-400 text-xs">Base service earnings</div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-1 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 text-gray-50 opacity-50 group-hover:scale-110 transition-transform">
                                <Truck className="w-20 h-20 text-gray-100" />
                            </div>
                            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Travel</span>
                            <span className="text-3xl font-bold text-gray-800">{formatCurrency(data?.summary?.total_travel || 0)}</span>
                            <div className="mt-4 text-gray-400 text-xs">Commute reimbursements</div>
                        </div>
                    </div>

                    {/* Breakdown Section (Optional, could be a list or simple cards) */}
                    {data?.breakdown && data.breakdown.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Monthly Breakdown</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {data.breakdown.map((item) => (
                                    <div key={item.month} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{format(new Date(item.month + '-01'), "MMMM yyyy")}</span>
                                        <span className="text-lg font-bold text-gray-700">{formatCurrency(item.total)}</span>
                                        <span className="text-[10px] text-gray-500 italic">{item.count} items</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Detailed History</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-[100px] text-[11px] font-bold text-gray-400 uppercase">Date</TableHead>
                                        <TableHead className="text-[11px] font-bold text-gray-400 uppercase">Property / Service</TableHead>
                                        <TableHead className="text-[11px] font-bold text-gray-400 uppercase">Amount</TableHead>
                                        <TableHead className="text-[11px] font-bold text-gray-400 uppercase text-center">Status</TableHead>
                                        <TableHead className="text-[11px] font-bold text-gray-400 uppercase">Invoice</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data?.items && data.items.length > 0 ? (
                                        data.items.map((item) => (
                                            <TableRow key={item.uuid} className="hover:bg-gray-50 transition-colors">
                                                <TableCell className="text-sm font-medium text-gray-600">
                                                    {format(new Date(item.date), "MMM d, yy")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-800 line-clamp-1">{item.property_address}</span>
                                                        <span className="text-xs text-gray-400">{item.service_name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-700">{formatCurrency(item.total_amount)}</span>
                                                        {item.travel_amount > 0 && (
                                                            <span className="text-[10px] text-gray-400">Incl. {formatCurrency(item.travel_amount)} travel</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-gray-50 border border-current opacity-80 ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs font-medium text-gray-500 italic">
                                                    {item.invoice_number || '---'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-20 text-gray-400 italic">
                                                No earnings items found for the selected period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default VendorEarningsHistory
