"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function VendorBillingDashboard() {
    const router = useRouter();

    useEffect(() => {
        const userType = localStorage.getItem("userType");
        
        if (userType === "vendor") {
            router.replace("/dashboard/vendor-billing/my-invoices");
        } else {
            router.replace("/dashboard/vendor-billing/uninvoiced");
        }
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm">Loading Vendor Billing System...</p>
            </div>
        </div>
    );
}
