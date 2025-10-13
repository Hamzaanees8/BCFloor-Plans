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
  SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation";
import { Bell, Calendar, File, LogOut, PanelTop, Search, Settings, Sliders, UserCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Admin, BackArrow, Listings, SubAccounts, Vendors } from "./Icons";
import { Logout } from "@/app/(auth)/logout";
import { useAppContext } from "@/app/context/AppContext";
import SafeLink from "./SafeLink";
import { useUnsaved } from "@/app/context/UnsavedContext";

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
          icon: Listings,
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
        {
          title: "Sub Accounts",
          url: "/dashboard/sub-accounts",
          icon: SubAccounts,
        },
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
        {
          title: "Sub Accounts",
          url: "/dashboard/sub-accounts",
          icon: SubAccounts,
        },
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
      ],
    },
  ],
}


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userType } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split('/').filter(Boolean);
  const showBackButton = pathSegments.length > 2;
  const { confirmNavigation } = useUnsaved();
  //const parentPath = `/${pathSegments.slice(0, -1).join('/')}`;
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");

  async function logoutUser() {
    const token = localStorage.getItem("token");

    if (!token) {
      console.warn("No token found");
      return;
    }

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userType");
      localStorage.removeItem("userInfo");
      router.push("/login-user");
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
    const pathParts = pathname.split('/').filter(Boolean);
    const dashboardSection = pathParts.slice(0, 2).join('/');
    confirmNavigation(() => router.push(`/${dashboardSection}`), {
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
        // Special handling for Sub Accounts
        if (item.url === "/dashboard/sub-accounts") {
          return (userType === "admin" && group.title === "PEOPLE") ||
            (userType === "agent" && group.title === "DATA");
        }

        if ((userType === "agent" || userType === "vendor") && item.url === "/dashboard/global-settings") {
          item.title = "Settings";
        }

        // Existing filters for agent
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
    <Sidebar {...props} className="p-0 bg-[#E4E4E4] font-alexandria border border-[#BBBBBB]">
      <SidebarHeader className={`${userType}-bg p-0 h-[80px]`}>
        <div className="flex items-center p-4 gap-x-2.5">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={
                userInfo?.avatar_url
                  ? `${userInfo.avatar_url}`
                  : "https://github.com/shadcn.png"
              }
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-[14px] font-normal text-white font-alexandria leading-4">BC Floor Plans</p>
            <p className="text-[14px] font-normal text-white font-alexandria leading-4">Media Company Owner</p>
            <p className="text-[12px] font-normal text-white font-alexandria leading-4">{userInfo.first_name} {userInfo.last_name}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#E4E4E4] pt-[20px] px-[25px] sidebar-scroll">
        <div >
          {showBackButton ? (
            <div
              className={`min-h-[32px] w-[200px] flex items-center cursor-pointer rounded-[24px] ${userType}-bg`}
              onClick={goToDashboardSection}
            >
              <div className="flex items-center px-[14px] py-[4px] gap-x-[10px]">
                <BackArrow />
                <p className="text-[16px] font-semibold text-white font-alexandria">BACK</p>
              </div>
            </div>
          ) : (
            <div className="h-[32px]" />
          )}
        </div>
        {filteredNavMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="font-extrabold text-[12px] text-[#BBBBBB]">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              {item?.items && (
                <SidebarMenu>
                  {item.items.map((subItem) => {
                    const isActive = pathname === subItem.url || pathname.startsWith(`${subItem.url}/`);

                    return (
                      <SidebarMenuItem key={subItem.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`text-[16px] font-normal flex items-center gap-2 
                             ${isActive ? `${userType}-text !font-bold` : "text-[#7D7D7D] hover:text-[#7D7D7D]"}`}
                        >
                          <SafeLink href={subItem.url} className="flex items-center gap-2 w-full">
                            {subItem.icon && (
                              <subItem.icon
                                className={`h-4 w-4 ${isActive ? `${userType}-text` : "text-[#7D7D7D]"}`}
                              />
                            )}
                            <span>{subItem.title}</span>
                          </SafeLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>


                    );
                  })}

                </SidebarMenu>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup>
          <SidebarGroupLabel className="font-extrabold text-[12px] text-[#BBBBBB]">SEARCH</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border w-full max-w-sm">

              <input
                type="text"
                placeholder="This page..."
                className="bg-transparent outline-none w-full text-sm text-gray-700 placeholder-gray-400"
              />
              <Search className={`h-5 w-5 ${userType}-text`} />
            </div>
            <div onClick={logoutUser} className="flex items-center gap-x-2.5 pt-[196px] pb-[24px] cursor-pointer">
              <LogOut className="text-[#7D7D7D] h-[18px] w-[18px]" />
              <p className="text-[#7D7D7D] text-[16px] font-normal">Log Out</p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
