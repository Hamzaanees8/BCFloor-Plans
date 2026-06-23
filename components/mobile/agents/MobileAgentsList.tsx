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
  List,
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
import type { Agent } from '@/lib/types';

interface MobileAgentsListProps {
  agents: Agent[];
  loading: boolean;
  error: boolean;
  userType: string;
  isSuperAdmin: boolean;
  onQuickView: (agent: Agent) => void;
  onEdit: (uuid: string) => void;
  handleDelete: (uuid: string) => void;
  handleUpdateStatus: (uuid: string, status: boolean) => Promise<any>;
}

export default function MobileAgentsList({
  agents,
  loading,
  error,
  userType,
  isSuperAdmin,
  onQuickView,
  onEdit,
  handleDelete,
  handleUpdateStatus,
}: MobileAgentsListProps) {
  const [togglingMap, setTogglingMap] = useState<Record<string, boolean>>({});

  const handleStatusToggle = async (agent: Agent, checked: boolean) => {
    if (!agent.uuid) return;
    setTogglingMap((prev) => ({ ...prev, [agent.uuid!]: true }));
    try {
      await handleUpdateStatus(agent.uuid, checked);
      agent.status = checked;
    } finally {
      setTogglingMap((prev) => ({ ...prev, [agent.uuid!]: false }));
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
        Failed to load agents. Please try again.
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="p-8 text-center text-gray-400">
        No agents found.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {agents.map((agent) => {
        const fullName = `${agent.first_name} ${agent.last_name}`;
        const initials = `${agent.first_name?.[0] || ''}${agent.last_name?.[0] || ''}`.toUpperCase() || 'A';

        return (
          <Card key={agent.uuid} className="overflow-hidden border border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => onQuickView(agent)}>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={agent.avatar_url} alt={fullName} />
                    <AvatarFallback className="text-sm font-semibold">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <h3 className="text-sm font-semibold text-gray-900 truncate hover:underline">
                      {fullName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {agent.company_name || 'No Company'}
                    </p>
                    {isSuperAdmin && agent.organization && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Org: {agent.organization.name || 'Global / None'}
                      </p>
                    )}
                  </div>
                </div>

                {/* More Action Menu */}
                {userType !== 'vendor' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-1.5">
                        <MoreVertical className="h-4 w-4 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onQuickView(agent)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Quick View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => agent.uuid && onEdit(agent.uuid)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700 focus:bg-red-50"
                        onClick={() => agent.uuid && handleDelete(agent.uuid)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Direct Actions Row */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                {agent.primary_phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    asChild
                  >
                    <a href={`tel:${agent.primary_phone}`}>
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      Call
                    </a>
                  </Button>
                )}
                {agent.email && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs"
                    asChild
                  >
                    <a href={`mailto:${agent.email}`}>
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      Email
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs"
                  asChild
                >
                  <a href={`/dashboard/listings?agent=${agent.uuid}`}>
                    <List className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    Listings
                  </a>
                </Button>
              </div>

              {/* Status Switch (Admin Only) */}
              {userType === 'admin' && (
                <div className="flex items-center justify-between border-t border-gray-100 mt-3 pt-3">
                  <span className="text-xs text-gray-500">Account Status:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${agent.status ? 'text-green-600' : 'text-red-500'}`}>
                      {agent.status ? 'Active' : 'Inactive'}
                    </span>
                    <Switch
                      checked={!!agent.status}
                      disabled={togglingMap[agent.uuid || '']}
                      onCheckedChange={(checked) => handleStatusToggle(agent, checked)}
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
