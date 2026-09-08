import { Listings } from "@/lib/types";

export interface MediaApprovalStatus {
  requiresApproval: boolean;
  unapprovedCount: number;
  totalFiles: number;
}

export interface MediaApprovalBadge {
  label: string;
  color: string;
  tooltip: string;
}

/**
 * Checks if a property has vendor-uploaded media that requires admin approval.
 *
 * Detection priority:
 * 1. pendingOrderUuids — a Set of order UUIDs sourced from notifications of
 *    type "admin_approval_required". This is the reliable signal since the
 *    /properties API does not return is_admin_approved on files.
 * 2. Direct order-level flags (media_approval_required, has_unapproved_media, has_pending_approval)
 * 3. File-level is_admin_approved === false | 0 (only works if backend sends the field)
 */
export const checkMediaApprovalStatus = (
  listing: Listings | any,
  pendingOrderUuids?: Set<string>
): MediaApprovalStatus => {
  if (!listing || !listing.orders || !Array.isArray(listing.orders) || listing.orders.length === 0) {
    return { requiresApproval: false, unapprovedCount: 0, totalFiles: 0 };
  }

  // 1. Check notification-sourced pending order UUIDs (primary signal)
  if (pendingOrderUuids && pendingOrderUuids.size > 0) {
    for (const order of listing.orders) {
      if (order.uuid && pendingOrderUuids.has(order.uuid)) {
        return { requiresApproval: true, unapprovedCount: 1, totalFiles: 1 };
      }
    }
  }

  // 2. Check direct order-level flags if provided by backend
  for (const order of listing.orders) {
    if (
      order.media_approval_required === true ||
      order.has_unapproved_media === true ||
      order.has_pending_approval === true
    ) {
      return {
        requiresApproval: true,
        unapprovedCount: order.unapproved_files_count || 1,
        totalFiles: 1,
      };
    }
  }

  // 3. Check tour files across all orders (fallback — only if is_admin_approved is returned by backend)
  let unapprovedCount = 0;
  let totalFiles = 0;

  for (const order of listing.orders) {
    if (!order.tours || !Array.isArray(order.tours)) continue;

    for (const tour of order.tours) {
      if (!tour.files || !Array.isArray(tour.files)) continue;
      for (const file of tour.files) {
        totalFiles++;
        // File is explicitly marked as not approved by admin
        if (
          file.is_admin_approved === false ||
          file.is_admin_approved === 0 ||
          file.is_admin_approved === "0" ||
          file.is_admin_approved === "false"
        ) {
          unapprovedCount++;
        }
      }
    }
  }

  return {
    requiresApproval: unapprovedCount > 0,
    unapprovedCount,
    totalFiles,
  };
};

/**
 * Returns badge display metadata based on role and approval status.
 * Hidden for agents (clients shouldn't see internal review status).
 */
export const getMediaApprovalBadge = (
  status: MediaApprovalStatus,
  userType: string = "admin"
): MediaApprovalBadge | null => {
  if (!status.requiresApproval) return null;

  // Do not expose internal approval workflow to agents / clients
  if (userType === "agent") return null;

  if (userType === "vendor") {
    return {
      label: "Pending Approval",
      color: "bg-amber-100/90 text-amber-800 border-amber-300",
      tooltip: `Uploaded media is awaiting admin review (${status.unapprovedCount} file${status.unapprovedCount > 1 ? "s" : ""})`,
    };
  }

  // Admin view
  return {
    label: "Approval Pending",
    color: "bg-amber-100/90 text-amber-800 border-amber-300",
    tooltip: `Vendor media requires admin approval (${status.unapprovedCount} file${status.unapprovedCount > 1 ? "s" : ""})`,
  };
};
