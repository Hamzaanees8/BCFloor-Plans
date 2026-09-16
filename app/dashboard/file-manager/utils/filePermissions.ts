/**
 * File Download Permission Helper
 * 
 * Centralizes permission logic for file downloads across the file manager.
 * 
 * Business Rules:
 * - Admins and vendors: always allowed to download their files
 * - Agents: can only download if:
 *   1. Service is paid OR Order is paid, AND
 *   2. File is marked as paid OR complimentary (complimentary requires payment first)
 *   3. File is approved by agent (is_agent_approved = true) if required
 *   4. File is visible (is_show = true)
 *   5. File is not deleted
 * 
 * Note: is_complimentary flag means the file cost is waived AFTER payment,
 * not that the file is free before payment.
 */

import { Files } from '../FileManagerContext';
import { Order, OrderService } from '../../orders/page';

export interface PermissionCheckParams {
  file: Files | null | undefined;
  currentService?: any; // OrderService or Services object
  orderData?: Order | null;
  userType?: string;
  requiresAgentApproval?: boolean;
}

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
  if (userType !== 'agent') {
    return true;
  }

  // For agents, stricter checks required
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
 * - If service.media_access === true: file is authorized (even if payment_status is REFUNDED)
 * - If service.media_access === false: file access is blocked
 * - If service.media_access == null: fallback to payment_status check (service or order is PAID)
 * - File must also be marked as is_paid OR is_complimentary
 * 
 * @param file - File object
 * @param currentService - Current service (optional, expects payment_status and media_access property)
 * @param orderData - Order data (optional)
 * @returns true if payment is authorized, false otherwise
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

  // Rule 0: Admin explicitly released media before payment
  if (orderData?.release_media_before_payment) {
    return true;
  }

  // File must be marked as paid or complimentary
  if (!file.is_paid && !file.is_complimentary) {
    return false;
  }

  // Find the matching service for this file
  const matchedService = currentService || (file.service && orderData?.services?.find(
    (s: OrderService) => s.service?.uuid === file.service?.uuid || s.uuid === file.service?.uuid || s.service_id === file.service?.id
  ));

  const mediaAccess = matchedService?.media_access !== undefined && matchedService?.media_access !== null
    ? matchedService.media_access
    : (matchedService?.service as any)?.media_access;

  // Rule 1: true -> always accessible
  if (mediaAccess === true) {
    return true;
  }

  // Rule 2: false -> always locked
  if (mediaAccess === false) {
    return false;
  }

  // Rule 3: null / undefined -> fallback to checking if service or order is PAID
  const isServicePaid =
    currentService?.payment_status === 'PAID' ||
    (file.service && orderData?.services?.some(
      (s: OrderService) => (s.service?.uuid === file.service?.uuid || s.uuid === file.service?.uuid) && s.payment_status === 'PAID'
    ));

  const isOrderPaid = orderData?.payment_status === 'PAID';

  return isServicePaid || isOrderPaid;
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

  if (userType === 'agent') {
    if (requiresAgentApproval && file.is_agent_approved === false) return 'File requires approval';

    // If admin released media before payment, bypass payment restriction reason
    if (orderData?.release_media_before_payment) {
      return '';
    }

    if (!file.is_paid && !file.is_complimentary) {
      return 'File is not available for download';
    }

    const matchedService = currentService || (file.service && orderData?.services?.find(
      (s: OrderService) => s.service?.uuid === file.service?.uuid || s.uuid === file.service?.uuid || s.service_id === file.service?.id
    ));

    const mediaAccess = matchedService?.media_access !== undefined && matchedService?.media_access !== null
      ? matchedService.media_access
      : (matchedService?.service as any)?.media_access;

    if (mediaAccess === false) {
      return 'Media access has been revoked';
    }

    if (mediaAccess !== true) {
      const isServicePaid =
        currentService?.payment_status === 'PAID' ||
        (file.service && orderData?.services?.some(
          (s: OrderService) => (s.service?.uuid === file.service?.uuid || s.uuid === file.service?.uuid) && s.payment_status === 'PAID'
        ));

      const isOrderPaid = orderData?.payment_status === 'PAID';

      if (!isServicePaid && !isOrderPaid) {
        return 'Service payment required';
      }
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
