'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BellOff, ArrowRight } from 'lucide-react';
import { useOrganization } from '@/app/context/OrganizationContext';
import type { NotificationData } from '@/lib/types';

interface MobileNotificationsListProps {
  notifications: NotificationData[];
  loading: boolean;
  error: boolean;
  userType: string;
  onNotificationClick: (notification: NotificationData) => void;
}

export default function MobileNotificationsList({
  notifications,
  loading,
  error,
  userType,
  onNotificationClick,
}: MobileNotificationsListProps) {
  const { organization } = useOrganization();
  const createdByName =
    organization?.name || organization?.from_name || "Support Team";
  
  const getNotificationAddress = (notification: NotificationData) => {
    return notification.source === 'AgentPayment' || notification.source === 'VendorPayment'
      ? notification.meta_data?.property_address || 'Payment Details'
      : notification.order?.property_address
        ? `${notification.order.property_address} ${notification.order.property_location || ''}`
        : '-';
  };

  const getFormattedDate = (notification: NotificationData) => {
    const rawDate = notification.created_at || notification.order?.created_at;
    if (!rawDate) return 'N/A';
    return new Date(rawDate).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3 pb-20">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 pb-20 text-center text-red-500 font-medium">
        Failed to load notifications. Please try again.
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 pb-20 text-gray-400 space-y-2">
        <BellOff className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">No notifications found</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 pb-20">
      {notifications.map((notification) => {
        const addressText = getNotificationAddress(notification);
        const formattedDate = getFormattedDate(notification);
        const displayType = (notification.type || notification.Subject || '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return (
          <Card
            key={notification.uuid}
            onClick={() => onNotificationClick(notification)}
            className={`cursor-pointer overflow-hidden border transition-all hover:shadow-md active:scale-[0.99] ${
              !notification.is_read
                ? 'border-l-4 border-l-green-500 border-gray-200 bg-white'
                : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {createdByName}
                    </span>
                    <span className="text-[10px] text-gray-500 shrink-0">
                      {formattedDate}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-1">
                    {!notification.is_read && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${userType}-bg`} />
                    )}
                    {displayType}
                  </h4>

                  {addressText && addressText !== '-' && (
                    <p className="text-xs text-gray-600 line-clamp-2 italic">
                      {addressText}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-400 self-center">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
