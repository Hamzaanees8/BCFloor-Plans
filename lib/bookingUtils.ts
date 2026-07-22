export interface SlotLike {
  date?: string;
  start_time?: string;
}

export interface OrderLike {
  slots?: SlotLike[];
  booking_datetime?: string;
  created_at?: string;
}

/**
 * Determines whether a booking/appointment date is in the past relative to current local time.
 */
export function isPastBooking(
  orderData?: OrderLike | null,
  bookingDatetimeStr?: string
): boolean {
  if (bookingDatetimeStr) {
    const dt = new Date(bookingDatetimeStr);
    if (!isNaN(dt.getTime())) {
      return dt.getTime() < Date.now();
    }
  }

  if (!orderData) return false;

  if (orderData.booking_datetime) {
    const dt = new Date(orderData.booking_datetime);
    if (!isNaN(dt.getTime())) {
      return dt.getTime() < Date.now();
    }
  }

  if (Array.isArray(orderData.slots) && orderData.slots.length > 0) {
    const earliest = orderData.slots.reduce<Date | null>((min, slot) => {
      if (!slot.date) return min;
      const cleanDate = slot.date.split("T")[0].split(" ")[0];
      const timePart = slot.start_time || "00:00:00";
      const dt = new Date(`${cleanDate}T${timePart}`);
      if (isNaN(dt.getTime())) {
        const altDt = new Date(`${cleanDate} ${timePart}`);
        if (isNaN(altDt.getTime())) return min;
        return !min || altDt < min ? altDt : min;
      }
      return !min || dt < min ? dt : min;
    }, null);

    if (earliest) {
      return earliest.getTime() < Date.now();
    }
  }

  return false;
}

/**
 * Determines whether an order or preview object has media files associated with it.
 */
export function hasOrderMedia(
  orderData?: any,
  previewData?: any
): boolean {
  if (!orderData && !previewData) return false;

  if (orderData) {
    if (orderData.has_media || orderData.has_files) return true;

    if (Array.isArray(orderData.files) && orderData.files.length > 0) return true;
    if (Array.isArray(orderData.photos) && orderData.photos.length > 0) return true;
    if (Array.isArray(orderData.videos) && orderData.videos.length > 0) return true;
    if (Array.isArray(orderData.attachments) && orderData.attachments.length > 0) return true;

    if (Array.isArray(orderData.tours) && orderData.tours.length > 0) {
      const hasFiles = orderData.tours.some(
        (t: any) =>
          (Array.isArray(t.files) && t.files.length > 0) ||
          (Array.isArray(t.snapshots) && t.snapshots.length > 0) ||
          (typeof t.file_count === "number" && t.file_count > 0) ||
          (typeof t.photo_count === "number" && t.photo_count > 0)
      );
      if (hasFiles) return true;
      return true;
    }

    if (
      (typeof orderData.media_count === "number" && orderData.media_count > 0) ||
      (typeof orderData.files_count === "number" && orderData.files_count > 0) ||
      (typeof orderData.photos_count === "number" && orderData.photos_count > 0)
    ) {
      return true;
    }
  }

  if (previewData) {
    if (
      previewData.has_media ||
      previewData.has_files ||
      previewData.has_photos ||
      previewData.has_videos
    ) {
      return true;
    }
    if (
      (typeof previewData.media_count === "number" && previewData.media_count > 0) ||
      (typeof previewData.files_count === "number" && previewData.files_count > 0) ||
      (typeof previewData.photos_count === "number" && previewData.photos_count > 0)
    ) {
      return true;
    }
  }

  return false;
}
