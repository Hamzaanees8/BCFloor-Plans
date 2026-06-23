'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Copy,
  Check,
  ExternalLink,
  MoreVertical,
  Globe,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MatterportAd } from '@/app/dashboard/matterport/matterport';

interface MobileMatterportListProps {
  tours: MatterportAd[];
  loading: boolean;
  isSuperAdmin: boolean;
  options: { label: string; confirm1?: boolean }[];
}

const MobileCopyableLink = ({ label, url }: { label: string; url: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 mt-1">
      <div className="min-w-0 flex-1">
        <span className="text-[10px] text-gray-400 block font-semibold uppercase">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline truncate block mt-0.5"
        >
          {url}
        </a>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="h-8 w-8 hover:bg-gray-100"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          asChild
          className="h-8 w-8 hover:bg-gray-100"
        >
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
        </Button>
      </div>
    </div>
  );
};

export default function MobileMatterportList({
  tours,
  loading,
  isSuperAdmin,
  options,
}: MobileMatterportListProps) {
  // No settings needed

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (tours.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No 3D tours found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {tours.map((tour) => {
        return (
          <Card key={tour.orderuud} className="overflow-hidden border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Address */}
                  <h3 className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    {tour.address || 'No Address'}
                  </h3>

                  {isSuperAdmin && tour.organizationName && (
                    <p className="text-xs text-gray-500 mt-1">
                      Organization: {tour.organizationName}
                    </p>
                  )}

                  {/* Status */}
                  <div className="mt-2.5">
                    <Badge className={`text-[10px] px-2 py-0.5 ${tour.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-orange-100 text-orange-700 hover:bg-orange-100'}`}>
                      <Globe className="w-3 h-3 mr-1" />
                      {tour.status}
                    </Badge>
                  </div>
                </div>

                {/* Dropdown Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1.5">
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {options.map((opt) => (
                      <DropdownMenuItem key={opt.label}>
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Copy Links */}
              <div className="mt-4 space-y-2 pt-3 border-t border-gray-100">
                {tour.brandedLink ? (
                  <MobileCopyableLink label="Branded Tour Link" url={tour.brandedLink} />
                ) : (
                  <p className="text-xs text-gray-400 italic">No Branded Tour Link Available</p>
                )}
                {tour.unbrandedLink ? (
                  <MobileCopyableLink label="Unbranded Tour Link" url={tour.unbrandedLink} />
                ) : (
                  <p className="text-xs text-gray-400 italic">No Unbranded Tour Link Available</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
