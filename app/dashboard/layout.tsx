'use client'
import { AppSidebar } from "@/components/app-sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";

import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { UnsavedProvider } from "../context/UnsavedContext";
import { WhiteLabelProvider, useWhiteLabel } from "../context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileMoreMenu from "@/components/mobile/MobileMoreMenu";

/** Map pathname to a human-readable page title for the mobile header */
function getPageTitle(pathname: string): string {
    if (pathname.includes('/calendar')) return 'Calendar';
    if (pathname.includes('/listings')) return 'Listings';
    if (pathname.includes('/orders')) return 'Orders';
    if (pathname.includes('/billing') && pathname.includes('/vendor')) return 'Earnings';
    if (pathname.includes('/billing')) return 'Billing';
    if (pathname.includes('/notifications')) return 'Notifications';
    if (pathname.includes('/services')) return 'Services';
    if (pathname.includes('/agents')) return 'Agents';
    if (pathname.includes('/vendors')) return 'Vendors';
    if (pathname.includes('/admin')) return 'Admin';
    if (pathname.includes('/global-settings')) return 'Settings';
    if (pathname.includes('/matterport')) return '3D / Matterport';
    if (pathname.includes('/file-manager')) return 'File Manager';
    if (pathname.includes('/invoice')) return 'Invoice';
    return 'Dashboard';
}

const DashboardLayoutContentInternal = ({ children }: { children: React.ReactNode }) => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];
    const isMobile = useIsMobile();
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);

    const pathname = usePathname();
    const searchParams = useSearchParams();

    const shouldHideSidebar = (() => {
        const isFileManagerRoute = pathname.includes("/file-manager");
        if (!isFileManagerRoute) return false;
        const isListing = searchParams.get('listingId');
        return !isListing;
    })();

    const pageTitle = getPageTitle(pathname);

    const [showBanner, setShowBanner] = useState(true);

    useEffect(() => {
        setShowBanner(true);
    }, [pathname]);

    const isOptimized = 
        pathname.includes('/calendar') ||
        pathname.includes('/orders') ||
        pathname.includes('/billing') ||
        pathname.includes('/vendor-billing') ||
        pathname.includes('/invoice') ||
        pathname.includes('/agent/tours');

    return (
        <>
            <SidebarProvider>
            {/* Desktop sidebar — hidden on mobile */}
            {!shouldHideSidebar && !isMobile && <AppSidebar variant="inset" />}

            <SidebarInset
                className={`flex-1 font-alexandria m-0 ${isMobile ? 'mobile-bottom-safe !p-0' : ''}`}
                style={{
                    backgroundColor: roleSettings.pageBg,
                }}
            >
                {/* Mobile header — shown only on mobile */}
                {isMobile && (
                    <MobileHeader title={pageTitle} />
                )}

                {isMobile && !isOptimized && showBanner && (
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-800 font-medium">
                        <div className="flex items-center gap-2">
                            <span>🖥️</span>
                            <span>This page is best viewed on a desktop screen.</span>
                        </div>
                        <button onClick={() => setShowBanner(false)} className="text-amber-500 hover:text-amber-700 font-bold p-1">
                            ✕
                        </button>
                    </div>
                )}
                <ProtectedAdminRoute>
                    {children}
                </ProtectedAdminRoute>
                {!isMobile && <ScrollToTop />}
            </SidebarInset>
        </SidebarProvider>

        {/* Mobile bottom nav + more menu — shown only on mobile */}
        {isMobile && (
            <>
                <MobileBottomNav onMoreClick={() => setMoreMenuOpen(true)} />
                <MobileMoreMenu
                    open={moreMenuOpen}
                    onClose={() => setMoreMenuOpen(false)}
                />
            </>
        )}
    </>
    );
};

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/login");
        } else {
            setIsCheckingAuth(false);
        }
    }, [router]);

    if (isCheckingAuth) {
        return null;
    }

    return (
        <div className="flex min-h-screen w-full">
            <WhiteLabelProvider>
                <UnsavedProvider>
                    <DashboardLayoutContentInternal>
                        {children}
                    </DashboardLayoutContentInternal>
                </UnsavedProvider>
            </WhiteLabelProvider>
        </div>
    );
}

import { UserProvider } from "@/context/UserContext";
import UserbackWidget from "@/components/UserbackWidget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <UserProvider>
                <UserbackWidget />
                <DashboardLayoutContent>
                    {children}
                </DashboardLayoutContent>
            </UserProvider>
        </Suspense>
    );
}