import { Files } from '../FileManagerContext';

/**
 * Photo-type services that are NOT counted as "photo" galleries
 * (floor plans are managed separately in their own tab).
 */
const EXCLUDED_SERVICE_NAMES = ['2D Floor Plans', '3D Floor Plans'];

/**
 * Filter files down to photo-gallery items only (no floor plans, no videos).
 */
export function filterPhotoFiles(files: Files[]): Files[] {
    return files.filter(
        (f) =>
            f.type === 'photo' &&
            !EXCLUDED_SERVICE_NAMES.includes(f.service?.name ?? '') &&
            f.variant_urls &&
            Object.keys(f.variant_urls).length > 0
    );
}

/**
 * Return all photo-gallery files sorted by their global sort_order (ascending).
 * When two files have the same sort_order (legacy data uploaded before global
 * ordering was applied), the tie-break is service_id ascending — this groups
 * each service's photos together in a stable, reproducible way.
 */
export function getGlobalPhotoOrder(files: Files[]): Files[] {
    return filterPhotoFiles(files).sort((a, b) => {
        const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        // Tie-break: service_id ascending (stable secondary sort for legacy data)
        return (a.service_id ?? 0) - (b.service_id ?? 0);
    });
}

/**
 * Given the globally reordered array of files, compute the updates needed:
 * each file receives a new sort_order equal to its 1-based global position.
 *
 * @returns Array of { uuid, sort_order } to send to the API / update context
 */
export function computeGlobalReorderUpdates(
    newOrder: Files[]
): { uuid: string; sort_order: number }[] {
    return newOrder.map((file, index) => ({
        uuid: file.uuid,
        sort_order: index + 1,
    }));
}

/**
 * For a SERVICE-LEVEL reorder: the set of sort_order values a service occupies
 * globally stays the same — only which file holds which value changes.
 *
 * Example:
 *   Service A currently owns global slots [3, 8, 15].
 *   User drags the file at slot 15 to first position.
 *   Result: that file → 3, next file → 8, last file → 15.
 *   Global slots [3, 8, 15] are still owned by Service A — other services untouched.
 *
 * @param sortedSlots   The current sort_order values for this service's uploaded
 *                      files, sorted ascending.
 * @param newOrderUuids The UUIDs of the service's uploaded files in the new
 *                      desired order (after drag).
 * @returns Array of { uuid, sort_order } updates.
 */
export function computeLocalReorderUpdates(
    sortedSlots: number[],
    newOrderUuids: string[]
): { uuid: string; sort_order: number }[] {
    return newOrderUuids.map((uuid, index) => ({
        uuid,
        sort_order: sortedSlots[index] ?? index + 1,
    }));
}

/**
 * Get the 1-based display rank of a file within its service's subset.
 * Used for "X of N" labels on the service tab — this is always computed,
 * never stored.
 *
 * @param fileUuid    UUID of the file whose rank you want.
 * @param allFiles    All files in filesData (used to build the service subset).
 * @param serviceUuid UUID of the service.
 */
export function getServiceDisplayRank(
    fileUuid: string,
    allFiles: Files[],
    serviceUuid: string
): number {
    const serviceFiles = allFiles
        .filter(
            (f) =>
                f.service?.uuid === serviceUuid &&
                !f.is_hidden &&
                !f.is_deleted
        )
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    const idx = serviceFiles.findIndex((f) => f.uuid === fileUuid);
    return idx >= 0 ? idx + 1 : 0;
}
