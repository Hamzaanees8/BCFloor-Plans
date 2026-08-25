
import { addMinutes, format, parse, differenceInMinutes } from 'date-fns';

export function calculateServiceDuration(
    squareFootage: number | string | undefined,
    baseDuration: number = 60
): number {
    const sqFtNum = typeof squareFootage === 'string'
        ? parseFloat(squareFootage.replace(/,/g, ''))
        : Number(squareFootage);

    const base = (baseDuration && baseDuration > 0) ? baseDuration : 60;

    if (!sqFtNum || isNaN(sqFtNum) || sqFtNum <= 2000) {
        return base;
    }

    const additionalSqFt = sqFtNum - 2000;
    const additionalTime = Math.ceil(additionalSqFt / 500) * 30;

    return base + additionalTime;
}


export interface ServiceDurationOption {
    service_duration?: string | number | null;
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

    // ── Check if Option is a Per SqFt Rate Option ─────────────────────────────
    const isPerSqFtRate = (
        (option?.sq_ft_rate !== undefined && option?.sq_ft_rate !== null && option?.sq_ft_rate !== '' && !isNaN(Number(option.sq_ft_rate)) && Number(option.sq_ft_rate) > 0) ||
        (typeof option?.title === 'string' && option.title.toLowerCase().includes('per sqft'))
    );

    // ── LEVEL 1: Product Option service_duration (Highest Priority) ──────────
    const optionDurationRaw = option?.service_duration;
    let optionDuration: number | null = null;
    if (optionDurationRaw !== undefined && optionDurationRaw !== null && optionDurationRaw !== '') {
        const parsed = typeof optionDurationRaw === 'string' ? parseInt(optionDurationRaw, 10) : Number(optionDurationRaw);
        if (!isNaN(parsed) && parsed > 0) {
            optionDuration = parsed;
        }
    }

    if (optionDuration !== null) {
        if (!isPerSqFtRate) {
            // Fixed flat duration for fixed tier option (e.g. Matterport sqft range options)
            return optionDuration;
        }

        // Per-sqft rate option: Option duration acts as base duration for <= base_sq_ft.
        // For property size above base_sq_ft, apply service increment rules!
        const baseDuration = optionDuration;
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
        const effectiveIncMins = !isNaN(incMins) ? incMins : 30;

        if (!sqFtNum || isNaN(sqFtNum) || sqFtNum <= effectiveBaseSqFt) {
            return baseDuration;
        }

        const excessSqFt = sqFtNum - effectiveBaseSqFt;
        const increments = Math.ceil(excessSqFt / effectiveIncSqFt);
        return baseDuration + (increments * effectiveIncMins);
    }

    // ── LEVEL 2: Service Base Time & Increments (Second Priority) ────────────
    const baseDurationRaw = service?.base_duration_mins;
    if (baseDurationRaw !== undefined && baseDurationRaw !== null && baseDurationRaw !== '') {
        const baseDuration = typeof baseDurationRaw === 'string' ? parseInt(baseDurationRaw, 10) : Number(baseDurationRaw);
        if (!isNaN(baseDuration) && baseDuration > 0) {
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
            const effectiveIncMins = !isNaN(incMins) ? incMins : 30;

            if (!sqFtNum || isNaN(sqFtNum) || sqFtNum <= effectiveBaseSqFt) {
                return baseDuration;
            }

            const excessSqFt = sqFtNum - effectiveBaseSqFt;
            const increments = Math.ceil(excessSqFt / effectiveIncSqFt);
            return baseDuration + (increments * effectiveIncMins);
        }
    }

    // ── LEVEL 3: Default Hardcoded Calculation Fallback (Third Priority) ─────
    return calculateServiceDuration(squareFootage ?? undefined, 60);
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
