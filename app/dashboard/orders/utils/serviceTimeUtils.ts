
export function calculateServiceDuration(squareFootage: number | undefined): number {
    if (!squareFootage || squareFootage <= 2000) {
        return 60;
    }

    const additionalSqFt = squareFootage - 2000;
    const additionalTime = Math.ceil(additionalSqFt / 1000) * 30;

    return 60 + additionalTime;
}


export function getEffectiveServiceDuration(
    serviceDuration: number | string | undefined,
    squareFootage: number | undefined
): number {
    const duration = typeof serviceDuration === 'string' ? parseInt(serviceDuration, 10) : serviceDuration;

    if (duration && duration > 0) {
        return duration;
    }

    return calculateServiceDuration(squareFootage);
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
