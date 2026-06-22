'use client';

import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext } from '@/app/context/AppContext';
import { useWhiteLabel } from '@/app/context/Whitelabel';
import { useOrganization } from '@/app/context/OrganizationContext';
import type { Role } from '@/app/context/whiteLabelConfig';

interface MobileHeaderProps {
  title: string;
}

export default function MobileHeader({ title }: MobileHeaderProps) {
  const { userType, unreadNotificationCount } = useAppContext();
  const { appliedSettings } = useWhiteLabel();
  const { organization } = useOrganization();
  const router = useRouter();

  const role = (userType as string) || 'admin';
  const roleSettings =
    appliedSettings[role as Role] || appliedSettings['admin'];

  const orgLogo = organization?.branding?.logo || roleSettings.logo;

  // Get user info for avatar fallback
  const userInfo =
    typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('userInfo') || '{}')
      : {};

  const initials = [userInfo.first_name?.[0], userInfo.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || 'U';

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 font-alexandria shrink-0"
      style={{ backgroundColor: roleSettings.pageTabColor }}
    >
      {/* Left – Logo / Avatar */}
      <div className="flex items-center shrink-0">
        {orgLogo ? (
          <Image
            src={orgLogo}
            alt="Logo"
            width={Number(roleSettings.logoWidth) || 120}
            height={32}
            style={{
              width: `${Math.min(Number(roleSettings.logoWidth) || 120, 120)}px`,
              height: 'auto',
            }}
            className="shrink-0 max-h-8 object-contain"
          />
        ) : (
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage
              src={
                userInfo?.avatar_url
                  ? `${userInfo.avatar_url}`
                  : 'https://github.com/shadcn.png'
              }
            />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Center – Page title */}
      <h1 className="text-white text-[16px] font-semibold truncate px-3 text-center flex-1">
        {title}
      </h1>

      {/* Right – Notification bell */}
      <button
        type="button"
        onClick={() => router.push('/dashboard/notifications')}
        className="relative flex items-center justify-center w-10 h-10 shrink-0 focus:outline-none active:opacity-70 transition-opacity"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-white" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
          </span>
        )}
      </button>
    </header>
  );
}
