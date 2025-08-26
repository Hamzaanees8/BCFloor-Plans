"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
    const { userType } = useAppContext();
    const router = useRouter();
    const pathname = usePathname();
    const [checked, setChecked] = useState(false);
    console.log('pathname', pathname);

    useEffect(() => {

        if (userType === "agent" && (
            pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/services")
        )) {
            router.replace("/dashboard/orders");
        } else {
            setChecked(true);
        }
    }, [userType, pathname, router]);

    if (!checked) {
        return null;
    }

    return <>{children}</>;
}
