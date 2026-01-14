"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppContext } from "@/app/context/AppContext";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PERMISSIONS } from "@/lib/permissions";
import { toast } from "sonner";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { userType } = useAppContext();
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);
  const { hasPermission, hasAnyPermission } = usePermissions();

  useEffect(() => {
    if (!userType) return;

    if (
      userType === "agent" &&
      (pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/services") || pathname.startsWith("/dashboard/vendor-billing"))
    ) {
      router.replace("/dashboard/orders");
      setIsAllowed(false);
      return;
    }

    if (
      userType === "vendor" &&
      (
        pathname.startsWith("/dashboard/vendors") ||
        pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/dashboard/services/create") ||
        pathname.startsWith("/dashboard/listings/create") ||
        pathname.startsWith("/dashboard/vendor-billing")
      )
    ) {
      router.replace("/dashboard/orders");
      setIsAllowed(false);
      return;
    }

    if (userType === "admin") {
      if (pathname.startsWith("/dashboard/billing") || pathname.startsWith("/dashboard/vendor-billing")) {
        if (!hasPermission(PERMISSIONS.ACCESS_BILLING)) {
          toast.error("You do not have permission to access this page");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/notifications")) {
        if (!hasPermission(PERMISSIONS.RECEIVE_NOTIFICATIONS)) {
          toast.error("You do not have permission to access this page");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/orders/create")) {
        if (!hasPermission(PERMISSIONS.CREATE_ORDERS)) {
          toast.error("You do not have permission to access this page");
          router.replace("/dashboard/orders");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.includes("/dashboard/orders/") && pathname.includes("/edit")) {
        if (!hasPermission(PERMISSIONS.EDIT_ORDERS)) {
          toast.error("You do not have permission to access this page");
          router.replace("/dashboard/orders");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/vendors") && pathname.includes("/edit")) {
        if (!hasPermission(PERMISSIONS.UPDATE_VENDOR)) {
          toast.error("You do not have permission to access this page");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
        if (!hasPermission(PERMISSIONS.CREATE_VENDOR) && pathname.includes("/create")) {
          toast.error("You do not have permission to create vendors");
          router.replace("/dashboard/vendors");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/agents")) {
        if (!hasPermission(PERMISSIONS.CREATE_AGENT)) {
          toast.error("You do not have permission to access this page");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/services/create") && pathname.includes("/create")) {
        if (!hasPermission(PERMISSIONS.CREATE_SERVICES)) {
          toast.error("You do not have permission to access this page");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/admin")) {
        if (pathname.includes("/create")) {
          if (!hasPermission(PERMISSIONS.CREATE_ADMIN)) {
            toast.error("You do not have permission to create admins");
            router.replace("/dashboard/admin");
            setIsAllowed(false);
            return;
          }
        } else {
          // if (!hasPermission(PERMISSIONS.VIEW_ADMIN)) {
          //   toast.error("You do not have permission to access this page");
          //   router.replace("/dashboard/global-settings");
          //   setIsAllowed(false);
          //   return;
          // }
        }
      }

      setIsAllowed(true);
      return;
    }

    if (userType === "vendor") {
      setIsAllowed(true);
      return;
    }

    if (userType === "agent") {
      setIsAllowed(true);
      return;
    }

    router.replace("/403");
    setIsAllowed(false);
  }, [userType, pathname, router, hasPermission, hasAnyPermission]);


  if (isAllowed === null) return null;

  return <>{isAllowed && children}</>;
}
