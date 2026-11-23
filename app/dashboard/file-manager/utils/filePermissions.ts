/**
 * File Download Permission Helper
 * 
 * Centralizes permission logic for file downloads across the file manager.
 * 
 * Business Rules:
 * - Admins and vendors: always allowed to download their files
 * - Agents and sub-accounts: can only download if:
 *   1. Service is not cancelled or media-access-revoked, AND
 *   2. Service/Order is PAID OR media is explicitly released (release_media_before_payment / media_access === true)
 *   3. File is approved by agent (is_agent_approved = true) if required
 *   4. File is visible (is_show = true)
 *   5. File is not deleted
 * 
 * Note: is_complimentary flag means the file cost is waived AFTER payment,
 * not that the file is free before payment.
 */

import type { Files } from '../FileManagerContext';
import type { Order, OrderService } from '../../orders/page';

export interface PermissionCheckParams {
  file: Files | null | undefined;
  currentService?: any; // OrderService or Services object
  orderData?: Order | null;
  userType?: string;
  requiresAgentApproval?: boolean;
}

export interface BookingDownloadStatus {
  isCancelled: boolean;
  isRevoked: boolean;
  isRefunded: boolean;
  isActuallyPaid: boolean;
  isMediaReleased: boolean;
  isDownloadReady: boolean;
}

/**
 * Determine whether a user type represents privileged staff (admin/superadmin/vendor).
 * Sub-accounts such as agent_admin, assistant, co_agent, or unhydrated empty strings
 * are treated with agent payment restrictions.
 */
export const isAdminOrVendorUser = (userType?: string): boolean => {
  const normalized = (userType || '').toLowerCase();
  return (
    normalized === 'admin' ||
    normalized === 'superadmin' ||
    normalized === 'super_admin' ||
    normalized === 'vendor'
  );
};

/**
 * Single source of truth for actual payment / media-release status of a booking or order,
 * independent of the logged-in user's role.
 */
export const getBookingDownloadStatus = (
  booking?: any | null,
  orderData?: Order | null,
): BookingDownloadStatus => {
  const bookingStatus = String(
    booking?.status || (booking?.service as any)?.status || '',
  )
    .toLowerCase()
    .trim();
  const isCancelled = bookingStatus === 'cancelled';

  const mediaAccess =
    booking?.media_access !== undefined && booking?.media_access !== null
      ? booking.media_access
      : (booking?.service as any)?.media_access;
  const isRevoked = mediaAccess === false;

  const bookingPaymentStatus = String(booking?.payment_status || '')
    .toUpperCase()
    .trim();
  const orderPaymentStatus = String(orderData?.payment_status || '')
    .toUpperCase()
    .trim();

  const isRefunded =
    bookingPaymentStatus === 'REFUNDED' ||
    (orderPaymentStatus === 'REFUNDED' && bookingPaymentStatus !== 'PAID');

  const isActuallyPaid =
    !isCancelled &&
    !isRevoked &&
    !isRefunded &&
    (bookingPaymentStatus === 'PAID' || orderPaymentStatus === 'PAID');

  const isMediaReleased =
    !isCancelled &&
    !isRevoked &&
    (Boolean(orderData?.release_media_before_payment) || mediaAccess === true);

  const isDownloadReady = isActuallyPaid || isMediaReleased;

  return {
    isCancelled,
    isRevoked,
    isRefunded,
    isActuallyPaid,
    isMediaReleased,
    isDownloadReady,
  };
};

const hasBookingFields = (svc: any): boolean =>
  Boolean(
    svc &&
      ('payment_status' in svc ||
        'media_access' in svc ||
        'order_id' in svc ||
        'service_id' in svc),
  );

const resolveOrderService = (
  file: Files,
  currentService?: any,
  orderData?: Order | null,
): any => {
  if (hasBookingFields(currentService)) {
    return currentService;
  }
  const targetUuid = currentService?.uuid || file.service?.uuid;
  const targetId = currentService?.id ?? file.service?.id ?? file.service_id;
  return orderData?.services?.find(
    (s: OrderService) =>
      (targetUuid && (s.service?.uuid === targetUuid || s.uuid === targetUuid)) ||
      (targetId != null &&
        (String(s.service_id) === String(targetId) ||
          String(s.service?.id) === String(targetId))),
  );
};

/**
 * Check if a user can download a specific file
 * 
 * @param params - Permission check parameters
 * @returns true if the file can be downloaded, false otherwise
 */
export const canDownloadFile = (params: PermissionCheckParams): boolean => {
  const {
    file,
    currentService,
    orderData,
    userType = 'guest',
    requiresAgentApproval = false,
  } = params;

  // No file provided
  if (!file) return false;

  // File is deleted
  if (file.is_deleted) return false;

  // File visibility check
  if (file.is_show === false) return false;

  // Admins and vendors can always download
  if (isAdminOrVendorUser(userType)) {
    return true;
  }

  // For agents and sub-accounts, stricter checks required
  return isAgentFileDownloadAllowed({
    file,
    currentService,
    orderData,
    requiresAgentApproval,
  });
};

/**
 * Check if an agent can download a specific file
 * This is where the payment and approval logic lives.
 * 
 * @param file - File object
 * @param currentService - Current service object (optional, OrderService with payment_status)
 * @param orderData - Order data (optional)
 * @param requiresAgentApproval - Whether file requires agent approval
 * @returns true if agent can download, false otherwise
 */
export const isAgentFileDownloadAllowed = ({
  file,
  currentService,
  orderData,
  requiresAgentApproval = false,
}: Omit<PermissionCheckParams, 'userType'>): boolean => {
  // Ensure file exists
  if (!file) return false;

  // Check if file requires agent approval
  if (requiresAgentApproval && !file.is_agent_approved) {
    return false;
  }

  // Check payment status
  const isPaymentAuthorized = isPaymentAuthorizationValid({
    file,
    currentService,
    orderData,
  });

  if (!isPaymentAuthorized) {
    return false;
  }

  return true;
};

/**
 * Check if payment authorization is valid for the file
 * 
 * Business Logic:
 * - Cancelled or media_access === false: locked
 * - release_media_before_payment === true or media_access === true: authorized
 * - Matched booking present: service or order must be PAID (and not refunded)
 * - No matched booking: fallback to order PAID or file.is_paid (when not refunded)
 */
export const isPaymentAuthorizationValid = ({
  file,
  currentService,
  orderData,
}: {
  file: Files | null | undefined;
  currentService?: any;
  orderData?: Order | null;
}): boolean => {
  if (!file) return false;

  const matchedService = resolveOrderService(file, currentService, orderData);
  const status = getBookingDownloadStatus(matchedService, orderData);

  if (status.isCancelled || status.isRevoked) {
    return false;
  }

  if (status.isMediaReleased) {
    return true;
  }

  if (matchedService) {
    return status.isActuallyPaid;
  }

  if (status.isRefunded) {
    return false;
  }

  return status.isActuallyPaid || Boolean(file.is_paid);
};

/**
 * Get a human-readable reason why the file cannot be downloaded
 * 
 * @param params - Permission check parameters
 * @returns reason string or empty string if allowed
 */
export const getDownloadBlockReason = (params: PermissionCheckParams): string => {
  const { file, currentService, orderData, userType, requiresAgentApproval = false } = params;

  if (!file) return 'File not found';

  if (file.is_deleted) return 'File has been deleted';

  if (file.is_show === false) return 'File is hidden';

  if (!isAdminOrVendorUser(userType)) {
    if (requiresAgentApproval && file.is_agent_approved === false) return 'File requires approval';

    const matchedService = resolveOrderService(file, currentService, orderData);
    const status = getBookingDownloadStatus(matchedService, orderData);

    if (status.isCancelled) {
      return 'Service has been cancelled';
    }

    if (status.isRevoked) {
      return 'Media access has been revoked';
    }

    if (status.isMediaReleased) {
      return '';
    }

    if (status.isRefunded) {
      return 'Service has been refunded';
    }

    const isPaid = matchedService
      ? status.isActuallyPaid
      : status.isActuallyPaid || Boolean(file.is_paid);

    if (!isPaid) {
      return 'Service payment required';
    }
  }

  return '';
};

/**
 * Batch check: filter downloadable files from a list
 * 
 * @param files - Array of files to check
 * @param orderData - Order data
 * @param userType - User type (agent, vendor, admin)
 * @returns filtered array of downloadable files
 */
export const getDownloadableFiles = (
  files: Files[] | undefined,
  orderData: Order | null | undefined,
  userType?: string
): Files[] => {
  if (!files) return [];

  return files.filter((file) =>
    canDownloadFile({
      file,
      orderData,
      userType,
    })
  );
};

/**
 * Check if ANY files in a list are downloadable
 * Useful for enabling/disabling "Download All" buttons
 * 
 * @param files - Array of files to check
 * @param orderData - Order data
 * @param userType - User type
 * @returns true if at least one file can be downloaded
 */
export const hasAnyDownloadableFiles = (
  files: Files[] | undefined,
  orderData: Order | null | undefined,
  userType?: string
): boolean => {
  if (!files) return false;

  return files.some((file) =>
    canDownloadFile({
      file,
      orderData,
      userType,
    })
  );
};
