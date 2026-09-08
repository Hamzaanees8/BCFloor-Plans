
import { addMinutes, format, parse, differenceInMinutes } from 'date-fns';

export function calculateServiceDuration(
    squareFootage: number | string | undefined,
    baseDuration: number = 60,
    baseSqFt: number = 2000,
    incrementDuration: number = 30,
    incrementSqFt: number = 1000
): number {
    const sqFtNum = typeof squareFootage === 'string'
        ? parseFloat(squareFootage.replace(/,/g, ''))
        : Number(squareFootage);

    const base = (baseDuration && baseDuration > 0) ? baseDuration : 60;
    const effectiveBaseSqFt = (baseSqFt && baseSqFt > 0) ? baseSqFt : 2000;
    const effectiveIncSqFt = (incrementSqFt && incrementSqFt > 0) ? incrementSqFt : 1000;
    const effectiveIncMins = (incrementDuration && incrementDuration > 0) ? incrementDuration : 30;

    if (!sqFtNum || isNaN(sqFtNum) || sqFtNum <= effectiveBaseSqFt) {
        return base;
    }

    const additionalSqFt = sqFtNum - effectiveBaseSqFt;
    const additionalTime = Math.ceil(additionalSqFt / effectiveIncSqFt) * effectiveIncMins;

    return base + additionalTime;
}


export interface ServiceDurationOption {
    service_duration?: string | number | null;
    sq_ft_range?: string | null;
    isSqFtRange?: boolean;
    sq_ft_rate?: string | number | null;
    [key: string]: any;
}

export interface ServiceDurationService {
    base_duration_mins?: number | string | null;
    base_sq_ft?: number | string | null;
    increment_duration_mins?: number | string | null;
    increment_sq_ft?: number | string | null;
    [key: string]: any;
}

export function getEffectiveServiceDuration(
    optionOrDuration?: ServiceDurationOption | number | string | null,
    serviceOrSqFt?: ServiceDurationService | number | string | null,
    squareFootageInput?: number | string | null
): number {
    let option: ServiceDurationOption | null = null;
    let service: ServiceDurationService | null = null;
    let squareFootage: number | string | null | undefined = undefined;

    if (typeof optionOrDuration === 'object' && optionOrDuration !== null) {
        option = optionOrDuration;
        if (typeof serviceOrSqFt === 'object' && serviceOrSqFt !== null) {
            service = serviceOrSqFt;
            squareFootage = squareFootageInput;
        } else {
            squareFootage = serviceOrSqFt as number | string | null | undefined;
        }
    } else {
        if (optionOrDuration !== undefined && optionOrDuration !== null && !isNaN(Number(optionOrDuration)) && Number(optionOrDuration) > 0) {
            option = { service_duration: optionOrDuration };
        }
        if (typeof serviceOrSqFt === 'object' && serviceOrSqFt !== null) {
            service = serviceOrSqFt;
            squareFootage = squareFootageInput;
        } else {
            squareFootage = serviceOrSqFt as number | string | null | undefined;
        }
    }

    const sqFtNum = typeof squareFootage === 'string'
        ? parseFloat(squareFootage.replace(/,/g, ''))
        : Number(squareFootage);

    // ── Check if Option is a Fixed SqFt Range Tier Option ─────────────────────
    // Fixed tier options (e.g. Matterport tier "0 - 1500 sq ft") already account for size in the option.
    const isFixedSqFtRangeTier = Boolean(
        (option?.sq_ft_range && String(option.sq_ft_range).trim() !== '') ||
        option?.isSqFtRange === true
    );

    // 1. Determine Base Duration:
    // Option duration takes priority if set; otherwise Service base duration; fallback to 60
    const optionDurationRaw = option?.service_duration;
    let optionDuration: number | null = null;
    if (optionDurationRaw !== undefined && optionDurationRaw !== null && optionDurationRaw !== '') {
        const parsed = typeof optionDurationRaw === 'string' ? parseInt(optionDurationRaw, 10) : Number(optionDurationRaw);
        if (!isNaN(parsed) && parsed > 0) {
            optionDuration = parsed;
        }
    }

    const serviceBaseDurationRaw = service?.base_duration_mins;
    let serviceBaseDuration: number | null = null;
    if (serviceBaseDurationRaw !== undefined && serviceBaseDurationRaw !== null && serviceBaseDurationRaw !== '') {
        const parsed = typeof serviceBaseDurationRaw === 'string' ? parseInt(serviceBaseDurationRaw, 10) : Number(serviceBaseDurationRaw);
        if (!isNaN(parsed) && parsed > 0) {
            serviceBaseDuration = parsed;
        }
    }

    // If it's a fixed sqft range tier and has an option duration, return it directly without extra increments
    if (isFixedSqFtRangeTier && optionDuration !== null) {
        return optionDuration;
    }

    const baseDuration = optionDuration ?? serviceBaseDuration ?? 60;

    // 2. Read Service Increment Settings
    const baseSqFtRaw = service?.base_sq_ft;
    const baseSqFt = (baseSqFtRaw !== undefined && baseSqFtRaw !== null && baseSqFtRaw !== '')
        ? (typeof baseSqFtRaw === 'string' ? parseFloat(baseSqFtRaw) : Number(baseSqFtRaw))
        : 2000;

    const incSqFtRaw = service?.increment_sq_ft;
    const incSqFt = (incSqFtRaw !== undefined && incSqFtRaw !== null && incSqFtRaw !== '')
        ? (typeof incSqFtRaw === 'string' ? parseFloat(incSqFtRaw) : Number(incSqFtRaw))
        : 1000;

    const incMinsRaw = service?.increment_duration_mins;
    const incMins = (incMinsRaw !== undefined && incMinsRaw !== null && incMinsRaw !== '')
        ? (typeof incMinsRaw === 'string' ? parseInt(incMinsRaw, 10) : Number(incMinsRaw))
        : 30;

    const effectiveBaseSqFt = (!isNaN(baseSqFt) && baseSqFt > 0) ? baseSqFt : 2000;
    const effectiveIncSqFt = (!isNaN(incSqFt) && incSqFt > 0) ? incSqFt : 1000;
    const effectiveIncMins = (!isNaN(incMins) && incMins > 0) ? incMins : 30;

    // If no extra sq ft or square footage <= baseSqFt, return base duration
    if (!sqFtNum || isNaN(sqFtNum) || sqFtNum <= effectiveBaseSqFt) {
        return baseDuration;
    }

    // Calculate incremental time based on service settings
    const excessSqFt = sqFtNum - effectiveBaseSqFt;
    const increments = Math.ceil(excessSqFt / effectiveIncSqFt);
    return baseDuration + (increments * effectiveIncMins);
}



export function calculateSlotsDuration(slots: { start_time: string; end_time: string }[]): number {
    return slots.length * 15;
}


export function validateSlotDuration(
    selectedSlots: { start_time: string; end_time: string }[],
    requiredDuration: number
): { isValid: boolean; message: string; slotsNeeded: number } {
    const currentDuration = calculateSlotsDuration(selectedSlots);
    const slotsNeeded = Math.ceil((requiredDuration - currentDuration) / 15);

    if (currentDuration < requiredDuration) {
        return {
            isValid: false,
            message: `Please add ${slotsNeeded} more slot(s). Required: ${requiredDuration} min, Selected: ${currentDuration} min`,
            slotsNeeded
        };
    }

    if (currentDuration === requiredDuration) {
        return {
            isValid: true,
            message: 'All required time slots selected',
            slotsNeeded: 0
        };
    }

    return {
        isValid: false,
        message: `Too many slots selected. Required: ${requiredDuration} min, Selected: ${currentDuration} min`,
        slotsNeeded: 0
    };
}

export function splitSlotInto15MinChunks(
    startTime: string,
    endTime: string
): { start_time: string; end_time: string }[] {
    const chunks: { start_time: string; end_time: string }[] = [];
    const dateRef = '2000-01-01'; // Reference date for parsing time

    try {
        // Handle HH:mm:ss or HH:mm
        const parseTime = (timeStr: string) => {
            if (timeStr.split(':').length === 2) {
                return parse(`${dateRef} ${timeStr}`, 'yyyy-MM-dd HH:mm', new Date());
            }
            return parse(`${dateRef} ${timeStr}`, 'yyyy-MM-dd HH:mm:ss', new Date());
        };

        let currentStart = parseTime(startTime);
        const finalEnd = parseTime(endTime);

        // If endTime is before or equal to startTime, return empty (or original if preferred, but logic says empty)
        if (differenceInMinutes(finalEnd, currentStart) <= 0) {
            return [{ start_time: startTime, end_time: endTime }];
        }

        while (differenceInMinutes(finalEnd, currentStart) >= 15) {
            const currentEnd = addMinutes(currentStart, 15);
            chunks.push({
                start_time: format(currentStart, 'HH:mm:ss'),
                end_time: format(currentEnd, 'HH:mm:ss'),
            });
            currentStart = currentEnd;
        }

        // Handle any remaining time less than 15 mins (though in this system it should always be 15 min multiples)
        if (differenceInMinutes(finalEnd, currentStart) > 0) {
            chunks.push({
                start_time: format(currentStart, 'HH:mm:ss'),
                end_time: format(finalEnd, 'HH:mm:ss'),
            });
        }
    } catch (error) {
        console.error('Error splitting slots:', error);
        return [{ start_time: startTime, end_time: endTime }]; // Fallback
    }

    return chunks;
}

/**
 * Determines whether a given service requires travel/appointment slot scheduling.
 * If travel is disabled (false / 0 / '0' / 'false') or if it's a DIY print service (flyer / tabloid), returns false.
 */
export function isServiceRequiringTravel(
    service: any,
    catalogServices?: any[]
): boolean {
    if (!service) return true;

    const serviceUuid = typeof service === 'string' ? service : (service.uuid || service.service_id);
    const serviceId = typeof service === 'object' ? service.id : undefined;

    const globalService = catalogServices?.find(s =>
        (serviceUuid && s.uuid === serviceUuid) ||
        (serviceId && String(s.id) === String(serviceId)) ||
        (serviceUuid && String(s.id) === String(serviceUuid)) ||
        (serviceId && s.uuid && String(s.uuid) === String(serviceId))
    );

    const isExplicitlyFalse = (val: any) => {
        return val === false || val === 0 || val === '0' || val === 'false';
    };

    const checkObj = (obj: any) => {
        if (!obj || typeof obj !== 'object') return null;
        if (isExplicitlyFalse(obj.is_travel_required)) return false;
        if (isExplicitlyFalse(obj.allow_travel)) return false;
        if (isExplicitlyFalse(obj.allowed_travel)) return false;
        const type = (obj.type || '').toLowerCase();
        if (type === 'flyer' || type === 'tabloid' || type === 'design_and_print') return false;
        return null;
    };

    const directCheck = checkObj(service);
    if (directCheck !== null) return directCheck;

    const globalCheck = checkObj(globalService);
    if (globalCheck !== null) return globalCheck;

    return true;
}
