"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
    const { userType } = useAppContext();
    const pathname = usePathname();
    const router = useRouter();
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
useEffect(() => {
  if (!userType) return;

  // Blocked pages for agent
  if (
    userType === "agent" &&
    (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/services"))
  ) {
    router.replace("/dashboard/orders");
    setIsAllowed(false);
    return;
  }

  // Blocked pages for vendor
  if (
    userType === "vendor" &&
    (
      pathname.startsWith("/dashboard/vendors") ||
      pathname.startsWith("/dashboard/admin") ||
      pathname.startsWith("/dashboard/services/create") ||
      pathname.startsWith("/dashboard/listings/create")
    )
  ) {
    router.replace("/dashboard/orders");
    setIsAllowed(false);
    return;
  }

  // Allow admin
  if (userType === "admin") {
    setIsAllowed(true);
    return;
  }

  // Allow vendor (default pages)
  if (userType === "vendor") {
    setIsAllowed(true);
    return;
  }

  // ✅ Allow agent (default pages)
  if (userType === "agent") {
    setIsAllowed(true);
    return;
  }

  // Unknown user → /403
  router.replace("/403");
  setIsAllowed(false);
}, [userType, pathname, router]);


    if (isAllowed === null) return null;

    return <>{isAllowed && children}</>;
}
