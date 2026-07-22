'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  House,
  LogOut,
  PanelTop,
  Printer,
  Settings,
  Sliders,
  UserCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MatterportIcon, Admin, Vendors } from '@/components/Icons';
import { Logout } from '@/app/(auth)/logout';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import type { Role } from '@/app/context/whiteLabelConfig';
import { usePortalSettings } from '@/app/hooks/usePortalSettings';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon | React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Navigation data (mirrors app-sidebar.tsx)                                 */
/* -------------------------------------------------------------------------- */

const allNavGroups: NavGroup[] = [
  {
    title: 'DATA',
    items: [
      { title: 'Calendar', url: '/dashboard/calendar', icon: Calendar },
      { title: 'Listings', url: '/dashboard/listings', icon: House },
      { title: 'Services', url: '/dashboard/services', icon: Settings },
      { title: '3D / Matterport', url: '/dashboard/matterport', icon: MatterportIcon as any },
      { title: 'Notifications', url: '/dashboard/notifications', icon: Bell },
      { title: 'Billing', url: '/dashboard/billing', icon: PanelTop },
      { title: 'Vendor Billing', url: '/dashboard/vendor-billing', icon: PanelTop },
    ],
  },
  {
    title: 'PEOPLE',
    items: [
      { title: 'Agents', url: '/dashboard/agents', icon: UserCheck },
      { title: 'Vendors', url: '/dashboard/vendors', icon: Vendors as any },
      { title: 'Admin', url: '/dashboard/admin', icon: Admin as any },
    ],
  },
  {
    title: 'GENERAL',
    items: [
      { title: 'Print Requests', url: '/dashboard/admin/print-requests', icon: Printer },
      { title: 'Global Settings', url: '/dashboard/global-settings', icon: Sliders },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Filtering logic (matches app-sidebar.tsx exactly)                         */
/* -------------------------------------------------------------------------- */

function getFilteredNav(userType: string, allowPrintRequest: boolean): NavGroup[] {
  return allNavGroups
    .filter((group) => {
      // Hide entire PEOPLE group for non-admin roles
      if (userType !== 'admin' && group.title === 'PEOPLE') return false;
      return true;
    })
    .map((group) => ({
      ...group,
      // Rename GENERAL → SETTINGS for agents / vendors
      title:
        (userType === 'agent' || userType === 'vendor') && group.title === 'GENERAL'
          ? 'SETTINGS'
          : group.title,
      items: group.items
        .filter((item) => {
          // Matterport: admin only
          if (item.url === '/dashboard/matterport' && userType !== 'admin') return false;

          // Customer Billing: admin + agent only
          if (
            item.url === '/dashboard/billing' &&
            userType !== 'admin' &&
            userType !== 'agent'
          )
            return false;

          // Vendor Billing: admin + vendor only
          if (
            item.url === '/dashboard/vendor-billing' &&
            userType !== 'admin' &&
            userType !== 'vendor'
          )
            return false;

          // Print Requests: admin only + requires allow_print_request
          if (
            item.url === '/dashboard/admin/print-requests' &&
            (userType !== 'admin' || !allowPrintRequest)
          )
            return false;

          // Agent restrictions
          if (userType === 'agent') {
            const restricted = [
              '/dashboard/admin',
              '/dashboard/services',
              '/dashboard/agents',
              '/dashboard/vendors',
            ];
            if (restricted.includes(item.url)) return false;
          }

          // Vendor restrictions
          if (userType === 'vendor') {
            const restricted = [
              '/dashboard/admin',
              '/dashboard/vendors',
              '/dashboard/services',
            ];
            if (restricted.includes(item.url)) return false;
          }

          return true;
        })
        .map((item) => {
          // Rename Global Settings → Settings for agents and vendors
          if (
            (userType === 'agent' || userType === 'vendor') &&
            item.url === '/dashboard/global-settings'
          ) {
            return { ...item, title: 'Settings' };
          }
          return item;
        }),
    }))
    .filter((group) => group.items.length > 0);
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const { userType, unreadNotificationCount } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const router = useRouter();

  const role = (userType as string) || 'admin';
  const roleSettings =
    appliedSettings[role as Role] || appliedSettings['admin'];

  const userInfo =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('userInfo') || '{}')
      : {};

  const initials = [userInfo.first_name?.[0], userInfo.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'U';

  const fullName = [userInfo.first_name, userInfo.last_name]
    .filter(Boolean)
    .join(' ') || 'User';

  const { allowPrintRequest } = usePortalSettings();

  const filteredNav = useMemo(
    () => getFilteredNav(role, allowPrintRequest),
    [role, allowPrintRequest]
  );

  const handleLogout = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const redirectUrl =
      userType === 'agent'
        ? '/agent/login'
        : userType === 'vendor'
          ? '/vendor/login'
          : '/login';

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('userType');
      localStorage.removeItem('userInfo');
      router.push(redirectUrl);
      await Logout(token);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Logout failed:', error.message);
      } else {
        console.error('Logout failed:', error);
      }
    }
  }, [router, userType]);

  const roleBadgeColor = roleSettings.pageTabColor;

  return (
    <div
      className={`fixed inset-0 z-60 bg-white font-alexandria flex flex-col transition-transform duration-300 ease-in-out ${
        open ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ zIndex: 60 }}
      aria-hidden={!open}
    >
      {/* ---- Top bar ---- */}
      <div
        className="flex items-center justify-between px-4 h-14 shrink-0"
        style={{ backgroundColor: roleSettings.pageTabColor }}
      >
        <h2 className="text-white text-[18px] font-semibold">Menu</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-10 h-10 focus:outline-none active:opacity-70 transition-opacity"
          aria-label="Close menu"
        >
          <X className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* ---- Scrollable content ---- */}
      <div className="flex-1 overflow-y-auto">
        {/* User info card */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage
              src={
                userInfo?.avatar_url
                  ? `${userInfo.avatar_url}`
                  : 'https://github.com/shadcn.png'
              }
            />
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-semibold text-gray-900 truncate">
              {fullName}
            </span>
            <Badge
              className="w-fit mt-0.5 text-[10px] font-bold text-white border-0 capitalize"
              style={{ backgroundColor: roleBadgeColor }}
            >
              {role}
            </Badge>
          </div>
        </div>

        {/* Nav groups */}
        {filteredNav.map((group) => (
          <div key={group.title} className="py-2">
            <p
              className="px-4 py-2 text-[11px] font-extrabold tracking-wider uppercase"
              style={{ color: '#9CA3AF' }}
            >
              {group.title}
            </p>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isNotifications = item.url === '/dashboard/notifications';

              return (
                <Link
                  key={item.url}
                  href={item.url}
                  onClick={onClose}
                  className="flex items-center gap-3 w-full px-4 min-h-[48px] text-left active:bg-gray-50 transition-colors focus:outline-none"
                >
                  <span className="relative flex items-center justify-center w-5 h-5 shrink-0">
                    <Icon className="h-5 w-5" style={{ color: '#6B7280' }} />
                    {isNotifications && unreadNotificationCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                        {unreadNotificationCount > 99
                          ? '99+'
                          : unreadNotificationCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[15px] text-gray-800 font-normal">
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* ---- Logout button ---- */}
      <div
        className="shrink-0 border-t border-gray-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 min-h-[56px] text-left active:bg-red-50 transition-colors focus:outline-none"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="text-[15px] font-medium text-red-500">Log Out</span>
        </button>
      </div>
    </div>
  );
}
