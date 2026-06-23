'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Phone,
  Mail,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Types imported elsewhere if needed

interface MobileVendorsListProps {
  vendors: any[];
  loading: boolean;
  error: boolean;
  userType: string;
  isSuperAdmin: boolean;
  onQuickView: (vendor: any) => void;
  onEdit: (uuid: string) => void;
  handleDelete: (uuid: string) => void;
  handleUpdateStatus: (uuid: string, status: boolean) => Promise<any>;
}

export default function MobileVendorsList({
  vendors,
  loading,
  error,
  userType,
  isSuperAdmin,
  onQuickView,
  onEdit,
  handleDelete,
  handleUpdateStatus,
}: MobileVendorsListProps) {
  // No settings needed

  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});

  const handleStatusToggle = async (vendor: any, checked: boolean) => {
    if (!vendor.uuid) return;
    setTogglingMap((prev) => ({ ...prev, [vendor.uuid!]: true }));
    try {
      await handleUpdateStatus(vendor.uuid, checked);
      vendor.status = checked;
    } finally {
      setTogglingMap((prev) => ({ ...prev, [vendor.uuid!]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load vendors. Please try again.
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No vendors found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {vendors.map((vendor) => {
        const fullName = `${vendor.first_name} ${vendor.last_name}`;
        const initials = `${vendor.first_name?.[0] || ''}${vendor.last_name?.[0] || ''}`.toUpperCase() || 'V';

        return (
          <Card key={vendor.uuid} className="overflow-hidden border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onQuickView(vendor)}>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={vendor.avatar_url} alt={fullName} />
                    <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <h3 className="text-sm font-semibold text-gray-900 truncate hover:underline">
                      {fullName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {vendor.email || 'No Email'}
                    </p>
                    {isSuperAdmin && vendor.organization && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Org: {vendor.organization.name || 'Global / None'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                {userType === 'admin' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1.5">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onQuickView(vendor)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Quick View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => vendor.uuid && onEdit(vendor.uuid)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Vendor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={() => vendor.uuid && handleDelete(vendor.uuid)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Vendor
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Direct Actions Row */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                {vendor.primary_phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    asChild
                  >
                    <a href={`tel:${vendor.primary_phone}`}>
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      Call
                    </a>
                  </Button>
                )}
                {vendor.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    asChild
                  >
                    <a href={`mailto:${vendor.email}`}>
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      Email
                    </a>
                  </Button>
                )}
              </div>

              {/* Status Switch (Admin Only) */}
              {userType === 'admin' && (
                <div className="flex items-center justify-between border-t border-gray-100 mt-3 pt-3">
                  <span className="text-xs text-gray-500">Account Status:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${vendor.status ? 'text-green-600' : 'text-red-500'}`}>
                      {vendor.status ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={!!vendor.status}
                      disabled={togglingMap[vendor.uuid || '']}
                      onCheckedChange={(checked) => handleStatusToggle(vendor, checked)}
                    />
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
