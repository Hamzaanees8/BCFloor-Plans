'use client'
import { AppSidebar } from "@/components/app-sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { OrderProvider } from "./orders/context/OrderContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const router = useRouter();
 const pathname = usePathname();
 const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Block rendering initially
 //const hideSidebarRoutes = ["/dashboard/file-manager"];
 const shouldHideSidebar = pathname.includes("/file-manager");

 useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
   router.replace("/login"); // Prevent back button showing /dashboard
  } else {
   setIsCheckingAuth(false); // Allow rendering
  }
 }, [router]);

 // Show nothing (or a loader) while checking
 if (isCheckingAuth) {
  return null; // or return <LoadingSpinner />
 }

 return (
  <div className="flex min-h-screen w-full">
   <OrderProvider>
    <SidebarProvider>
     {/* Sidebar */}
     {!shouldHideSidebar && <AppSidebar variant="inset" />}

     {/* Main content */}
     <div className="flex-1 overflow-x-hidden font-alexandria">
      <SidebarInset />
      {children}
      <ScrollToTop />
     </div>
    </SidebarProvider>
   </OrderProvider>
  </div>
 );
}