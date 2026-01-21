"use client";

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Calendar, File, House, LogOut, PanelLeftClose, PanelLeftOpen, PanelTop, Settings, Sliders, UserCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Admin, BackArrow, MatterportIcon, SubAccounts, Vendors } from "./Icons";
import Image from "next/image";
import { Logout } from "@/app/(auth)/logout";
import { useAppContext } from "@/app/context/AppContext";
import SafeLink from "./SafeLink";
import { useUnsaved } from "@/app/context/UnsavedContext";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWhiteLabel } from "@/app/context/Whitelabel";

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "DATA",
      url: "#",
      items: [
        {
          title: "Calendar",
          url: "/dashboard/calendar",
          icon: Calendar,
        },
        {
          title: "Listings",
          url: "/dashboard/listings",
          icon: House,
        },
        {
          title: "Orders",
          url: "/dashboard/orders",
          icon: File,
        },
        {
          title: "Services",
          url: "/dashboard/services",
          icon: Settings,
        },
        {
          title: "Matterport",
          url: "/dashboard/matterport",
          icon: MatterportIcon,
        },
        {
          title: "Notifications",
          url: "/dashboard/notifications",
          icon: Bell,
        },
        {
          title: "Billing",
          url: "/dashboard/billing",
          icon: PanelTop,
        },
        {
          title: "Vendor Billing",
          url: "/dashboard/vendor-billing",
          icon: PanelTop,
        },
        // {
        //   title: "Sub Accounts",
        //   url: "/dashboard/sub-accounts",
        //   icon: SubAccounts,
        // },
      ],
    },
    {
      title: "PEOPLE",
      url: "#",
      items: [
        {
          title: "Agents",
          url: "/dashboard/agents",
          icon: UserCheck,
        },
        // {
        //   title: "Sub Accounts",
        //   url: "/dashboard/sub-accounts",
        //   icon: SubAccounts,
        // },
        {
          title: "Vendors",
          url: "/dashboard/vendors",
          icon: Vendors,
        },
        {
          title: "Admin",
          url: "/dashboard/admin",
          icon: Admin,
        },
      ],
    },
    {
      title: "GENERAL",
      url: "#",
      items: [
        {
          title: "Global Settings",
          url: "/dashboard/global-settings",
          icon: Sliders,
        },
        {
          title: "White Label",
          url: "/dashboard/white-label",
          icon: Settings,
        },
      ],
    },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userType } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathSegments = pathname.split('/').filter(Boolean);
  const showBackButton = pathSegments.length > 2;
  const { confirmNavigation } = useUnsaved();
  //const parentPath = `/${pathSegments.slice(0, -1).join('/')}`;
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const { hasPermission } = usePermissions();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { appliedSettings } = useWhiteLabel();
  const role = (userType as string) || 'admin';
  const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

  async function logoutUser() {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found");
      return;
    }

    const redirectUrl = userType === "agent"
      ? "/agent/login"
      : userType === "vendor"
        ? "/vendor/login"
        : "/login";

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      localStorage.removeItem("userInfo");
      router.push(redirectUrl);
      await Logout(token);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Logout failed:", error.message);
      } else {
        console.error("Logout failed:", error);
      }
    }

  }

  const goToDashboardSection = () => {
    confirmNavigation(() => router.back(), {
      title: "Unsaved Changes",
      description: "You have unsaved changes. Do you want to discard them and go back?"
    });
  };

  const filteredNavMain = data.navMain.filter(group => {
    // Hide entire PEOPLE group for agents
    return !(userType === "agent" && group.title === "PEOPLE");
  })
    .map(group => ({
      ...group,
      title: userType === "agent" && group.title === "GENERAL" ? "SETTINGS" : group.title,
      items: group.items.filter(item => {

        if (item.url === "/dashboard/matterport" && userType !== "admin") {
          return false;
        }
        if (item.url === "/dashboard/billing" && userType !== "admin") {
          return false;
        }
        if (item.url === "/dashboard/vendor-billing" && userType !== "admin") {
          return false;
        }
        if (item.url === "/dashboard/white-label" && userType !== "admin") {
          return false;
        }


        if (item.url === "/dashboard/sub-accounts") {
          return (userType === "admin" && group.title === "PEOPLE") ||
            (userType === "agent" && group.title === "DATA");
        }

        if ((userType === "agent" || userType === "vendor") && item.url === "/dashboard/global-settings") {
          item.title = "Settings";
        }

        if (userType === "admin") {
          if (item.url === "/dashboard/billing" && !hasPermission(PERMISSIONS.ACCESS_BILLING)) {
            return false;
          }

          if (item.url === "/dashboard/vendor-billing" && !hasPermission(PERMISSIONS.ACCESS_BILLING)) {
            return false;
          }

          if (item.url === "/dashboard/notifications" && !hasPermission(PERMISSIONS.RECEIVE_NOTIFICATIONS)) {
            return false;
          }

          if (item.url === "/dashboard/services" && !hasPermission(PERMISSIONS.CREATE_SERVICES)) {
            return false;
          }

          if (item.url === "/dashboard/admin" && !hasPermission(PERMISSIONS.VIEW_ADMIN)) {
            return false;
          }
        }

        if (userType === "agent") {
          const restrictedUrls = [
            "/dashboard/admin",
            "/dashboard/services",
            "/dashboard/agents",
            "/dashboard/vendors"
          ];
          return !restrictedUrls.includes(item.url);
        }

        // Existing filters for vendor
        if (userType === "vendor") {
          const restrictedUrls = [
            "/dashboard/admin",
            "/dashboard/vendors"
          ];
          return !restrictedUrls.includes(item.url);
        }

        return true;
      })
    }));
  return (
    <Sidebar
      {...props}
      collapsible="icon"
      className="p-0 font-alexandria border border-[#BBBBBB] z-20"
      style={{
        backgroundColor: roleSettings.sidebarBg,
        ['--sidebar-hover-bg' as string]: roleSettings.sidebarHoverBg,
        ['--sidebar-hover-text' as string]: roleSettings.sidebarHoverText,
      } as React.CSSProperties}
    >
      <SidebarHeader
        className="p-0 h-fit"
        style={{ backgroundColor: roleSettings.pageTabColor }}
      >
        <div className="flex flex-col p-4 w-full h-[80px]">
          <div className="flex items-center gap-x-2.5">
            {roleSettings.logo ? (
              <Image
                src={roleSettings.logo}
                alt="Logo"
                width={Number(roleSettings.logoWidth)}
                height={50}
                style={{ width: `${roleSettings.logoWidth}px`, height: 'auto' }}
                className="shrink-0"
              />
            ) : (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage
                  src={
                    userInfo?.avatar_url
                      ? `${userInfo.avatar_url}`
                      : "https://github.com/shadcn.png"
                  }
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            )}
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-[14px] font-normal text-white font-alexandria leading-4 truncate">BC Floor Plans</p>
                {userType !== 'admin' && (
                  <p className="text-[14px] font-normal text-white font-alexandria leading-4 truncate">Media Company Owner</p>
                )}
                <p className="text-[12px] font-normal text-white font-alexandria leading-4 truncate">{userInfo.first_name} {userInfo.last_name}</p>
              </div>
            )}
          </div>


        </div>
      </SidebarHeader>
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className={`
        absolute top-[55px]
        -right-3
        z-[70]
        flex items-center justify-center
        h-5 w-7
        rounded-[4px]
        bg-white
        border border-[#D1D5DB]
        shadow-sm
        text-[#6B7280]
        transition-all
  `}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-3" />
        ) : (
          <PanelLeftClose className="h-3" />
        )}
      </button>
      <div className="pt-[20px] px-[25px]" style={{ backgroundColor: roleSettings.sidebarBg }}>
        {showBackButton && !isCollapsed ? (
          <div
            className={`min-h-[32px] w-full flex items-center cursor-pointer rounded-[24px]`}
            style={{ backgroundColor: roleSettings.pageTabColor }}
            onClick={goToDashboardSection}
          >
            <div className="flex items-center px-[14px] py-[4px] gap-x-[10px]">
              <BackArrow />
              <p className="text-[16px] font-semibold text-white font-alexandria">BACK</p>
            </div>
          </div>
        ) : (
          <div className={`${!isCollapsed ? 'h-[32px]' : ''}`} />
        )}
      </div>
      <SidebarContent
        className={`pt-[20px] custom-scroll transition-all duration-200 !overflow-y-auto ${isCollapsed ? 'px-0' : 'px-[25px]'}`}
        style={{ backgroundColor: roleSettings.sidebarBg }}
      >
        {filteredNavMain.map((item) => (
          <SidebarGroup key={item.title}>
            {!isCollapsed && (
              <SidebarGroupLabel
                className="font-extrabold text-[12px] mb-2"
                style={{ color: roleSettings.sidebarText, opacity: 0.7 }}
              >
                {item.title}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              {item?.items && (
                <SidebarMenu>
                  {item.items.map((subItem) => {
                    const isActive = pathname === subItem.url || pathname.startsWith(`${subItem.url}/`);

                    return (
                      <SidebarMenuItem
                        className="!justify-items-center"
                        key={subItem.title}>
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className={`text-[16px] font-normal !justify-items-center flex gap-2 role-sidebar-item`}
                                style={{
                                  color: isActive ? roleSettings.activeColor : roleSettings.sidebarText,
                                  fontWeight: isActive ? 'bold' : 'normal',
                                  backgroundColor: isActive ? roleSettings.sidebarHoverBg : 'transparent'
                                }}
                              >
                                <SafeLink href={subItem.url} className="flex items-center gap-2 w-full">
                                  {subItem.icon && (
                                    <subItem.icon
                                      className={`h-4 w-4 shrink-0`}
                                      style={{ color: isActive ? roleSettings.activeColor : roleSettings.sidebarText }}
                                    />
                                  )}
                                  {!isCollapsed && <span>{subItem.title}</span>}
                                </SafeLink>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {isCollapsed && (
                              <TooltipContent
                                side="right"
                                className="bg-white border border-[#BBBBBB] text-[#424242] font-alexandria text-[14px] shadow-md"
                              >
                                {subItem.title}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </SidebarMenuItem>


                    );
                  })}

                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {/* {!isCollapsed && (
          <SidebarGroup>
            <SidebarGroupLabel
              className="font-extrabold text-[12px] mb-2"
              style={{ color: roleSettings.sidebarText, opacity: 0.7 }}
            >
              SEARCH
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm border w-full max-w-sm"
                style={{ backgroundColor: 'white', borderColor: roleSettings.sidebarText + '33' }}
              >
                <input
                  type="text"
                  placeholder="This page..."
                  className="bg-transparent outline-none w-full text-sm placeholder-gray-400"
                  style={{ color: roleSettings.sidebarText }}
                />
                <Search
                  className={`h-5 w-5 shrink-0`}
                  style={{ color: roleSettings.activeColor }}
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )} */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={logoutUser}
                className={`flex items-center gap-x-2.5 pb-[20px] cursor-pointer ${isCollapsed ? 'justify-center pt-4' : 'pt-[120px] px-[25px]'}`}
              >
                <LogOut
                  className="h-[18px] w-[18px] shrink-0"
                  style={{ color: roleSettings.sidebarText }}
                />
                {!isCollapsed && (
                  <p
                    className="text-[16px] font-normal"
                    style={{ color: roleSettings.sidebarText }}
                  >
                    Log Out
                  </p>
                )}
              </div>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent
                side="right"
                className="bg-white border border-[#BBBBBB] text-[#424242] font-alexandria text-[14px] shadow-md"
              >
                Log Out
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </SidebarContent>

    </Sidebar>
  )
}
