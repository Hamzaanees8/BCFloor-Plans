'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Calendar,
  ClipboardList,
  CreditCard,
  Home,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import type { Role } from '@/app/context/whiteLabelConfig';

interface TabConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  route: string | null; // null = fires callback instead of navigating
}

const adminTabs: TabConfig[] = [
  { key: 'schedule', label: 'Schedule', icon: Calendar, route: '/dashboard/calendar' },
  { key: 'listings', label: 'Listings', icon: ClipboardList, route: '/dashboard/listings' },
  { key: 'billing', label: 'Billing', icon: CreditCard, route: '/dashboard/billing' },
  { key: 'alerts', label: 'Alerts', icon: Bell, route: '/dashboard/notifications' },
  { key: 'more', label: 'More', icon: Menu, route: null },
];

const agentTabs: TabConfig[] = [
  { key: 'listings', label: 'Listings', icon: ClipboardList, route: '/dashboard/listings' },
  { key: 'pay', label: 'Pay', icon: CreditCard, route: '/dashboard/billing' },
  { key: 'tours', label: 'Tours', icon: Home, route: '/agent/tours' },
  { key: 'alerts', label: 'Alerts', icon: Bell, route: '/dashboard/notifications' },
  { key: 'more', label: 'More', icon: Menu, route: null },
];

const vendorTabs: TabConfig[] = [
  { key: 'today', label: 'Today', icon: Calendar, route: '/dashboard/calendar' },
  { key: 'listings', label: 'Listings', icon: ClipboardList, route: '/dashboard/listings' },
  { key: 'billing', label: 'Billing', icon: CreditCard, route: '/dashboard/vendor-billing' },
  { key: 'alerts', label: 'Alerts', icon: Bell, route: '/dashboard/notifications' },
  { key: 'more', label: 'More', icon: Menu, route: null },
];

const tabsByRole: Record<string, TabConfig[]> = {
  admin: adminTabs,
  agent: agentTabs,
  vendor: vendorTabs,
};

interface MobileBottomNavProps {
  onMoreClick: () => void;
}

export default function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const { userType, unreadNotificationCount } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const pathname = usePathname();
  const router = useRouter();

  const role = (userType as string) || 'admin';
  const roleSettings =
    appliedSettings[role as Role] || appliedSettings['admin'];

  const tabs = useMemo(() => tabsByRole[role] || adminTabs, [role]);

  const isTabActive = useCallback(
    (tab: TabConfig) => {
      if (!tab.route) return false;
      // Strip query params for comparison
      const routePath = tab.route.split('?')[0];
      return pathname === routePath || pathname.startsWith(`${routePath}/`);
    },
    [pathname],
  );

  const handleTabPress = useCallback(
    (tab: TabConfig) => {
      if (tab.route === null) {
        onMoreClick();
      } else {
        router.push(tab.route);
      }
    },
    [onMoreClick, router],
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 font-alexandria"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const active = isTabActive(tab);
          const Icon = tab.icon;
          const isBell = tab.key === 'alerts';

          const content = (
            <>
              {/* Active indicator bar */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-b-full"
                  style={{ backgroundColor: roleSettings.pageTabColor }}
                />
              )}

              <span className="relative">
                <Icon
                  className="h-5 w-5"
                  style={{ color: active ? roleSettings.pageTabColor : '#9CA3AF' }}
                />
                {/* Notification badge */}
                {isBell && unreadNotificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
                    {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                  </span>
                )}
              </span>

              <span
                className="text-[10px] mt-0.5 leading-tight font-medium"
                style={{ color: active ? roleSettings.pageTabColor : '#9CA3AF' }}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.route) {
            return (
              <Link
                key={tab.key}
                href={tab.route}
                className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] relative focus:outline-none active:opacity-70 transition-opacity"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabPress(tab)}
              className="flex flex-col items-center justify-center flex-1 h-full min-h-[48px] relative focus:outline-none active:opacity-70 transition-opacity"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
