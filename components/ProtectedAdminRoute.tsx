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
      userType === "agent" &&
      pathname.startsWith("/dashboard/billing")
    ) {
      setIsAllowed(true);
      return;
    }

    if (
      userType === "vendor" &&
      (
        pathname.startsWith("/dashboard/vendors") ||
        pathname.startsWith("/dashboard/admin") ||
        pathname.startsWith("/dashboard/services") ||
        pathname.startsWith("/dashboard/listings/create") ||
        (pathname.startsWith("/dashboard/vendor-billing") && pathname.replace(/\/$/, "") !== "/dashboard/vendor-billing")
      )
    ) {
      router.replace("/dashboard/orders");
      setIsAllowed(false);
      return;
    }

    if (userType === "admin") {
      if (pathname.startsWith("/dashboard/vendor-billing")) {
        if (!hasPermission(PERMISSIONS.ACCESS_VENDOR_BILLING)) {
          toast.error("You do not have permission to access vendor billing");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/billing")) {
        if (!hasPermission(PERMISSIONS.ACCESS_BILLING)) {
          toast.error("You do not have permission to access billing");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/listings")) {
        if (!hasPermission(PERMISSIONS.VIEW_LISTING)) {
          toast.error("You do not have permission to access listings");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/admin/print-requests")) {
        if (!hasPermission(PERMISSIONS.PRINT_REQUESTS)) {
          toast.error("You do not have permission to access print requests");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/notifications")) {
        if (!hasPermission(PERMISSIONS.RECEIVE_NOTIFICATIONS)) {
          toast.error("You do not have permission to access notifications");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/orders/create")) {
        if (!hasPermission(PERMISSIONS.BOOK_APPOINTMENTS)) {
          toast.error("You do not have permission to create orders");
          router.replace("/dashboard/orders");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.includes("/dashboard/orders/") && pathname.includes("/edit")) {
        if (!hasPermission(PERMISSIONS.EDIT_APPOINTMENTS)) {
          toast.error("You do not have permission to edit orders");
          router.replace("/dashboard/orders");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/vendors")) {
        if (!hasPermission(PERMISSIONS.VIEW_VENDOR)) {
          toast.error("You do not have permission to view vendors");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
        if (pathname.includes("/edit") && !hasPermission(PERMISSIONS.UPDATE_VENDOR)) {
          toast.error("You do not have permission to update vendors");
          router.replace("/dashboard/vendors");
          setIsAllowed(false);
          return;
        }
        if (pathname.includes("/create") && !hasPermission(PERMISSIONS.CREATE_VENDOR)) {
          toast.error("You do not have permission to create vendors");
          router.replace("/dashboard/vendors");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/agents")) {
        if (!hasPermission(PERMISSIONS.VIEW_AGENT)) {
          toast.error("You do not have permission to view agents");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
        if (pathname.includes("/create") && !hasPermission(PERMISSIONS.CREATE_AGENT)) {
          toast.error("You do not have permission to create agents");
          router.replace("/dashboard/agents");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/services")) {
        if (!hasPermission(PERMISSIONS.VIEW_SERVICES)) {
          toast.error("You do not have permission to view services");
          router.replace("/dashboard/global-settings");
          setIsAllowed(false);
          return;
        }
        if (pathname.includes("/create") && !hasPermission(PERMISSIONS.CREATE_SERVICES)) {
          toast.error("You do not have permission to create services");
          router.replace("/dashboard/services");
          setIsAllowed(false);
          return;
        }
      }

      if (pathname.startsWith("/dashboard/calendar")) {
        setIsAllowed(true);
        return;
      }

      if (pathname.startsWith("/dashboard/orders") && !pathname.includes("/create") && !pathname.includes("/edit")) {
        if (!hasPermission(PERMISSIONS.VIEW_APPOINTMENTS)) {
          toast.error("You do not have permission to view orders");
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
        } else if (!pathname.includes("/print-requests")) {
          if (!hasPermission(PERMISSIONS.VIEW_ADMIN)) {
            toast.error("You do not have permission to view admins");
            router.replace("/dashboard/global-settings");
            setIsAllowed(false);
            return;
          }
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
