'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  MapPin,
  ClipboardList,
  CreditCard,
  Eye,
  Globe,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Listings } from '@/lib/types';

interface MobileListingsListProps {
  listings: Listings[];
  loading: boolean;
  error: boolean;
  userType: string;
  onQuickView: (listing: Listings) => void;
  handleDelete: (uuid: string) => void;
  handleUpdateStatus: (listingId: string, status: boolean) => Promise<any>;
}

export default function MobileListingsList({
  listings,
  loading,
  error,
  userType,
  onQuickView,
  handleDelete,
  handleUpdateStatus,
}: MobileListingsListProps) {
  const router = useRouter();
  // No settings needed

  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});

  const getLatestOrder = (orders?: any[]) => {
    if (!orders || orders.length === 0) return null;
    return [...orders].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )[0];
  };

  const getProjectStatus = (orders?: any[]) => {
    const latestOrder = getLatestOrder(orders);
    if (!latestOrder) {
      return { label: 'No Bookings', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }

    const orderStatus = latestOrder.order_status;
    const paymentStatus = latestOrder.payment_status;

    if (orderStatus === 'Completed') {
      if (paymentStatus === 'PAID') {
        return { label: 'Complete', color: 'bg-green-100 text-green-800 border-green-200' };
      } else {
        return { label: 'Ready for Payment', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      }
    }

    if (orderStatus === 'Processing' || orderStatus === 'In Progress' || orderStatus === 'Pending') {
      return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }

    if (orderStatus === 'Cancelled') {
      return { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' };
    }

    if (orderStatus === 'On Hold') {
      return { label: 'On Hold', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    }

    return { label: orderStatus || 'N/A', color: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const getPaymentStatus = (orders?: any[]) => {
    const latestOrder = getLatestOrder(orders);
    if (!latestOrder) {
      return { label: 'N/A', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }

    const status = latestOrder.payment_status;
    if (status === 'PAID') {
      return { label: 'Paid', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    } else if (status === 'PARTIALLY_PAID') {
      return { label: 'Partially Paid', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    } else {
      return { label: 'Unpaid', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
  };

  const handleStatusToggle = async (listing: Listings, checked: boolean) => {
    if (!listing.uuid) return;
    setTogglingMap((prev) => ({ ...prev, [listing.uuid!]: true }));
    try {
      await handleUpdateStatus(listing.uuid, checked);
      listing.tour_activated = checked;
    } finally {
      setTogglingMap((prev) => ({ ...prev, [listing.uuid!]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3 pb-20">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 pb-20 text-center text-red-500">
        Failed to load listings. Please try again.
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="p-8 pb-20 text-center text-gray-400">
        No listings found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-20">
      {listings.map((listing) => {
        const projStatus = getProjectStatus(listing.orders);
        const payStatus = getPaymentStatus(listing.orders);
        const latestOrder = getLatestOrder(listing.orders);

        const files = listing.orders?.[0]?.tours?.[0]?.files;
        const featuredFile = files?.find((file: any) => file.is_featured) || files?.[0];
        const file_path = featuredFile?.thumbnail_url || featuredFile?.file_path || "";

        const formattedAddress = [
          listing.address && listing.suite
            ? `${listing.suite} - ${listing.address}`
            : listing.address || listing.suite,
          listing.city,
          listing.province,
        ]
          .filter(Boolean)
          .join(', ');

        return (
          <Card key={listing.uuid} className="overflow-hidden border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div
                  className="flex gap-3 flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (latestOrder?.uuid) {
                      router.push(`/dashboard/file-manager/${latestOrder.uuid}?listingId=${listing.uuid}`);
                    } else {
                      onQuickView(listing);
                    }
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-16 h-16 rounded-md shrink-0 border border-gray-100 flex items-center justify-center bg-gray-50 overflow-hidden"
                    style={{
                      backgroundImage: file_path
                        ? `url('${file_path.startsWith('http') ? file_path : (process.env.NEXT_PUBLIC_FILES_API_URL || '') + '/' + file_path}')`
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {!file_path && (
                      <span className="text-[9px] text-gray-400 text-center font-medium px-1 leading-tight">No Image</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Address */}
                    <h3 className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5 cursor-pointer hover:underline">
                      <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                      {formattedAddress || 'No Address'}
                    </h3>

                    {/* Agent Details */}
                    {userType !== 'agent' && listing.agent && (
                      <p className="text-xs text-gray-500 mt-1">
                        Agent: {listing.agent.first_name} {listing.agent.last_name}
                      </p>
                    )}

                    {/* Price */}
                    {listing.listing_price && (
                      <p className="text-xs font-semibold text-gray-700 mt-1">
                        Price: ${new Intl.NumberFormat('en-US').format(listing.listing_price)}
                      </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${projStatus.color}`}>
                        <ClipboardList className="w-3 h-3 mr-1" />
                        {projStatus.label}
                      </Badge>
                      {latestOrder && (
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 border ${payStatus.color}`}>
                          <CreditCard className="w-3 h-3 mr-1" />
                          {payStatus.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* More Action Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1.5">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onQuickView(listing)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Quick View
                    </DropdownMenuItem>
                    {userType === 'admin' && (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={() => listing.uuid && handleDelete(listing.uuid)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Listing
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between border-t border-gray-100 mt-3 pt-3">
                {/* Tour Switch */}
                {userType !== 'vendor' ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Globe className="h-3.5 w-3.5" />
                      Property Status:
                    </span>
                    <Switch
                      checked={!!listing.status}
                      disabled={togglingMap[listing.uuid || '']}
                      onCheckedChange={(checked) => handleStatusToggle(listing, checked)}
                      className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    Order ID: {latestOrder?.id || 'N/A'}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onQuickView(listing)}
                >
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
