'use client'
import { AppSidebar } from "@/components/app-sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import { OrderProvider } from "./orders/context/OrderContext";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import { UnsavedProvider } from "../context/UnsavedContext";
import { WhiteLabelProvider, useWhiteLabel } from "../context/Whitelabel";
import { useAppContext } from "@/app/context/AppContext";

const DashboardLayoutContentInternal = ({ children }: { children: React.ReactNode }) => {
    const { userType } = useAppContext();
    const { appliedSettings } = useWhiteLabel();
    const role = (userType as string) || 'admin';
    const roleSettings = appliedSettings[role as keyof typeof appliedSettings] || appliedSettings['admin'];

    const pathname = usePathname();
    const searchParams = useSearchParams();

    const shouldHideSidebar = (() => {
        const isFileManagerRoute = pathname.includes("/file-manager");
        if (!isFileManagerRoute) return false;
        const isListing = searchParams.get('listingId');
        return !isListing;
    })();

    return (
        <SidebarProvider>
            {!shouldHideSidebar && <AppSidebar variant="inset" />}
            <SidebarInset
                className="flex-1 font-alexandria m-0"
                style={{ backgroundColor: roleSettings.pageBg }}
            >
                <ProtectedAdminRoute>
                    {children}
                </ProtectedAdminRoute>
                <ScrollToTop />
            </SidebarInset>
        </SidebarProvider>
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
                    <OrderProvider>
                        <DashboardLayoutContentInternal>
                            {children}
                        </DashboardLayoutContentInternal>
                    </OrderProvider>
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